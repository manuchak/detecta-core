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

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) throw new Error("No autorizado");

    const body = await req.json().catch(() => ({}));
    const { pausa_id, monitorista_id: targetMonitorista } = body;

    const admin = createClient(supabaseUrl, serviceKey);

    // If pausa_id or targetMonitorista provided, caller must be coordinator
    let pausaQuery = admin
      .from("bitacora_pausas_monitorista")
      .select("*")
      .eq("estado", "activa");

    if (pausa_id) {
      pausaQuery = pausaQuery.eq("id", pausa_id);
    } else if (targetMonitorista) {
      pausaQuery = pausaQuery.eq("monitorista_id", targetMonitorista);
    } else {
      pausaQuery = pausaQuery.eq("monitorista_id", user.id);
    }

    const { data: pausa, error: fetchErr } = await pausaQuery
      .order("inicio", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!pausa) throw new Error("No hay pausa activa para finalizar");

    // If forcing another user's pause, verify caller is coordinator
    if (pausa.monitorista_id !== user.id) {
      const { data: callerRoles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const coordRoles = ["admin", "owner", "monitoring_supervisor", "coordinador_operaciones"];
      const hasCoordRole = (callerRoles || []).some((r: any) => coordRoles.includes(r.role));
      if (!hasCoordRole) throw new Error("No tienes permisos para finalizar pausas de otros");
    }

    const nowTs = new Date().toISOString();
    const hour = new Date().getHours();
    const turno = hour >= 6 && hour < 14 ? "matutino" : hour >= 14 && hour < 22 ? "vespertino" : "nocturno";
    const redistribuidos = (pausa.servicios_redistribuidos || []) as Array<{
      servicio_id: string;
      assignment_original_id: string;
      asignado_temporalmente_a: string;
    }>;

    // Restore assignments
    for (const item of redistribuidos) {
      // Deactivate temporary (by service, Deactivate-by-Service pattern)
      await admin
        .from("bitacora_asignaciones_monitorista")
        .update({ activo: false, fin_turno: nowTs })
        .eq("servicio_id", item.servicio_id)
        .eq("activo", true);

      // Recreate original
      await admin
        .from("bitacora_asignaciones_monitorista")
        .insert({
          servicio_id: item.servicio_id,
          monitorista_id: pausa.monitorista_id,
          asignado_por: user.id,
          turno,
          notas_handoff: "retorno_pausa",
        });
    }

    // Mark pause as finalizada
    await admin
      .from("bitacora_pausas_monitorista")
      .update({ estado: "finalizada", fin_real: nowTs })
      .eq("id", pausa.id);

    // Log
    const forcedBy = pausa.monitorista_id !== user.id ? user.id : null;
    await admin.from("bitacora_anomalias_turno").insert({
      tipo: forcedBy ? "pausa_forzada_fin" : "pausa_finalizada",
      descripcion: forcedBy
        ? `Pausa de ${pausa.tipo_pausa} finalizada forzosamente por coordinador.`
        : `Pausa de ${pausa.tipo_pausa} finalizada. ${redistribuidos.length} servicios restaurados.`,
      ejecutado_por: user.id,
      monitorista_original: pausa.monitorista_id,
      metadata: { pausa_id: pausa.id, redistribuidos_count: redistribuidos.length, forced: !!forcedBy },
    });

    return new Response(
      JSON.stringify({ success: true, count: redistribuidos.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("finalizar-pausa-monitorista error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
