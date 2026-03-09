import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, format, subMonths } from 'date-fns';

export interface FinanceOverviewData {
  // P&L MTD
  ingresosMTD: number;
  cxpMTD: number;
  margenMTD: number;
  margenPct: number;
  // Previous month same-day comparison
  ingresosPrevMTD: number;
  cxpPrevMTD: number;
  margenPrevMTD: number;
  // Variations
  ingresosVar: number;
  cxpVar: number;
  margenVar: number;
  // Attention metrics
  agingOver60Count: number;
  agingOver60Amount: number;
  sinFacturar15d: number;
  cxpPorDispersar: number;
  cxpPorDispersarMonto: number;
  // Pipeline CxP
  pipeline: {
    borrador: { count: number; monto: number };
    revision_ops: { count: number; monto: number };
    aprobado_finanzas: { count: number; monto: number };
    dispersado: { count: number; monto: number };
    pagado: { count: number; monto: number };
  };
  // Apoyos pendientes
  apoyosPendientes: number;
  apoyosPendientesMonto: number;
}

export function useFinanceOverview() {
  return useQuery({
    queryKey: ['finance-overview'],
    queryFn: async (): Promise<FinanceOverviewData> => {
      const now = new Date();
      const mtdStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const today = format(now, 'yyyy-MM-dd');
      const prevMtdStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const prevSameDay = format(subMonths(now, 0), 'yyyy-MM-dd'); // same day prev month
      const prevMonthSameDay = format(
        new Date(subMonths(now, 1).getFullYear(), subMonths(now, 1).getMonth(), Math.min(now.getDate(), 28)),
        'yyyy-MM-dd'
      );

      // Parallel queries
      const [
        serviciosMTD,
        serviciosPrev,
        cortesAll,
        apoyosPend,
      ] = await Promise.all([
        // MTD services (income)
        supabase
          .from('servicios_custodia')
          .select('cobro_cliente, costo_custodio, estado, fecha_hora_cita')
          .gte('fecha_hora_cita', mtdStart)
          .lte('fecha_hora_cita', today)
          .not('estado', 'eq', 'Cancelado'),
        // Previous MTD services
        supabase
          .from('servicios_custodia')
          .select('cobro_cliente, costo_custodio, estado, fecha_hora_cita')
          .gte('fecha_hora_cita', prevMtdStart)
          .lte('fecha_hora_cita', prevMonthSameDay)
          .not('estado', 'eq', 'Cancelado'),
        // All cortes semanales (for pipeline)
        supabase
          .from('cxp_cortes_semanales')
          .select('estado, monto_total')
          .order('created_at', { ascending: false })
          .limit(500),
        // Pending apoyos
        supabase
          .from('solicitudes_apoyo_extraordinario')
          .select('monto_solicitado')
          .eq('estado', 'pendiente'),
      ]);

      // Calculate MTD income
      const svcMTD = serviciosMTD.data || [];
      const ingresosMTD = svcMTD.reduce((s, r) => s + (parseFloat(String(r.cobro_cliente || 0))), 0);
      const costosMTD = svcMTD.reduce((s, r) => s + (parseFloat(String(r.costo_custodio || 0))), 0);

      // Previous MTD
      const svcPrev = serviciosPrev.data || [];
      const ingresosPrevMTD = svcPrev.reduce((s, r) => s + (parseFloat(String(r.cobro_cliente || 0))), 0);
      const costosPrevMTD = svcPrev.reduce((s, r) => s + (parseFloat(String(r.costo_custodio || 0))), 0);

      // CxP pipeline
      const cortes = cortesAll.data || [];
      const pipeline = {
        borrador: { count: 0, monto: 0 },
        revision_ops: { count: 0, monto: 0 },
        aprobado_finanzas: { count: 0, monto: 0 },
        dispersado: { count: 0, monto: 0 },
        pagado: { count: 0, monto: 0 },
      };
      for (const c of cortes) {
        const estado = c.estado as keyof typeof pipeline;
        if (pipeline[estado]) {
          pipeline[estado].count++;
          pipeline[estado].monto += Number(c.monto_total) || 0;
        }
      }

      const cxpMTD = costosMTD + pipeline.borrador.monto + pipeline.revision_ops.monto + pipeline.aprobado_finanzas.monto;
      const cxpPrevMTD = costosPrevMTD;
      const margenMTD = ingresosMTD - cxpMTD;
      const margenPrevMTD = ingresosPrevMTD - cxpPrevMTD;

      const variation = (current: number, prev: number) =>
        prev === 0 ? 0 : ((current - prev) / prev) * 100;

      // Apoyos
      const apoyosData = apoyosPend.data || [];
      const apoyosPendientesMonto = apoyosData.reduce((s, a) => s + (Number(a.monto_solicitado) || 0), 0);

      // CxP por dispersar (aprobado_finanzas)
      const cxpPorDispersar = pipeline.aprobado_finanzas.count;
      const cxpPorDispersarMonto = pipeline.aprobado_finanzas.monto;

      return {
        ingresosMTD,
        cxpMTD,
        margenMTD,
        margenPct: ingresosMTD > 0 ? (margenMTD / ingresosMTD) * 100 : 0,
        ingresosPrevMTD,
        cxpPrevMTD,
        margenPrevMTD,
        ingresosVar: variation(ingresosMTD, ingresosPrevMTD),
        cxpVar: variation(cxpMTD, cxpPrevMTD),
        margenVar: variation(margenMTD, margenPrevMTD),
        agingOver60Count: 0, // TODO: integrate with facturas_cliente when available
        agingOver60Amount: 0,
        sinFacturar15d: 0,
        cxpPorDispersar,
        cxpPorDispersarMonto,
        pipeline,
        apoyosPendientes: apoyosData.length,
        apoyosPendientesMonto,
      };
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
