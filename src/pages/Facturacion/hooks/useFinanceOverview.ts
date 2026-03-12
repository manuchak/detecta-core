import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, format, subMonths, subDays } from 'date-fns';

export interface FinanceOverviewData {
  // Real financial metrics MTD
  facturadoMTD: number;
  cobradoMTD: number;
  egresadoMTD: number;
  // GMV (theoretical gross value from servicios)
  gmvMTD: number;
  // Previous month same-day comparison
  facturadoPrevMTD: number;
  cobradoPrevMTD: number;
  egresadoPrevMTD: number;
  // Variations
  facturadoVar: number;
  cobradoVar: number;
  egresadoVar: number;
  // Attention metrics
  agingOver60Count: number;
  agingOver60Amount: number;
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
  // Apoyos por autorizar (aprobados por Ops, pendientes Finanzas)
  apoyosPorAutorizar: number;
  apoyosPorAutorizarMonto: number;
}

export function useFinanceOverview() {
  return useQuery({
    queryKey: ['finance-overview'],
    queryFn: async (): Promise<FinanceOverviewData> => {
      const now = new Date();
      const mtdStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const today = format(now, 'yyyy-MM-dd');
      const prevMtdStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const prevMonthSameDay = format(
        new Date(subMonths(now, 1).getFullYear(), subMonths(now, 1).getMonth(), Math.min(now.getDate(), 28)),
        'yyyy-MM-dd'
      );
      const aging60Date = format(subDays(now, 60), 'yyyy-MM-dd');

      const [
        facturasMTDRes,
        facturasPrevRes,
        pagosMTDRes,
        pagosPrevRes,
        cortesAll,
        apoyosAprobados,
        agingFacturas,
        gmvServiciosRes,
      ] = await Promise.all([
        // Facturas MTD (real invoiced)
        supabase
          .from('facturas')
          .select('total')
          .gte('fecha_emision', mtdStart)
          .lte('fecha_emision', today)
          .not('estado', 'eq', 'cancelada'),
        // Facturas prev month MTD
        supabase
          .from('facturas')
          .select('total')
          .gte('fecha_emision', prevMtdStart)
          .lte('fecha_emision', prevMonthSameDay)
          .not('estado', 'eq', 'cancelada'),
        // Pagos MTD (real collected)
        supabase
          .from('pagos')
          .select('monto')
          .gte('fecha_pago', mtdStart)
          .lte('fecha_pago', today),
        // Pagos prev month MTD
        supabase
          .from('pagos')
          .select('monto')
          .gte('fecha_pago', prevMtdStart)
          .lte('fecha_pago', prevMonthSameDay),
        // All cortes semanales (for pipeline + egresado)
        supabase
          .from('cxp_cortes_semanales')
          .select('estado, monto_total')
          .order('created_at', { ascending: false })
          .limit(500),
        // Apoyos aprobados por Ops, pendientes autorización Finanzas
        supabase
          .from('solicitudes_apoyo_extraordinario')
          .select('monto_solicitado')
          .eq('estado', 'aprobado'),
        // Aging >60 días: facturas vencidas hace más de 60 días, no pagadas ni canceladas
        supabase
          .from('facturas')
          .select('total')
          .lt('fecha_vencimiento', aging60Date)
          .not('estado', 'in', '("pagada","cancelada")'),
        // GMV (theoretical gross from servicios)
        supabase
          .from('servicios_custodia')
          .select('cobro_cliente')
          .gte('fecha_hora_cita', mtdStart)
          .lte('fecha_hora_cita', today)
          .not('estado', 'eq', 'Cancelado'),
      ]);

      // Facturado MTD
      const facturadoMTD = (facturasMTDRes.data || []).reduce((s, r) => s + (Number(r.total) || 0), 0);
      const facturadoPrevMTD = (facturasPrevRes.data || []).reduce((s, r) => s + (Number(r.total) || 0), 0);

      // Cobrado MTD
      const cobradoMTD = (pagosMTDRes.data || []).reduce((s, r) => s + (Number(r.monto) || 0), 0);
      const cobradoPrevMTD = (pagosPrevRes.data || []).reduce((s, r) => s + (Number(r.monto) || 0), 0);

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

      // Egresado MTD = cortes dispersados + pagados
      const egresadoMTD = pipeline.dispersado.monto + pipeline.pagado.monto;
      const egresadoPrevMTD = 0; // No historical cortes date filtering yet

      // GMV
      const gmvMTD = (gmvServiciosRes.data || []).reduce((s, r) => s + (parseFloat(String(r.cobro_cliente || 0))), 0);

      // Aging
      const agingData = agingFacturas.data || [];
      const agingOver60Count = agingData.length;
      const agingOver60Amount = agingData.reduce((s, r) => s + (Number(r.total) || 0), 0);

      // Apoyos por autorizar
      const apoyosData = apoyosAprobados.data || [];
      const apoyosPorAutorizarMonto = apoyosData.reduce((s, a) => s + (Number(a.monto_solicitado) || 0), 0);

      // CxP por dispersar (aprobado_finanzas)
      const cxpPorDispersar = pipeline.aprobado_finanzas.count;
      const cxpPorDispersarMonto = pipeline.aprobado_finanzas.monto;

      const variation = (current: number, prev: number) =>
        prev === 0 ? 0 : ((current - prev) / prev) * 100;

      return {
        facturadoMTD,
        cobradoMTD,
        egresadoMTD,
        gmvMTD,
        facturadoPrevMTD,
        cobradoPrevMTD,
        egresadoPrevMTD,
        facturadoVar: variation(facturadoMTD, facturadoPrevMTD),
        cobradoVar: variation(cobradoMTD, cobradoPrevMTD),
        egresadoVar: variation(egresadoMTD, egresadoPrevMTD),
        agingOver60Count,
        agingOver60Amount,
        cxpPorDispersar,
        cxpPorDispersarMonto,
        pipeline,
        apoyosPorAutorizar: apoyosData.length,
        apoyosPorAutorizarMonto,
      };
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
