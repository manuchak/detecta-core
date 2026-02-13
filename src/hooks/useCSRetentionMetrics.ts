import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface RetentionMetrics {
  nrr: number | null;
  churnRate: number;
  csatPromedio: number | null;
  healthScoreGlobal: number | null;
  diasPromedioSinContacto: number;
  pctLealesPlus: number;
  tendencia: { mes: string; activos: number; nuevos: number; churned: number }[];
}

export function useCSRetentionMetrics() {
  return useQuery({
    queryKey: ['cs-retention-metrics'],
    queryFn: async () => {
      const now = new Date();
      const mesActual = startOfMonth(now);
      const mesAnterior = startOfMonth(subMonths(now, 1));

      // Fetch clientes activos
      const { data: clientes, error: cErr } = await supabase
        .from('pc_clientes')
        .select('id, nombre, created_at')
        .eq('activo', true);
      if (cErr) throw cErr;
      const totalClientes = clientes?.length || 0;

      // Fetch servicios from both tables for NRR and churn calculation
      const cutoff6m = format(subMonths(now, 6), 'yyyy-MM-dd');
      const [legacyRes, planRes] = await Promise.all([
        supabase.from('servicios_custodia').select('nombre_cliente, cobro_cliente, fecha_hora_cita').gte('fecha_hora_cita', cutoff6m),
        supabase.from('servicios_planificados').select('nombre_cliente, cobro_cliente, fecha_hora_cita').gte('fecha_hora_cita', cutoff6m),
      ]);
      if (legacyRes.error) throw legacyRes.error;
      if (planRes.error) throw planRes.error;
      const allServicios = [...(legacyRes.data || []), ...(planRes.data || [])];
      const seenSvc = new Set<string>();
      const servicios = allServicios.filter(s => {
        const key = `${s.nombre_cliente?.toLowerCase().trim()}|${s.fecha_hora_cita}`;
        if (seenSvc.has(key)) return false;
        seenSvc.add(key);
        return true;
      });

      // NRR
      const gmvMesActual = (servicios || [])
        .filter(s => {
          const d = s.fecha_hora_cita;
          return d && d >= format(mesActual, 'yyyy-MM-dd') && d <= format(endOfMonth(now), 'yyyy-MM-dd');
        })
        .reduce((sum, s) => sum + (Number(s.cobro_cliente) || 0), 0);

      const gmvMesAnterior = (servicios || [])
        .filter(s => {
          const d = s.fecha_hora_cita;
          return d && d >= format(mesAnterior, 'yyyy-MM-dd') && d < format(mesActual, 'yyyy-MM-dd');
        })
        .reduce((sum, s) => sum + (Number(s.cobro_cliente) || 0), 0);

      const nrr = gmvMesAnterior > 0 ? (gmvMesActual / gmvMesAnterior) * 100 : null;

      // Churn: clientes sin servicios en 60+ días
      const cutoff60d = format(subMonths(now, 2), 'yyyy-MM-dd');
      const clientesConServicioReciente = new Set(
        (servicios || [])
          .filter(s => s.fecha_hora_cita && s.fecha_hora_cita >= cutoff60d)
          .map(s => s.nombre_cliente?.toLowerCase().trim())
      );
      const clientesSinServicio = (clientes || []).filter(
        c => !clientesConServicioReciente.has(c.nombre?.toLowerCase().trim())
      ).length;
      const churnRate = totalClientes > 0 ? (clientesSinServicio / totalClientes) * 100 : 0;

      // CSAT promedio
      const { data: quejas, error: qErr } = await supabase
        .from('cs_quejas')
        .select('calificacion_cierre');
      if (qErr) throw qErr;
      const conCsat = (quejas || []).filter(q => q.calificacion_cierre);
      const csatPromedio = conCsat.length
        ? conCsat.reduce((s, q) => s + (q.calificacion_cierre || 0), 0) / conCsat.length
        : null;

      // Días promedio sin contacto — using MAX(ultimo_servicio, ultimo_touchpoint)
      const { data: touchpoints, error: tErr } = await supabase
        .from('cs_touchpoints')
        .select('cliente_id, created_at');
      if (tErr) throw tErr;

      const nowMs = Date.now();
      const diasPorCliente = (clientes || []).map(c => {
        const nombreNorm = c.nombre?.toLowerCase().trim();

        // Last service date for this client
        const clienteServicios = (servicios || []).filter(
          s => s.nombre_cliente?.toLowerCase().trim() === nombreNorm
        );
        const lastServiceDate = clienteServicios
          .map(s => s.fecha_hora_cita)
          .filter(Boolean)
          .sort()
          .pop();

        // Last touchpoint
        const cTps = (touchpoints || []).filter(t => t.cliente_id === c.id);
        const lastTpDate = cTps.length
          ? cTps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;

        // Use most recent of either
        let lastContact: number | null = null;
        if (lastServiceDate) lastContact = new Date(lastServiceDate).getTime();
        if (lastTpDate) {
          const tpTime = new Date(lastTpDate).getTime();
          lastContact = lastContact ? Math.max(lastContact, tpTime) : tpTime;
        }

        return lastContact
          ? Math.floor((nowMs - lastContact) / (1000 * 60 * 60 * 24))
          : 999;
      });
      const diasPromedioSinContacto = diasPorCliente.length
        ? Math.round(diasPorCliente.reduce((a, b) => a + b, 0) / diasPorCliente.length)
        : 0;

      // Tendencia 6 meses
      const tendencia = [];
      for (let i = 5; i >= 0; i--) {
        const mes = subMonths(now, i);
        const mesStart = format(startOfMonth(mes), 'yyyy-MM-dd');
        const mesEnd = format(endOfMonth(mes), 'yyyy-MM-dd');

        const clientesMes = new Set(
          (servicios || [])
            .filter(s => s.fecha_hora_cita && s.fecha_hora_cita >= mesStart && s.fecha_hora_cita <= mesEnd)
            .map(s => s.nombre_cliente?.toLowerCase().trim())
        );

        tendencia.push({
          mes: format(mes, 'MMM yy'),
          activos: clientesMes.size,
          nuevos: 0,
          churned: 0,
        });
      }

      return {
        nrr,
        churnRate,
        csatPromedio,
        healthScoreGlobal: null,
        diasPromedioSinContacto,
        pctLealesPlus: 0,
        tendencia,
      } as RetentionMetrics;
    },
  });
}
