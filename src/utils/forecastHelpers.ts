import { supabase } from '@/integrations/supabase/client';

export interface ForecastMesActual {
  forecastMesActual: number;
  serviciosMTD: number;
  proyeccionPace: number;
  daysElapsed: number;
  daysRemaining: number;
}

/**
 * Obtiene el forecast realista del mes actual basado en:
 * - Servicios MTD (month-to-date)
 * - Proyección basada en pace actual
 * - Hook useRealisticProjections si está disponible
 */
export const getForecastMesActual = async (): Promise<ForecastMesActual> => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  
  // Calcular primer y último día del mes actual
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = totalDaysInMonth - daysElapsed;

  // Query servicios del mes en curso (MTD - Month To Date)
  const { data: serviciosMTD, error } = await supabase
    .from('servicios_custodia')
    .select('id_servicio')
    .gte('fecha_hora_cita', firstDayOfMonth.toISOString())
    .lt('fecha_hora_cita', now.toISOString())
    .not('estado', 'in', '("cancelado","cancelled","canceled")');

  if (error) {
    console.error('Error fetching MTD services:', error);
    throw error;
  }

  const serviciosMTDCount = serviciosMTD?.length || 0;

  // Calcular proyección basada en pace actual
  // Pace diario = servicios hasta ahora / días transcurridos
  const dailyPace = daysElapsed > 0 ? serviciosMTDCount / daysElapsed : 0;
  
  // Proyección simple: pace actual * días totales del mes
  const proyeccionPace = Math.round(dailyPace * totalDaysInMonth);

  // El forecast realista es la proyección basada en pace
  // (En el futuro esto se puede integrar con useRealisticProjections)
  const forecastMesActual = proyeccionPace;

  return {
    forecastMesActual,
    serviciosMTD: serviciosMTDCount,
    proyeccionPace,
    daysElapsed,
    daysRemaining
  };
};
