import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, addDays, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ============= Types =============

export interface DSOMetrics {
  current: number;
  previous: number;
  trend: 'mejorando' | 'empeorando' | 'estable';
  trendPercent: number;
  benchmark: number; // Industry standard
  status: 'excelente' | 'bueno' | 'regular' | 'malo';
}

export interface DSOHistoryPoint {
  month: string;
  monthLabel: string;
  dso: number;
  facturado: number;
  cobrado: number;
}

export interface CashFlowProjection {
  fecha: string;
  fechaLabel: string;
  montoEsperado: number;
  montoAcumulado: number;
  numFacturas: number;
  probabilidad: number;
}

export interface CollectionEfficiency {
  mes: string;
  mesLabel: string;
  facturado: number;
  cobrado: number;
  eficiencia: number;
  diasPromedioCobro: number;
}

export interface PeriodComparison {
  metrica: string;
  actual: number;
  anterior: number;
  variacion: number;
  variacionPct: number;
  tendencia: 'up' | 'down' | 'neutral';
}

export interface FinancialReportData {
  dso: DSOMetrics;
  dsoHistory: DSOHistoryPoint[];
  cashFlowProjection: CashFlowProjection[];
  collectionEfficiency: CollectionEfficiency[];
  periodComparison: PeriodComparison[];
  summary: {
    totalCxC: number;
    proyeccion30d: number;
    eficienciaPromedio: number;
    diasPromedioGlobal: number;
  };
}

// ============= DSO Calculation Logic =============

/**
 * DSO = (Cuentas por Cobrar / Ventas del Período) × Días del Período
 * We calculate based on rolling averages for accuracy
 */
function calculateDSO(cxc: number, ventasPeriodo: number, diasPeriodo: number = 30): number {
  if (ventasPeriodo <= 0) return 0;
  return Math.round((cxc / ventasPeriodo) * diasPeriodo);
}

/**
 * Get DSO status based on industry benchmarks
 * - Excelente: < 30 días
 * - Bueno: 30-45 días
 * - Regular: 45-60 días
 * - Malo: > 60 días
 */
function getDSOStatus(dso: number): DSOMetrics['status'] {
  if (dso < 30) return 'excelente';
  if (dso <= 45) return 'bueno';
  if (dso <= 60) return 'regular';
  return 'malo';
}

function getDSOTrend(current: number, previous: number): DSOMetrics['trend'] {
  const diff = current - previous;
  if (diff < -3) return 'mejorando'; // DSO decreasing is good
  if (diff > 3) return 'empeorando';
  return 'estable';
}

// ============= Main Hook =============

export function useFinancialReports(monthsBack: number = 6) {
  return useQuery({
    queryKey: ['financial-reports', monthsBack],
    queryFn: async (): Promise<FinancialReportData> => {
      const today = new Date();
      const startDate = format(startOfMonth(subMonths(today, monthsBack)), 'yyyy-MM-dd');
      
      // Parallel queries for performance
      const [facturasResult, pagosResult, agingResult] = await Promise.all([
        // Get all facturas in the period
        supabase
          .from('facturas')
          .select('id, cliente_id, cliente_nombre, total, fecha_emision, fecha_vencimiento, estado, fecha_pago')
          .gte('fecha_emision', startDate)
          .not('estado', 'eq', 'cancelada')
          .order('fecha_emision', { ascending: true }),
        
        // Get all pagos in the period
        supabase
          .from('pagos')
          .select('id, factura_id, cliente_id, monto, fecha_pago, forma_pago')
          .gte('fecha_pago', startDate)
          .eq('estado', 'aplicado')
          .order('fecha_pago', { ascending: true }),
        
        // Get current aging data
        supabase
          .from('vw_aging_cuentas_cobrar')
          .select('*'),
      ]);

      if (facturasResult.error) throw facturasResult.error;
      if (pagosResult.error) throw pagosResult.error;
      if (agingResult.error) throw agingResult.error;

      const facturas = facturasResult.data || [];
      const pagos = pagosResult.data || [];
      const aging = agingResult.data || [];

      // Calculate total CxC
      const totalCxC = aging.reduce((sum, a) => sum + Number(a.saldo_pendiente || 0), 0);

      // ============= DSO History Calculation =============
      const dsoHistory: DSOHistoryPoint[] = [];
      
      for (let i = monthsBack - 1; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'MMM yy', { locale: es });

        // Facturas emitidas en el mes
        const monthFacturas = facturas.filter(f => {
          const fecha = parseISO(f.fecha_emision);
          return fecha >= monthStart && fecha <= monthEnd;
        });
        const facturado = monthFacturas.reduce((sum, f) => sum + Number(f.total || 0), 0);

        // Pagos recibidos en el mes
        const monthPagos = pagos.filter(p => {
          const fecha = parseISO(p.fecha_pago);
          return fecha >= monthStart && fecha <= monthEnd;
        });
        const cobrado = monthPagos.reduce((sum, p) => sum + Number(p.monto || 0), 0);

        // CxC al final del mes (simplified: facturado - cobrado acumulado)
        const cxcMes = Math.max(0, facturado - cobrado);
        const dso = calculateDSO(cxcMes, facturado, 30);

        dsoHistory.push({
          month: monthKey,
          monthLabel,
          dso,
          facturado,
          cobrado,
        });
      }

      // ============= DSO Current Metrics =============
      const currentMonth = dsoHistory[dsoHistory.length - 1];
      const previousMonth = dsoHistory[dsoHistory.length - 2];
      
      // Use real current CxC for DSO
      const totalFacturadoMes = currentMonth?.facturado || 1;
      const currentDSO = calculateDSO(totalCxC, totalFacturadoMes, 30);
      const previousDSO = previousMonth?.dso || currentDSO;

      const dso: DSOMetrics = {
        current: currentDSO,
        previous: previousDSO,
        trend: getDSOTrend(currentDSO, previousDSO),
        trendPercent: previousDSO > 0 ? Math.round(((currentDSO - previousDSO) / previousDSO) * 100) : 0,
        benchmark: 45, // Industry benchmark
        status: getDSOStatus(currentDSO),
      };

      // ============= Cash Flow Projection =============
      const cashFlowProjection: CashFlowProjection[] = [];
      
      // Get pending facturas
      const pendingFacturas = facturas.filter(f => 
        f.estado === 'pendiente' || f.estado === 'parcial' || f.estado === 'vencida'
      );

      // Group by expected payment date (using fecha_vencimiento)
      const projectionMap = new Map<string, { monto: number; count: number }>();
      
      pendingFacturas.forEach(f => {
        const vencimiento = f.fecha_vencimiento;
        if (!projectionMap.has(vencimiento)) {
          projectionMap.set(vencimiento, { monto: 0, count: 0 });
        }
        const entry = projectionMap.get(vencimiento)!;
        entry.monto += Number(f.total || 0);
        entry.count += 1;
      });

      // Create 30-day projection
      let acumulado = 0;
      for (let i = 0; i < 30; i++) {
        const fecha = format(addDays(today, i), 'yyyy-MM-dd');
        const fechaLabel = format(addDays(today, i), 'dd MMM', { locale: es });
        
        const dayData = projectionMap.get(fecha);
        const montoEsperado = dayData?.monto || 0;
        acumulado += montoEsperado;

        // Probability decreases for future dates
        const diasFuturos = i;
        const probabilidad = Math.max(0.3, 1 - (diasFuturos * 0.02));

        if (montoEsperado > 0 || i % 7 === 0) { // Include data points and weekly markers
          cashFlowProjection.push({
            fecha,
            fechaLabel,
            montoEsperado,
            montoAcumulado: acumulado,
            numFacturas: dayData?.count || 0,
            probabilidad: Math.round(probabilidad * 100),
          });
        }
      }

      // ============= Collection Efficiency by Month =============
      const collectionEfficiency: CollectionEfficiency[] = [];
      
      for (let i = monthsBack - 1; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const mesLabel = format(monthDate, 'MMM yy', { locale: es });

        const monthFacturas = facturas.filter(f => {
          const fecha = parseISO(f.fecha_emision);
          return fecha >= monthStart && fecha <= monthEnd;
        });
        
        const monthPagos = pagos.filter(p => {
          const fecha = parseISO(p.fecha_pago);
          return fecha >= monthStart && fecha <= monthEnd;
        });

        const facturado = monthFacturas.reduce((sum, f) => sum + Number(f.total || 0), 0);
        const cobrado = monthPagos.reduce((sum, p) => sum + Number(p.monto || 0), 0);
        
        const eficiencia = facturado > 0 ? Math.min(100, Math.round((cobrado / facturado) * 100)) : 100;

        // Calculate average days to collect
        let totalDiasCobro = 0;
        let facturasCobradas = 0;
        
        monthFacturas.forEach(f => {
          if (f.fecha_pago) {
            const diasCobro = differenceInDays(parseISO(f.fecha_pago), parseISO(f.fecha_emision));
            if (diasCobro >= 0) {
              totalDiasCobro += diasCobro;
              facturasCobradas++;
            }
          }
        });
        
        const diasPromedioCobro = facturasCobradas > 0 ? Math.round(totalDiasCobro / facturasCobradas) : 0;

        collectionEfficiency.push({
          mes: format(monthDate, 'yyyy-MM'),
          mesLabel,
          facturado,
          cobrado,
          eficiencia,
          diasPromedioCobro,
        });
      }

      // ============= Period Comparison (Current vs Previous Month) =============
      const thisMonth = collectionEfficiency[collectionEfficiency.length - 1];
      const lastMonth = collectionEfficiency[collectionEfficiency.length - 2];

      const createComparison = (
        metrica: string, 
        actual: number, 
        anterior: number,
        invertido: boolean = false // For metrics where lower is better
      ): PeriodComparison => {
        const variacion = actual - anterior;
        const variacionPct = anterior > 0 ? Math.round((variacion / anterior) * 100) : 0;
        
        let tendencia: 'up' | 'down' | 'neutral' = 'neutral';
        if (Math.abs(variacionPct) > 3) {
          const isPositive = variacion > 0;
          tendencia = invertido ? (isPositive ? 'down' : 'up') : (isPositive ? 'up' : 'down');
        }

        return { metrica, actual, anterior, variacion, variacionPct, tendencia };
      };

      const periodComparison: PeriodComparison[] = [
        createComparison('Facturado', thisMonth?.facturado || 0, lastMonth?.facturado || 0),
        createComparison('Cobrado', thisMonth?.cobrado || 0, lastMonth?.cobrado || 0),
        createComparison('Eficiencia (%)', thisMonth?.eficiencia || 0, lastMonth?.eficiencia || 0),
        createComparison('Días Promedio Cobro', thisMonth?.diasPromedioCobro || 0, lastMonth?.diasPromedioCobro || 0, true),
        createComparison('DSO', currentDSO, previousDSO, true),
      ];

      // ============= Summary =============
      const proyeccion30d = cashFlowProjection.reduce((sum, p) => sum + (p.montoEsperado * p.probabilidad / 100), 0);
      const eficienciaPromedio = collectionEfficiency.length > 0
        ? Math.round(collectionEfficiency.reduce((sum, e) => sum + e.eficiencia, 0) / collectionEfficiency.length)
        : 100;
      const diasPromedioGlobal = collectionEfficiency.length > 0
        ? Math.round(collectionEfficiency.filter(e => e.diasPromedioCobro > 0).reduce((sum, e) => sum + e.diasPromedioCobro, 0) / 
            collectionEfficiency.filter(e => e.diasPromedioCobro > 0).length || 0)
        : 0;

      return {
        dso,
        dsoHistory,
        cashFlowProjection,
        collectionEfficiency,
        periodComparison,
        summary: {
          totalCxC,
          proyeccion30d,
          eficienciaPromedio,
          diasPromedioGlobal,
        },
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============= Utility Functions =============

export function getDSOStatusColor(status: DSOMetrics['status']): string {
  switch (status) {
    case 'excelente': return 'text-emerald-600 dark:text-emerald-400';
    case 'bueno': return 'text-blue-600 dark:text-blue-400';
    case 'regular': return 'text-amber-600 dark:text-amber-400';
    case 'malo': return 'text-red-600 dark:text-red-400';
  }
}

export function getDSOStatusBg(status: DSOMetrics['status']): string {
  switch (status) {
    case 'excelente': return 'bg-emerald-500/10';
    case 'bueno': return 'bg-blue-500/10';
    case 'regular': return 'bg-amber-500/10';
    case 'malo': return 'bg-red-500/10';
  }
}

export function getTrendIcon(trend: 'mejorando' | 'empeorando' | 'estable'): string {
  switch (trend) {
    case 'mejorando': return '↓'; // Lower DSO is better
    case 'empeorando': return '↑';
    case 'estable': return '→';
  }
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}
