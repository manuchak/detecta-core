import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_ROLES = ["monitoring_supervisor", "coordinador_operaciones", "admin", "owner"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Validate caller identity via JWT
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;

    // 2. Validate caller role using server-side RPC
    const { data: callerRole, error: roleErr } = await anonClient.rpc("get_current_user_role_secure");
    if (roleErr || !callerRole || !ALLOWED_ROLES.includes(callerRole)) {
      console.error("Role check failed:", { callerRole, roleErr });
      return new Response(JSON.stringify({ error: "Permisos insuficientes" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Parse request body
    const { monitorista_id } = await req.json();
    if (!monitorista_id || typeof monitorista_id !== "string") {
      return new Response(JSON.stringify({ error: "monitorista_id requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-logout
    if (monitorista_id === callerId) {
      return new Response(JSON.stringify({ error: "No puedes forzar tu propio cierre de sesión" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // 4. Force sign out — invalidates ALL sessions for the target user
    const { error: signOutErr } = await admin.auth.admin.signOut(monitorista_id, "global");
    if (signOutErr) {
      console.error("SignOut error:", signOutErr);
      // Continue anyway — session invalidation is best-effort, cleanup is critical
    }

    // 5. Delete heartbeat so BalanceGuard drops them immediately
    await admin
      .from("monitorista_heartbeat")
      .delete()
      .eq("user_id", monitorista_id);

    // 6. Deactivate all active assignments → OrphanGuard will pick them up
    const { data: deactivated } = await admin
      .from("bitacora_asignaciones_monitorista")
      .update({ activo: false, fin_turno: new Date().toISOString() })
      .eq("monitorista_id", monitorista_id)
      .eq("activo", true)
      .select("id");

    const servicesReleased = deactivated?.length || 0;

    // 7. Finalize any active pauses
    await admin
      .from("bitacora_pausas_monitorista")
      .update({ estado: "finalizada", fin_real: new Date().toISOString() })
      .eq("monitorista_id", monitorista_id)
      .eq("estado", "activa");

    // 8. Audit log in bitacora_anomalias_turno
    await admin
      .from("bitacora_anomalias_turno")
      .insert({
        tipo: "force_logout",
        descripcion: `Cierre de sesión forzado por coordinador. ${servicesReleased} servicio(s) liberado(s).`,
        monitorista_original: monitorista_id,
        ejecutado_por: callerId,
        metadata: {
          services_released: servicesReleased,
          caller_role: callerRole,
          timestamp: new Date().toISOString(),
        },
      });

    console.log(`Force logout executed: target=${monitorista_id}, by=${callerId}, services_released=${servicesReleased}`);

    return new Response(
      JSON.stringify({ ok: true, services_released: servicesReleased }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("force-logout-monitorista error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
