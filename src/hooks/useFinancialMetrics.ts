import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, subDays } from 'date-fns';
import { getCurrentMTDRange, getPreviousMTDRange } from '@/utils/mtdDateUtils';

export interface DailyMargin {
  fecha: string;
  gmv: number;
  costos: number;
  margen: number;
  margenPorcentaje: number;
}

export interface FinancialMetricsData {
  gmvMTD: number;
  gmvAnterior: number;
  gmvVariacion: number;
  costosMTD: number;
  costosAnterior: number;
  costosVariacion: number;
  margenBruto: number;
  margenPorcentaje: number;
  margenAnterior: number;
  margenVariacion: number;
  apoyosExtraordinarios: number;
  apoyosAnterior: number;
  apoyosVariacion: number;
  dailyMargins: DailyMargin[];
}

export function useFinancialMetrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financial-metrics-mtd'],
    queryFn: async () => {
      const now = new Date();
      const currentRange = getCurrentMTDRange(now);
      const prevRange = getPreviousMTDRange(now);

      // Get GMV current month (MTD)
      const { data: gmvCurrent, error: gmvError } = await supabase
        .from('servicios_custodia')
        .select('fecha_servicio, cobro_cliente')
        .gte('fecha_servicio', currentRange.start)
        .lte('fecha_servicio', currentRange.end)
        .not('estado', 'eq', 'cancelado');

      if (gmvError) throw gmvError;

      // Get GMV previous month (MTD - same day range)
      const { data: gmvPrevious, error: gmvPrevError } = await supabase
        .from('servicios_custodia')
        .select('cobro_cliente')
        .gte('fecha_servicio', prevRange.start)
        .lte('fecha_servicio', prevRange.end)
        .not('estado', 'eq', 'cancelado');

      if (gmvPrevError) throw gmvPrevError;

      // Get costs current month (MTD)
      const { data: costosCurrent, error: costosError } = await supabase
        .from('gastos_externos')
        .select('fecha_gasto, monto, categoria, estado')
        .gte('fecha_gasto', currentRange.start)
        .lte('fecha_gasto', currentRange.end)
        .eq('estado', 'aprobado');

      if (costosError) throw costosError;

      // Get costs previous month (MTD - same day range)
      const { data: costosPrevious, error: costosPrevError } = await supabase
        .from('gastos_externos')
        .select('monto, categoria')
        .gte('fecha_gasto', prevRange.start)
        .lte('fecha_gasto', prevRange.end)
        .eq('estado', 'aprobado');

      if (costosPrevError) throw costosPrevError;

      // Calculate GMV totals
      const gmvMTD = (gmvCurrent || []).reduce((sum, s) => sum + parseFloat(String(s.cobro_cliente || 0)), 0);
      const gmvAnterior = (gmvPrevious || []).reduce((sum, s) => sum + parseFloat(String(s.cobro_cliente || 0)), 0);
      const gmvVariacion = gmvAnterior > 0 ? ((gmvMTD - gmvAnterior) / gmvAnterior) * 100 : 0;

      // Calculate costs totals
      const costosMTD = (costosCurrent || []).reduce((sum, c) => sum + parseFloat(String(c.monto || 0)), 0);
      const costosAnterior = (costosPrevious || []).reduce((sum, c) => sum + parseFloat(String(c.monto || 0)), 0);
      const costosVariacion = costosAnterior > 0 ? ((costosMTD - costosAnterior) / costosAnterior) * 100 : 0;

      // Calculate margin
      const margenBruto = gmvMTD - costosMTD;
      const margenPorcentaje = gmvMTD > 0 ? (margenBruto / gmvMTD) * 100 : 0;
      const margenAnteriorAbs = gmvAnterior - costosAnterior;
      const margenAnterior = gmvAnterior > 0 ? (margenAnteriorAbs / gmvAnterior) * 100 : 0;
      const margenVariacion = margenPorcentaje - margenAnterior;

      // Calculate extraordinary support (filter by category)
      const apoyosExtraordinarios = (costosCurrent || [])
        .filter(c => c.categoria?.toLowerCase().includes('apoyo') || c.categoria?.toLowerCase().includes('extraordinario'))
        .reduce((sum, c) => sum + parseFloat(String(c.monto || 0)), 0);
      
      const apoyosAnterior = (costosPrevious || [])
        .filter(c => c.categoria?.toLowerCase().includes('apoyo') || c.categoria?.toLowerCase().includes('extraordinario'))
        .reduce((sum, c) => sum + parseFloat(String(c.monto || 0)), 0);
      
      const apoyosVariacion = apoyosAnterior > 0 ? ((apoyosExtraordinarios - apoyosAnterior) / apoyosAnterior) * 100 : 0;

      // Calculate daily margins for last 14 days
      const last14Days = eachDayOfInterval({
        start: subDays(now, 13),
        end: now
      });

      const gmvByDay: Record<string, number> = {};
      (gmvCurrent || []).forEach(s => {
        const fecha = s.fecha_servicio;
        gmvByDay[fecha] = (gmvByDay[fecha] || 0) + parseFloat(String(s.cobro_cliente || 0));
      });

      const costosByDay: Record<string, number> = {};
      (costosCurrent || []).forEach(c => {
        const fecha = c.fecha_gasto;
        costosByDay[fecha] = (costosByDay[fecha] || 0) + parseFloat(String(c.monto || 0));
      });

      const dailyMargins: DailyMargin[] = last14Days.map(day => {
        const fecha = format(day, 'yyyy-MM-dd');
        const gmv = gmvByDay[fecha] || 0;
        const costos = costosByDay[fecha] || 0;
        const margen = gmv - costos;
        const margenPct = gmv > 0 ? (margen / gmv) * 100 : 0;
        return {
          fecha,
          gmv,
          costos,
          margen,
          margenPorcentaje: margenPct
        };
      });

      return {
        gmvMTD,
        gmvAnterior,
        gmvVariacion,
        costosMTD,
        costosAnterior,
        costosVariacion,
        margenBruto,
        margenPorcentaje,
        margenAnterior,
        margenVariacion,
        apoyosExtraordinarios,
        apoyosAnterior,
        apoyosVariacion,
        dailyMargins
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    metrics: data,
    loading: isLoading,
    error
  };
}
