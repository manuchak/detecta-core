import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const cutoff90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Fetch all active clients
    const { data: clientes, error: cErr } = await supabase
      .from('pc_clientes')
      .select('id, nombre, activo')
      .eq('activo', true);
    if (cErr) throw cErr;

    // Fetch services data
    const [legacyRes, planRes, quejasRes, touchpointsRes] = await Promise.all([
      supabase.from('servicios_custodia').select('nombre_cliente, cobro_cliente, fecha_hora_cita'),
      supabase.from('servicios_planificados').select('nombre_cliente, cobro_posicionamiento, fecha_hora_cita'),
      supabase.from('cs_quejas').select('cliente_id, estado, calificacion_cierre'),
      supabase.from('cs_touchpoints').select('cliente_id, created_at'),
    ]);

    if (legacyRes.error) throw legacyRes.error;
    if (planRes.error) throw planRes.error;
    if (quejasRes.error) throw quejasRes.error;
    if (touchpointsRes.error) throw touchpointsRes.error;

    const planData = (planRes.data || []).map(s => ({
      nombre_cliente: s.nombre_cliente,
      cobro_cliente: s.cobro_posicionamiento,
      fecha_hora_cita: s.fecha_hora_cita,
    }));
    const allServicios = [...(legacyRes.data || []), ...planData];
    
    // Dedup
    const seen = new Set<string>();
    const servicios = allServicios.filter(s => {
      const key = `${s.nombre_cliente?.toLowerCase().trim()}|${s.fecha_hora_cita}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const quejas = quejasRes.data || [];
    const touchpoints = touchpointsRes.data || [];

    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const snapshots = (clientes || []).map(c => {
      const nombreNorm = c.nombre?.toLowerCase().trim();
      const cServicios = servicios.filter(s => s.nombre_cliente?.toLowerCase().trim() === nombreNorm);

      const servicios_mes = cServicios.filter(s => s.fecha_hora_cita?.startsWith(currentMonth)).length;
      const servicios_90d = cServicios.filter(s => s.fecha_hora_cita && s.fecha_hora_cita >= cutoff90d).length;

      const cQuejas = quejas.filter(q => q.cliente_id === c.id);
      const quejas_abiertas = cQuejas.filter(q => q.estado !== 'cerrada').length;
      const quejas_cerradas_mes = cQuejas.filter(q => q.estado === 'cerrada').length;
      const conCsat = cQuejas.filter(q => q.calificacion_cierre);
      const csat_promedio = conCsat.length
        ? conCsat.reduce((s, q) => s + (q.calificacion_cierre || 0), 0) / conCsat.length
        : null;

      const cTouchpoints = touchpoints.filter(t => t.cliente_id === c.id);
      const touchpoints_mes = cTouchpoints.filter(t => t.created_at?.startsWith(currentMonth)).length;

      // Last contact
      const fechas = cServicios.map(s => s.fecha_hora_cita).filter(Boolean).sort();
      const ultimoServicio = fechas[fechas.length - 1];
      const lastTp = cTouchpoints.length
        ? cTouchpoints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null;
      let lastContact: number | null = null;
      if (ultimoServicio) lastContact = new Date(ultimoServicio).getTime();
      if (lastTp) {
        const tpTime = new Date(lastTp).getTime();
        lastContact = lastContact ? Math.max(lastContact, tpTime) : tpTime;
      }
      const dias_sin_contacto = lastContact ? Math.floor((now.getTime() - lastContact) / (1000 * 60 * 60 * 24)) : 999;

      // Health score (0-100)
      let score = 100;
      if (quejas_abiertas >= 2) score -= 30;
      else if (quejas_abiertas >= 1) score -= 15;
      if (dias_sin_contacto > 60) score -= 25;
      else if (dias_sin_contacto > 30) score -= 10;
      if (servicios_90d === 0) score -= 20;
      if (csat_promedio && csat_promedio < 3) score -= 15;
      else if (csat_promedio && csat_promedio < 4) score -= 5;
      score = Math.max(0, Math.min(100, score));

      const riesgo_churn = score <= 40 ? 'alto' : score <= 70 ? 'medio' : 'bajo';

      return {
        cliente_id: c.id,
        periodo,
        score,
        quejas_abiertas,
        quejas_cerradas_mes,
        csat_promedio,
        servicios_mes,
        touchpoints_mes,
        riesgo_churn,
        notas: null,
      };
    });

    // Upsert snapshots
    const { error: upsertErr } = await supabase
      .from('cs_health_scores')
      .upsert(snapshots, { onConflict: 'cliente_id,periodo' });

    if (upsertErr) throw upsertErr;

    return new Response(
      JSON.stringify({ success: true, count: snapshots.length, periodo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
