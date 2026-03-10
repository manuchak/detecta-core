import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Verify caller is coordinator/admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) throw new Error("No autorizado");

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const coordRoles = ["admin", "owner", "monitoring_supervisor", "coordinador_operaciones"];
    const hasCoordRole = (callerRoles || []).some((r: any) => coordRoles.includes(r.role));
    if (!hasCoordRole) throw new Error("Solo coordinadores pueden reparar pausas huérfanas");

    const body = await req.json().catch(() => ({}));
    const { monitorista_id } = body;

    // Find orphan interina assignments: pausa_interina notes where asignado_por has no active pause
    let orphanQuery = admin
      .from("bitacora_asignaciones_monitorista")
      .select("id, servicio_id, monitorista_id, asignado_por")
      .eq("activo", true)
      .eq("notas_handoff", "pausa_interina");

    if (monitorista_id) {
      orphanQuery = orphanQuery.eq("asignado_por", monitorista_id);
    }

    const { data: interinas, error: intErr } = await orphanQuery;
    if (intErr) throw intErr;

    if (!interinas || interinas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No se encontraron pausas huérfanas", repaired: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by asignado_por (the original monitorista who went on pause)
    const byOriginal = new Map<string, typeof interinas>();
    for (const item of interinas) {
      const orig = item.asignado_por;
      if (!orig) continue;
      if (!byOriginal.has(orig)) byOriginal.set(orig, []);
      byOriginal.get(orig)!.push(item);
    }

    // For each original monitorista, check if they have an active pause
    const nowTs = new Date().toISOString();
    const hour = new Date().getHours();
    const turno = hour >= 6 && hour < 14 ? "matutino" : hour >= 14 && hour < 22 ? "vespertino" : "nocturno";
    let totalRepaired = 0;

    for (const [origId, assignments] of byOriginal) {
      const { data: activePause } = await admin
        .from("bitacora_pausas_monitorista")
        .select("id")
        .eq("monitorista_id", origId)
        .eq("estado", "activa")
        .maybeSingle();

      // If they have an active pause, this is NOT orphaned — skip
      if (activePause) continue;

      // Orphan confirmed: restore assignments
      for (const item of assignments) {
        // Deactivate the temporary interina
        await admin
          .from("bitacora_asignaciones_monitorista")
          .update({ activo: false, fin_turno: nowTs })
          .eq("servicio_id", item.servicio_id)
          .eq("activo", true);

        // Recreate for original monitorista
        await admin
          .from("bitacora_asignaciones_monitorista")
          .insert({
            servicio_id: item.servicio_id,
            monitorista_id: origId,
            asignado_por: user.id,
            turno,
            notas_handoff: "reparacion_pausa_huerfana",
          });

        totalRepaired++;
      }

      // Also close any stale pauses for this user (non-activa shouldn't exist but clean up)
      await admin.from("bitacora_anomalias_turno").insert({
        tipo: "pausa_huerfana_reparada",
        descripcion: `${assignments.length} asignaciones restauradas para monitorista sin pausa activa.`,
        ejecutado_por: user.id,
        monitorista_original: origId,
        metadata: { servicios_reparados: assignments.map((a) => a.servicio_id) },
      });
    }

    return new Response(
      JSON.stringify({ success: true, repaired: totalRepaired }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("reparar-pausa-huerfana error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
