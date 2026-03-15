import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_ROLES = ["monitoring_supervisor", "coordinador_operaciones", "admin", "owner"];
const MONITORING_ROLES = ["monitoring", "monitoring_supervisor"];

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

    // 1. Validate caller identity via JWT (getClaims)
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

    // 4. Validate target is a monitoring user (prevent force-logout of non-monitoristas)
    const { data: targetRoles, error: targetRoleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", monitorista_id)
      .eq("is_active", true);

    if (targetRoleErr) {
      console.error("Error checking target roles:", targetRoleErr);
      return new Response(JSON.stringify({ error: "Error validando usuario objetivo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasMonitoringRole = targetRoles?.some(r => MONITORING_ROLES.includes(r.role));
    if (!hasMonitoringRole) {
      return new Response(JSON.stringify({ error: "El usuario objetivo no es monitorista" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Force sign out — use GoTrue Admin REST API directly
    //    auth.admin.signOut() takes a JWT, not a userId, so we call the REST endpoint
    const warnings: string[] = [];

    try {
      const logoutRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${monitorista_id}/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceKey}`,
          "apikey": serviceKey,
        },
      });

      if (!logoutRes.ok) {
        const body = await logoutRes.text();
        console.warn(`GoTrue admin logout returned ${logoutRes.status}: ${body}`);
        warnings.push(`Session invalidation: ${logoutRes.status}`);
        // Best-effort: continue with DB cleanup even if session invalidation fails
        // JWT will expire naturally within jwt_expiry (3600s)
      } else {
        // Consume response body to prevent resource leak
        await logoutRes.text();
      }
    } catch (logoutErr: any) {
      console.warn("GoTrue admin logout failed:", logoutErr.message);
      warnings.push("Session invalidation failed — JWT expires in ≤1h");
    }

    // 6. Delete heartbeat so BalanceGuard drops them immediately
    const { error: heartbeatErr } = await admin
      .from("monitorista_heartbeat")
      .delete()
      .eq("user_id", monitorista_id);

    if (heartbeatErr) {
      console.warn("Heartbeat delete failed:", heartbeatErr.message);
      warnings.push("Heartbeat cleanup failed");
    }

    // 7. Deactivate all active assignments → OrphanGuard will pick them up
    const { data: deactivated, error: deactivateErr } = await admin
      .from("bitacora_asignaciones_monitorista")
      .update({ activo: false, fin_turno: new Date().toISOString() })
      .eq("monitorista_id", monitorista_id)
      .eq("activo", true)
      .select("id, servicio_id");

    if (deactivateErr) {
      console.error("CRITICAL: Assignment deactivation failed:", deactivateErr.message);
      // This is critical — if assignments aren't deactivated, services stay assigned to a ghost user
      return new Response(JSON.stringify({
        error: "Error crítico: no se pudieron liberar las asignaciones. Intente de nuevo.",
        warnings,
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const servicesReleased = deactivated?.length || 0;

    // 8. Finalize any active pauses
    const { error: pauseErr } = await admin
      .from("bitacora_pausas_monitorista")
      .update({ estado: "finalizada", fin_real: new Date().toISOString() })
      .eq("monitorista_id", monitorista_id)
      .eq("estado", "activa");

    if (pauseErr) {
      console.warn("Pause finalization failed:", pauseErr.message);
      warnings.push("Finalización de pausa falló");
    }

    // 9. Audit log in bitacora_anomalias_turno
    const { error: auditErr } = await admin
      .from("bitacora_anomalias_turno")
      .insert({
        tipo: "force_logout",
        descripcion: `Cierre de sesión forzado por coordinador. ${servicesReleased} servicio(s) liberado(s).`,
        monitorista_original: monitorista_id,
        ejecutado_por: callerId,
        metadata: {
          services_released: servicesReleased,
          released_service_ids: deactivated?.map(d => d.servicio_id) || [],
          caller_role: callerRole,
          warnings,
          timestamp: new Date().toISOString(),
        },
      });

    if (auditErr) {
      // Non-blocking but log it
      console.error("Audit log insert failed:", auditErr.message);
      warnings.push("Registro de auditoría falló");
    }

    console.log(`Force logout executed: target=${monitorista_id}, by=${callerId}, services_released=${servicesReleased}, warnings=${warnings.length}`);

    return new Response(
      JSON.stringify({
        ok: true,
        services_released: servicesReleased,
        warnings: warnings.length > 0 ? warnings : undefined,
      }),
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
