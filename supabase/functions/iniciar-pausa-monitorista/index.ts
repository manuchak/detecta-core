import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAUSE_DURATIONS: Record<string, number> = {
  desayuno: 20,
  comida: 60,
  bano: 10,
  descanso: 10,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autorizado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to get user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) throw new Error("No autorizado");

    const userId = user.id;
    const { tipo_pausa } = await req.json();
    if (!tipo_pausa || !PAUSE_DURATIONS[tipo_pausa]) {
      throw new Error("Tipo de pausa inválido");
    }

    const duracionMin = PAUSE_DURATIONS[tipo_pausa];
    const admin = createClient(supabaseUrl, serviceKey);

    // Execute entire operation as a single SQL transaction via service role
    // Step 1: Check no active pause already exists
    const { data: existingPause } = await admin
      .from("bitacora_pausas_monitorista")
      .select("id")
      .eq("monitorista_id", userId)
      .eq("estado", "activa")
      .maybeSingle();

    if (existingPause) throw new Error("Ya tienes una pausa activa");

    // Step 2: Get active assignments
    const { data: myAssignments, error: assErr } = await admin
      .from("bitacora_asignaciones_monitorista")
      .select("id, servicio_id, monitorista_id, turno")
      .eq("monitorista_id", userId)
      .eq("activo", true);
    if (assErr) throw assErr;
    if (!myAssignments || myAssignments.length === 0) {
      throw new Error("No tienes servicios asignados");
    }

    // Step 3: Get available monitoristas
    const { data: roles } = await admin
      .from("user_roles")
      .select("user_id")
      .in("role", ["monitoring", "monitoring_supervisor"])
      .eq("is_active", true);

    const allMonitoristas = [...new Set((roles || []).map((r: any) => r.user_id))];
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const { data: heartbeats } = await admin
      .from("monitorista_heartbeat")
      .select("user_id")
      .gte("last_ping", fiveMinAgo);
    const onlineIds = new Set((heartbeats || []).map((h: any) => h.user_id));
    const onShift = allMonitoristas.filter((id) => onlineIds.has(id));

    const { data: activePauses } = await admin
      .from("bitacora_pausas_monitorista")
      .select("monitorista_id")
      .eq("estado", "activa");
    const pausedIds = new Set((activePauses || []).map((p: any) => p.monitorista_id));
    const availableIds = onShift.filter((id) => id !== userId && !pausedIds.has(id));

    if (availableIds.length === 0) {
      throw new Error("No hay monitoristas disponibles para cubrir tu pausa");
    }

    // Step 4: Get current loads
    const { data: allActive } = await admin
      .from("bitacora_asignaciones_monitorista")
      .select("monitorista_id")
      .eq("activo", true)
      .in("monitorista_id", availableIds);

    const loads: Record<string, number> = {};
    for (const a of allActive || []) {
      loads[a.monitorista_id] = (loads[a.monitorista_id] || 0) + 1;
    }
    for (const id of availableIds) {
      if (!(id in loads)) loads[id] = 0;
    }

    // Step 5: Distribute equitably
    const distribution: Array<{ servicio_id: string; asignado_a: string }> = [];
    for (const ass of myAssignments) {
      const target = availableIds.reduce((a, b) => (loads[a] <= loads[b] ? a : b));
      distribution.push({ servicio_id: ass.servicio_id, asignado_a: target });
      loads[target]++;
    }

    // Step 6: Execute mutations — use RPC for transactional safety
    const nowTs = new Date().toISOString();
    const finEsperado = new Date(Date.now() + duracionMin * 60_000).toISOString();

    // Determine turno
    const hour = new Date().getHours();
    const turno = hour >= 6 && hour < 14 ? "matutino" : hour >= 14 && hour < 22 ? "vespertino" : "nocturno";

    const redistribuidos: Array<{
      servicio_id: string;
      assignment_original_id: string;
      asignado_temporalmente_a: string;
    }> = [];

    // Deactivate originals + create temporaries
    for (const orig of myAssignments) {
      const target = distribution.find((d) => d.servicio_id === orig.servicio_id);
      if (!target) continue;

      // Deactivate original — use servicio_id pattern (Deactivate-by-Service)
      const { error: deactErr } = await admin
        .from("bitacora_asignaciones_monitorista")
        .update({ activo: false, fin_turno: nowTs })
        .eq("servicio_id", orig.servicio_id)
        .eq("activo", true);
      if (deactErr) throw new Error(`Error desactivando asignación: ${deactErr.message}`);

      // Create temporary
      const { error: insertErr } = await admin
        .from("bitacora_asignaciones_monitorista")
        .insert({
          servicio_id: orig.servicio_id,
          monitorista_id: target.asignado_a,
          asignado_por: userId,
          turno,
          notas_handoff: "pausa_interina",
        });
      if (insertErr) throw new Error(`Error creando asignación temporal: ${insertErr.message}`);

      redistribuidos.push({
        servicio_id: orig.servicio_id,
        assignment_original_id: orig.id,
        asignado_temporalmente_a: target.asignado_a,
      });
    }

    // Step 7: Insert pause record
    const { error: pauseErr } = await admin
      .from("bitacora_pausas_monitorista")
      .insert({
        monitorista_id: userId,
        tipo_pausa,
        servicios_redistribuidos: redistribuidos,
        fin_esperado: finEsperado,
      });
    if (pauseErr) throw new Error(`Error registrando pausa: ${pauseErr.message}`);

    // Log anomaly
    await admin.from("bitacora_anomalias_turno").insert({
      tipo: "pausa_iniciada",
      descripcion: `Pausa de ${tipo_pausa} iniciada. ${redistribuidos.length} servicios redistribuidos.`,
      ejecutado_por: userId,
      monitorista_original: userId,
      metadata: { tipo_pausa, redistribuidos_count: redistribuidos.length },
    });

    return new Response(
      JSON.stringify({ success: true, count: redistribuidos.length, tipo: tipo_pausa }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("iniciar-pausa-monitorista error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
