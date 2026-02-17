import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateDynamicRetention } from '@/utils/dynamicRetentionCalculator';

export interface LTVBreakdown {
  month: string;
  custodiosActivos: number;
  ingresosTotales: number;
  ingresoPromedioPorCustodio: number;
  ltvCalculado: number;
}

export interface LTVComparison {
  ltvActual: number;
  ltvMesAnterior: number;
  cambioAbsoluto: number;
  cambioRelativo: number;
  tendencia: 'up' | 'down' | 'stable';
}

export interface QuarterlyLTV {
  quarter: string;
  ltvPromedio: number;
  custodiosPromedio: number;
  ingresosTotales: number;
  cambioVsQuarterAnterior: number | null;
}

export interface LTVDetails {
  yearlyData: {
    totalCustodios: number;
    ingresosTotales: number;
    ingresoPromedioPorCustodio: number;
    ltvGeneral: number;
    monthlyBreakdown: LTVBreakdown[];
  };
  currentMonthData: {
    month: string;
    custodiosActivos: number;
    ingresosTotales: number;
    ingresoPromedioPorCustodio: number;
    ltvCalculado: number;
  };
  momComparison: LTVComparison;
  quarterlyData: QuarterlyLTV[];
  tiempoVidaPromedio: number;
  loading: boolean;
}

export interface LTVDetailsOptions {
  enabled?: boolean;
  year?: number;
}

export const useLTVDetails = (options: LTVDetailsOptions = {}): LTVDetails => {
  const { enabled = true, year } = options;
  const targetYear = year || new Date().getFullYear();
  const startDate = `${targetYear}-01-01`;
  const endDate = `${targetYear}-12-31`;

  // Obtener permanencia empírica dinámica
  const { data: dynamicRetention } = useQuery({
    queryKey: ['dynamic-retention-ltv'],
    queryFn: async () => await calculateDynamicRetention(),
    staleTime: 60 * 60 * 1000,
    enabled,
  });

  // Obtener servicios completados por mes para calcular LTV
  const { data: serviciosPorMes, isLoading: serviciosLoading } = useQuery({
    queryKey: ['servicios-ltv-details', targetYear],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.rpc('bypass_rls_get_servicios', { max_records: 10000 });
      
      if (error) throw error;
      
      const serviciosPorMes: { [key: string]: { custodios: Set<string>, ingresos: number } } = {};
      
      if (data && data.length > 0) {
        data
          .filter((servicio: any) => 
            servicio.fecha_hora_cita && 
            servicio.nombre_custodio && 
            servicio.estado?.toLowerCase() === 'finalizado' &&
            servicio.cobro_cliente > 0
          )
          .forEach((servicio: any) => {
            const fecha = new Date(servicio.fecha_hora_cita);
            // Dynamic year filter
            if (fecha.getFullYear() === targetYear) {
              const yearMonth = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
              
              if (!serviciosPorMes[yearMonth]) {
                serviciosPorMes[yearMonth] = {
                  custodios: new Set(),
                  ingresos: 0
                };
              }
              
              serviciosPorMes[yearMonth].custodios.add(servicio.nombre_custodio);
              serviciosPorMes[yearMonth].ingresos += Number(servicio.cobro_cliente) || 0;
            }
          });
      }
      
      const result: { [key: string]: { custodiosActivos: number, ingresos: number } } = {};
      Object.keys(serviciosPorMes).forEach(mes => {
        result[mes] = {
          custodiosActivos: serviciosPorMes[mes].custodios.size,
          ingresos: serviciosPorMes[mes].ingresos
        };
      });
      
      return result;
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  const ltvDetails = useMemo(() => {
    const tiempoVidaPromedio = dynamicRetention?.tiempoMedianoPermanencia || 4.83;

    if (serviciosLoading || !serviciosPorMes) {
      return {
        yearlyData: {
          totalCustodios: 0, ingresosTotales: 0, ingresoPromedioPorCustodio: 0,
          ltvGeneral: 0, monthlyBreakdown: [],
        },
        currentMonthData: {
          month: '', custodiosActivos: 0, ingresosTotales: 0,
          ingresoPromedioPorCustodio: 0, ltvCalculado: 0,
        },
        momComparison: {
          ltvActual: 0, ltvMesAnterior: 0, cambioAbsoluto: 0,
          cambioRelativo: 0, tendencia: 'stable' as const
        },
        quarterlyData: [],
        tiempoVidaPromedio,
        loading: true,
      };
    }

    // Build all months dynamically from data
    const allMonths = Object.keys(serviciosPorMes).sort();
    const monthNames: Record<string, string> = {
      '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
      '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
      '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    };
    
    let ingresosTotalesAcumulados = 0;
    const monthlyBreakdown: LTVBreakdown[] = [];

    allMonths.forEach((month) => {
      const monthData = serviciosPorMes[month] || { custodiosActivos: 0, ingresos: 0 };
      const ingresoPromedioPorCustodio = monthData.custodiosActivos > 0 ? 
        monthData.ingresos / monthData.custodiosActivos : 0;
      const ltvCalculado = Math.round(ingresoPromedioPorCustodio * tiempoVidaPromedio);
      ingresosTotalesAcumulados += monthData.ingresos;

      const monthNum = month.split('-')[1];
      monthlyBreakdown.push({
        month: month, // Keep YYYY-MM format
        custodiosActivos: monthData.custodiosActivos,
        ingresosTotales: Math.round(monthData.ingresos),
        ingresoPromedioPorCustodio: Math.round(ingresoPromedioPorCustodio),
        ltvCalculado,
      });
    });

    const custodiosUnicosCount = Object.values(serviciosPorMes).reduce((acc, monthData) => {
      return acc + monthData.custodiosActivos;
    }, 0);

    const ingresoPromedioPorCustodioGeneral = custodiosUnicosCount > 0 ? 
      ingresosTotalesAcumulados / custodiosUnicosCount : 0;
    const ltvGeneral = Math.round(ingresoPromedioPorCustodioGeneral * tiempoVidaPromedio);

    // Current month data
    const lastMonth = allMonths[allMonths.length - 1] || '';
    const lastMonthData = lastMonth ? (serviciosPorMes[lastMonth] || { custodiosActivos: 0, ingresos: 0 }) : { custodiosActivos: 0, ingresos: 0 };
    const currentIngresoPromedio = lastMonthData.custodiosActivos > 0 ? 
      lastMonthData.ingresos / lastMonthData.custodiosActivos : 0;
    const currentLTV = Math.round(currentIngresoPromedio * tiempoVidaPromedio);
    const lastMonthNum = lastMonth ? lastMonth.split('-')[1] : '';
    const currentMonthLabel = lastMonthNum ? `${monthNames[lastMonthNum] || lastMonth} ${targetYear}` : '';

    // MoM comparison
    const momComparison: LTVComparison = (() => {
      if (monthlyBreakdown.length < 2) {
        return { ltvActual: currentLTV, ltvMesAnterior: 0, cambioAbsoluto: 0, cambioRelativo: 0, tendencia: 'stable' as const };
      }
      const mesActual = monthlyBreakdown[monthlyBreakdown.length - 1];
      const mesAnterior = monthlyBreakdown[monthlyBreakdown.length - 2];
      const cambioAbsoluto = mesActual.ltvCalculado - mesAnterior.ltvCalculado;
      const cambioRelativo = mesAnterior.ltvCalculado > 0 ? (cambioAbsoluto / mesAnterior.ltvCalculado) * 100 : 0;
      let tendencia: 'up' | 'down' | 'stable';
      if (Math.abs(cambioRelativo) < 5) tendencia = 'stable';
      else if (cambioRelativo > 0) tendencia = 'up';
      else tendencia = 'down';
      return {
        ltvActual: mesActual.ltvCalculado, ltvMesAnterior: mesAnterior.ltvCalculado,
        cambioAbsoluto: Math.round(cambioAbsoluto), cambioRelativo: parseFloat(cambioRelativo.toFixed(1)), tendencia
      };
    })();

    // Quarterly data - build dynamically
    const quarterlyData: QuarterlyLTV[] = (() => {
      const quarters: Record<string, LTVBreakdown[]> = {};
      monthlyBreakdown.forEach(m => {
        const monthNum = parseInt(m.month.split('-')[1]);
        const q = Math.ceil(monthNum / 3);
        const qKey = `Q${q} ${targetYear}`;
        if (!quarters[qKey]) quarters[qKey] = [];
        quarters[qKey].push(m);
      });

      let prevLtv: number | null = null;
      return Object.entries(quarters).sort(([a], [b]) => a.localeCompare(b)).map(([qKey, months]) => {
        const ltvPromedio = Math.round(months.reduce((s, m) => s + m.ltvCalculado, 0) / months.length);
        const custodiosPromedio = Math.round(months.reduce((s, m) => s + m.custodiosActivos, 0) / months.length);
        const ingresosTotales = months.reduce((s, m) => s + m.ingresosTotales, 0);
        const cambio = prevLtv !== null ? parseFloat(((ltvPromedio - prevLtv) / prevLtv * 100).toFixed(1)) : null;
        prevLtv = ltvPromedio;
        return { quarter: qKey, ltvPromedio, custodiosPromedio, ingresosTotales, cambioVsQuarterAnterior: cambio };
      });
    })();

    return {
      yearlyData: {
        totalCustodios: custodiosUnicosCount,
        ingresosTotales: Math.round(ingresosTotalesAcumulados),
        ingresoPromedioPorCustodio: Math.round(ingresoPromedioPorCustodioGeneral),
        ltvGeneral,
        monthlyBreakdown,
      },
      currentMonthData: {
        month: currentMonthLabel,
        custodiosActivos: lastMonthData.custodiosActivos,
        ingresosTotales: Math.round(lastMonthData.ingresos),
        ingresoPromedioPorCustodio: Math.round(currentIngresoPromedio),
        ltvCalculado: currentLTV,
      },
      momComparison,
      quarterlyData,
      tiempoVidaPromedio,
      loading: false,
    };
  }, [serviciosPorMes, serviciosLoading, dynamicRetention, targetYear]);

  return {
    ...ltvDetails,
    loading: serviciosLoading,
  };
};
