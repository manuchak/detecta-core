import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface RetentionMetrics {
  nrr: number | null; // Net Retention Rate %
  churnRate: number; // % clientes sin servicios en 60+ días
  csatPromedio: number | null;
  healthScoreGlobal: number | null;
  diasPromedioSinContacto: number;
  pctLealesPlus: number; // % clientes Leal+Promotor+Embajador
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
        .select('id, nombre_comercial, created_at')
        .eq('activo', true);
      if (cErr) throw cErr;
      const totalClientes = clientes?.length || 0;

      // Fetch servicios for NRR and churn calculation
      const { data: servicios, error: sErr } = await supabase
        .from('servicios_custodia')
        .select('nombre_cliente, cobro_cliente, fecha_servicio')
        .gte('fecha_servicio', format(subMonths(now, 6), 'yyyy-MM-dd'));
      if (sErr) throw sErr;

      // NRR: GMV current month / GMV previous month (existing clients only)
      const gmvMesActual = (servicios || [])
        .filter(s => {
          const d = s.fecha_servicio;
          return d && d >= format(mesActual, 'yyyy-MM-dd') && d <= format(endOfMonth(now), 'yyyy-MM-dd');
        })
        .reduce((sum, s) => sum + (Number(s.cobro_cliente) || 0), 0);

      const gmvMesAnterior = (servicios || [])
        .filter(s => {
          const d = s.fecha_servicio;
          return d && d >= format(mesAnterior, 'yyyy-MM-dd') && d < format(mesActual, 'yyyy-MM-dd');
        })
        .reduce((sum, s) => sum + (Number(s.cobro_cliente) || 0), 0);

      const nrr = gmvMesAnterior > 0 ? (gmvMesActual / gmvMesAnterior) * 100 : null;

      // Churn: clientes sin servicios en 60+ días
      const cutoff60d = format(subMonths(now, 2), 'yyyy-MM-dd');
      const clientesConServicioReciente = new Set(
        (servicios || [])
          .filter(s => s.fecha_servicio && s.fecha_servicio >= cutoff60d)
          .map(s => s.nombre_cliente?.toLowerCase().trim())
      );
      const clientesSinServicio = (clientes || []).filter(
        c => !clientesConServicioReciente.has(c.nombre_comercial?.toLowerCase().trim())
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

      // Días promedio sin contacto
      const { data: touchpoints, error: tErr } = await supabase
        .from('cs_touchpoints')
        .select('cliente_id, created_at');
      if (tErr) throw tErr;

      const nowMs = Date.now();
      const diasPorCliente = (clientes || []).map(c => {
        const cTps = (touchpoints || []).filter(t => t.cliente_id === c.id);
        if (!cTps.length) return 999;
        const last = cTps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        return Math.floor((nowMs - new Date(last.created_at).getTime()) / (1000 * 60 * 60 * 24));
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
            .filter(s => s.fecha_servicio && s.fecha_servicio >= mesStart && s.fecha_servicio <= mesEnd)
            .map(s => s.nombre_cliente?.toLowerCase().trim())
        );

        tendencia.push({
          mes: format(mes, 'MMM yy'),
          activos: clientesMes.size,
          nuevos: 0, // Would need historical data
          churned: 0,
        });
      }

      return {
        nrr,
        churnRate,
        csatPromedio,
        healthScoreGlobal: null, // Calculated from loyalty funnel
        diasPromedioSinContacto,
        pctLealesPlus: 0, // Calculated from loyalty funnel in component
        tendencia,
      } as RetentionMetrics;
    },
  });
}
