import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, subDays } from 'date-fns';
import { getCurrentMTDRange, getPreviousMTDRange } from '@/utils/mtdDateUtils';
import { fetchTarifasKm, calcularCostoEscalonado, type TarifaKmRango } from '@/utils/tarifasKmUtils';

export interface DailyMargin {
  fecha: string;
  gmv: number;
  costos: number;
  costoCustodios: number;
  costoCasetas: number;
  costoArmados: number;
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

interface ServicioConCostos {
  fecha_hora_cita: string | null;
  cobro_cliente: number | null;
  costo_custodio: number | null;
  casetas: string | null;
  nombre_armado: string | null;
  km_recorridos: number | null;
}

interface CostosDesglosados {
  custodio: number;
  casetas: number;
  armado: number;
  total: number;
}

function calcularCostosDesglosados(servicio: ServicioConCostos, tarifas: TarifaKmRango[]): CostosDesglosados {
  const custodio = parseFloat(String(servicio.costo_custodio || 0));
  const casetas = parseFloat(String(servicio.casetas || 0));
  
  let armado = 0;
  if (servicio.nombre_armado && servicio.km_recorridos && servicio.km_recorridos > 0) {
    armado = calcularCostoEscalonado(servicio.km_recorridos, tarifas);
  }
  
  return { custodio, casetas, armado, total: custodio + casetas + armado };
}

export function useFinancialMetrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financial-metrics-mtd'],
    queryFn: async () => {
      const now = new Date();
      const tarifas = await fetchTarifasKm();
      const currentRange = getCurrentMTDRange(now);
      const prevRange = getPreviousMTDRange(now);

      // Get services current month (MTD) with all cost fields
      const { data: serviciosCurrent, error: currentError } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita, cobro_cliente, costo_custodio, casetas, nombre_armado, km_recorridos')
        .gte('fecha_hora_cita', currentRange.start)
        .lte('fecha_hora_cita', currentRange.end)
        .not('estado', 'eq', 'Cancelado');

      if (currentError) throw currentError;

      // Get services previous month (MTD - same day range)
      const { data: serviciosPrevious, error: prevError } = await supabase
        .from('servicios_custodia')
        .select('cobro_cliente, costo_custodio, casetas, nombre_armado, km_recorridos')
        .gte('fecha_hora_cita', prevRange.start)
        .lte('fecha_hora_cita', prevRange.end)
        .not('estado', 'eq', 'Cancelado');

      if (prevError) throw prevError;

      // Calculate GMV totals
      const gmvMTD = (serviciosCurrent || []).reduce((sum, s) => sum + parseFloat(String(s.cobro_cliente || 0)), 0);
      const gmvAnterior = (serviciosPrevious || []).reduce((sum, s) => sum + parseFloat(String(s.cobro_cliente || 0)), 0);
      const gmvVariacion = gmvAnterior > 0 ? ((gmvMTD - gmvAnterior) / gmvAnterior) * 100 : 0;

      // Calculate costs from servicios_custodia (costo_custodio + casetas + costo_armado)
      const costosMTD = (serviciosCurrent || []).reduce((sum, s) => sum + calcularCostosDesglosados(s as ServicioConCostos, tarifas).total, 0);
      const costosAnterior = (serviciosPrevious || []).reduce((sum, s) => sum + calcularCostosDesglosados(s as ServicioConCostos, tarifas).total, 0);
      const costosVariacion = costosAnterior > 0 ? ((costosMTD - costosAnterior) / costosAnterior) * 100 : 0;

      // Calculate margin
      const margenBruto = gmvMTD - costosMTD;
      const margenPorcentaje = gmvMTD > 0 ? (margenBruto / gmvMTD) * 100 : 0;
      const margenAnteriorAbs = gmvAnterior - costosAnterior;
      const margenAnterior = gmvAnterior > 0 ? (margenAnteriorAbs / gmvAnterior) * 100 : 0;
      const margenVariacion = margenPorcentaje - margenAnterior;

      // Extraordinary support - set to 0 as category data is not available
      const apoyosExtraordinarios = 0;
      const apoyosAnterior = 0;
      const apoyosVariacion = 0;

      // Calculate daily margins for last 14 days
      const last14Days = eachDayOfInterval({
        start: subDays(now, 13),
        end: now
      });

      const gmvByDay: Record<string, number> = {};
      const costosCustodiosByDay: Record<string, number> = {};
      const costosCasetasByDay: Record<string, number> = {};
      const costosArmadosByDay: Record<string, number> = {};
      
      (serviciosCurrent || []).forEach(s => {
        const fecha = s.fecha_hora_cita ? format(new Date(s.fecha_hora_cita), 'yyyy-MM-dd') : null;
        if (fecha) {
          const desglose = calcularCostosDesglosados(s as ServicioConCostos, tarifas);
          gmvByDay[fecha] = (gmvByDay[fecha] || 0) + parseFloat(String(s.cobro_cliente || 0));
          costosCustodiosByDay[fecha] = (costosCustodiosByDay[fecha] || 0) + desglose.custodio;
          costosCasetasByDay[fecha] = (costosCasetasByDay[fecha] || 0) + desglose.casetas;
          costosArmadosByDay[fecha] = (costosArmadosByDay[fecha] || 0) + desglose.armado;
        }
      });

      const dailyMargins: DailyMargin[] = last14Days.map(day => {
        const fecha = format(day, 'yyyy-MM-dd');
        const gmv = gmvByDay[fecha] || 0;
        const costoCustodios = costosCustodiosByDay[fecha] || 0;
        const costoCasetas = costosCasetasByDay[fecha] || 0;
        const costoArmados = costosArmadosByDay[fecha] || 0;
        const costos = costoCustodios + costoCasetas + costoArmados;
        const margen = gmv - costos;
        const margenPct = gmv > 0 ? (margen / gmv) * 100 : 0;
        return {
          fecha,
          gmv,
          costos,
          costoCustodios,
          costoCasetas,
          costoArmados,
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
