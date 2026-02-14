import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subMonths } from 'date-fns';

export interface CSHealthScore {
  id: string;
  cliente_id: string;
  periodo: string;
  score: number;
  quejas_abiertas: number;
  quejas_cerradas_mes: number;
  csat_promedio: number | null;
  servicios_mes: number;
  touchpoints_mes: number;
  riesgo_churn: string;
  notas: string | null;
  created_at: string;
  cliente?: { nombre: string; razon_social: string } | null;
}

export function useCSHealthScores() {
  return useQuery({
    queryKey: ['cs-health-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cs_health_scores')
        .select('*, cliente:pc_clientes(nombre, razon_social)')
        .order('periodo', { ascending: false });
      if (error) throw error;
      return data as CSHealthScore[];
    },
  });
}

export function useCSHealthScoreHistory(clienteId: string | null) {
  return useQuery({
    queryKey: ['cs-health-score-history', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cs_health_scores')
        .select('*')
        .eq('cliente_id', clienteId!)
        .order('periodo', { ascending: true })
        .limit(12);
      if (error) throw error;
      return data as CSHealthScore[];
    },
  });
}

export function useCSClientesConQuejas() {
  return useQuery({
    queryKey: ['cs-clientes-con-quejas'],
    queryFn: async () => {
      const now = Date.now();
      const cutoff90d = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      const mesActual = format(new Date(), 'yyyy-MM');
      const mesAnterior = format(subMonths(new Date(), 1), 'yyyy-MM');

      // Parallel fetches
      const [clientesRes, quejasRes, touchpointsRes, legacyRes, planRes] = await Promise.all([
        supabase.from('pc_clientes').select('id, nombre, razon_social').eq('activo', true).order('nombre'),
        supabase.from('cs_quejas').select('cliente_id, estado, calificacion_cierre'),
        supabase.from('cs_touchpoints').select('cliente_id, created_at'),
        supabase.from('servicios_custodia').select('nombre_cliente, cobro_cliente, fecha_hora_cita'),
        supabase.from('servicios_planificados').select('nombre_cliente, cobro_posicionamiento, fecha_hora_cita'),
      ]);

      if (clientesRes.error) throw clientesRes.error;
      if (quejasRes.error) throw quejasRes.error;
      if (touchpointsRes.error) throw touchpointsRes.error;
      if (legacyRes.error) throw legacyRes.error;
      if (planRes.error) throw planRes.error;

      const clientes = clientesRes.data || [];
      const quejas = quejasRes.data || [];
      const touchpoints = touchpointsRes.data || [];
      const planData = (planRes.data || []).map(s => ({ nombre_cliente: s.nombre_cliente, cobro_cliente: s.cobro_posicionamiento, fecha_hora_cita: s.fecha_hora_cita }));
      const allServicios = [...(legacyRes.data || []), ...planData];
      const seen = new Set<string>();
      const servicios = allServicios.filter(s => {
        const key = `${s.nombre_cliente?.toLowerCase().trim()}|${s.fecha_hora_cita}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return clientes.map(c => {
        const nombreNorm = c.nombre?.toLowerCase().trim();

        // Quejas
        const cQuejas = quejas.filter(q => q.cliente_id === c.id);
        const abiertas = cQuejas.filter(q => q.estado !== 'cerrada').length;
        const conCsat = cQuejas.filter(q => q.calificacion_cierre);
        const csat = conCsat.length
          ? conCsat.reduce((s, q) => s + (q.calificacion_cierre || 0), 0) / conCsat.length
          : null;

        // Touchpoints - last contact
        const cTouchpoints = touchpoints.filter(t => t.cliente_id === c.id);
        const lastTpDate = cTouchpoints.length
          ? cTouchpoints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;

        // Services for this client
        const cServicios = servicios.filter(
          s => s.nombre_cliente?.toLowerCase().trim() === nombreNorm
        );
        const fechas = cServicios.map(s => s.fecha_hora_cita).filter(Boolean).sort();
        const lastServiceDate = fechas[fechas.length - 1] || null;

        // dias_sin_contacto = MAX(lastService, lastTouchpoint)
        let lastContact: number | null = null;
        if (lastServiceDate) lastContact = new Date(lastServiceDate).getTime();
        if (lastTpDate) {
          const tpTime = new Date(lastTpDate).getTime();
          lastContact = lastContact ? Math.max(lastContact, tpTime) : tpTime;
        }
        const diasSinContacto = lastContact
          ? Math.floor((now - lastContact) / (1000 * 60 * 60 * 24))
          : 999;

        // Servicios recientes (90d)
        const servicios_recientes = cServicios.filter(
          s => s.fecha_hora_cita && s.fecha_hora_cita >= cutoff90d
        ).length;

        // GMV tendencia (mes actual vs anterior)
        const gmvActual = cServicios
          .filter(s => s.fecha_hora_cita?.startsWith(mesActual))
          .reduce((sum, s) => sum + (Number(s.cobro_cliente) || 0), 0);
        const gmvAnterior = cServicios
          .filter(s => s.fecha_hora_cita?.startsWith(mesAnterior))
          .reduce((sum, s) => sum + (Number(s.cobro_cliente) || 0), 0);

        let gmv_tendencia: 'up' | 'down' | 'stable' = 'stable';
        if (gmvAnterior > 0) {
          const cambio = (gmvActual - gmvAnterior) / gmvAnterior;
          if (cambio > 0.1) gmv_tendencia = 'up';
          else if (cambio < -0.1) gmv_tendencia = 'down';
        }

        // Risk level adjusted with service data
        let riesgo: string = 'bajo';
        if (abiertas >= 3 || (diasSinContacto > 60 && servicios_recientes === 0)) riesgo = 'critico';
        else if (abiertas >= 2 || (diasSinContacto > 30 && servicios_recientes === 0)) riesgo = 'alto';
        else if (abiertas >= 1) riesgo = 'medio';

        return {
          ...c,
          quejas_abiertas: abiertas,
          total_quejas: cQuejas.length,
          csat,
          diasSinContacto,
          riesgo,
          ultimo_contacto: lastContact ? new Date(lastContact).toISOString() : null,
          servicios_recientes,
          gmv_tendencia,
        };
      });
    },
  });
}
