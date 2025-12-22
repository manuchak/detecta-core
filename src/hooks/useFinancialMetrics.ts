import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, subDays } from 'date-fns';
import { getCurrentMTDRange, getPreviousMTDRange } from '@/utils/mtdDateUtils';

// Tope máximo de km por servicio (ruta más larga: Manzanillo-CDMX ~700km)
const MAX_KM_POR_SERVICIO = 700;

// Esquema de tarifas escalonadas por km para armados
const RANGOS_KM = [
  { km_min: 0, km_max: 100, tarifa: 6.0 },
  { km_min: 100, km_max: 250, tarifa: 5.5 },
  { km_min: 250, km_max: 400, tarifa: 5.0 },
  { km_min: 400, km_max: Infinity, tarifa: 4.6 },
];

function calcularCostoArmadoPorKm(kmRecorridos: number): number {
  const km = Math.min(Math.max(kmRecorridos, 0), MAX_KM_POR_SERVICIO);
  let costoTotal = 0;
  let kmRestantes = km;

  for (const rango of RANGOS_KM) {
    if (kmRestantes <= 0) break;
    const kmEnRango = Math.min(kmRestantes, rango.km_max - rango.km_min);
    costoTotal += kmEnRango * rango.tarifa;
    kmRestantes -= kmEnRango;
  }

  return costoTotal;
}

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

interface ServicioConCostos {
  fecha_hora_cita: string | null;
  cobro_cliente: number | null;
  costo_custodio: number | null;
  casetas: string | null;
  nombre_armado: string | null;
  km_recorridos: number | null;
}

function calcularCostoServicio(servicio: ServicioConCostos): number {
  const costoCustodio = parseFloat(String(servicio.costo_custodio || 0));
  const costoCasetas = parseFloat(String(servicio.casetas || 0));
  
  let costoArmado = 0;
  if (servicio.nombre_armado && servicio.km_recorridos && servicio.km_recorridos > 0) {
    costoArmado = calcularCostoArmadoPorKm(servicio.km_recorridos);
  }
  
  return costoCustodio + costoCasetas + costoArmado;
}

export function useFinancialMetrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financial-metrics-mtd'],
    queryFn: async () => {
      const now = new Date();
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
      const costosMTD = (serviciosCurrent || []).reduce((sum, s) => sum + calcularCostoServicio(s as ServicioConCostos), 0);
      const costosAnterior = (serviciosPrevious || []).reduce((sum, s) => sum + calcularCostoServicio(s as ServicioConCostos), 0);
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
      const costosByDay: Record<string, number> = {};
      
      (serviciosCurrent || []).forEach(s => {
        const fecha = s.fecha_hora_cita ? format(new Date(s.fecha_hora_cita), 'yyyy-MM-dd') : null;
        if (fecha) {
          gmvByDay[fecha] = (gmvByDay[fecha] || 0) + parseFloat(String(s.cobro_cliente || 0));
          costosByDay[fecha] = (costosByDay[fecha] || 0) + calcularCostoServicio(s as ServicioConCostos);
        }
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
