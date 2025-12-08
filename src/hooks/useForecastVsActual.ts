import { useMemo } from 'react';
import { useDailyActualServices, DailyActualData } from './useDailyActualServices';
import { useHolidayAdjustment } from './useHolidayAdjustment';
import { useDynamicServiceData } from './useDynamicServiceData';
import { format } from 'date-fns';

// Factores validados con datos históricos 2024
const WEEKDAY_FACTORS: Record<number, number> = {
  0: 0.41,  // Domingo - -59%
  1: 0.99,  // Lunes - ~promedio
  2: 1.25,  // Martes - +25%
  3: 1.13,  // Miércoles - +13%
  4: 1.29,  // Jueves - +29% (día más fuerte)
  5: 1.21,  // Viernes - +21%
  6: 0.71,  // Sábado - -29%
};
const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export interface DayComparison {
  date: string;
  dayOfMonth: number;
  dayLabel: string;
  dayOfWeek: number;           // 0-6
  weekdayName: string;         // "Lun", "Mar", etc.
  weekdayFactor: number;       // Factor patrón semanal
  forecast: number;
  actual: number | null;
  variance: number | null;
  variancePct: number | null;
  isHoliday: boolean;
  holidayName?: string;
  operationFactor: number;
  combinedFactor: number;      // weekdayFactor × operationFactor
  forecastCumulative: number;
  actualCumulative: number | null;
  isPast: boolean;
  isToday: boolean;
}

export interface ForecastVsActualMetrics {
  daysCompleted: number;
  daysRemaining: number;
  daysMetForecast: number;
  avgVariance: number;
  avgVariancePct: number;
  trend: 'improving' | 'declining' | 'stable';
  totalForecast: number;
  totalActual: number;
}

export const useForecastVsActual = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const { data: dailyActuals, isLoading: loadingActuals } = useDailyActualServices(currentYear, currentMonth);
  const { data: dynamicData, isLoading: loadingDynamic } = useDynamicServiceData();
  
  const daysRemaining = dynamicData?.daysRemaining ?? 0;
  const currentDailyPace = dynamicData?.currentMonth?.dailyPace ?? 0;
  
  const { data: holidayAdjustment, isLoading: loadingHoliday } = useHolidayAdjustment(
    daysRemaining,
    currentDailyPace
  );

  const comparisons = useMemo((): DayComparison[] => {
    if (!dailyActuals || !holidayAdjustment?.dayByDayProjection) return [];

    const projectionMap = new Map<string, { 
      expectedServices: number; 
      operationFactor: number; 
      isHoliday: boolean; 
      holidayName?: string;
      dayOfWeek: number;
      weekdayName: string;
      weekdayFactor: number;
      combinedFactor: number;
    }>();
    
    holidayAdjustment.dayByDayProjection.forEach(proj => {
      projectionMap.set(proj.fecha, {
        expectedServices: proj.expectedServices,
        operationFactor: proj.operationFactor,
        isHoliday: proj.isHoliday,
        holidayName: proj.holidayName,
        dayOfWeek: proj.dayOfWeek,
        weekdayName: proj.weekdayName,
        weekdayFactor: proj.weekdayFactor,
        combinedFactor: proj.combinedFactor
      });
    });

    let forecastCumulative = 0;
    let actualCumulative = 0;

    return dailyActuals.map(day => {
      const projection = projectionMap.get(day.date);
      const isPast = day.dayOfMonth < currentDay;
      const isToday = day.dayOfMonth === currentDay;
      
      // Calcular día de semana y factor para todos los días
      const dayOfWeekCalc = new Date(day.date).getDay();
      const weekdayFactorCalc = WEEKDAY_FACTORS[dayOfWeekCalc];
      
      // Para días pasados sin proyección: usar patrón semanal
      // Para días futuros con proyección: usar expectedServices ya calculado
      let forecast: number;
      if (projection) {
        forecast = projection.expectedServices;
      } else {
        // Día pasado: aplicar patrón semanal a currentDailyPace
        forecast = currentDailyPace * weekdayFactorCalc;
      }
      
      const actual = isPast || isToday ? day.services : null;
      
      forecastCumulative += forecast;
      if (actual !== null) {
        actualCumulative += actual;
      }

      const variance = actual !== null ? actual - forecast : null;
      const variancePct = actual !== null && forecast > 0 
        ? ((actual - forecast) / forecast) * 100 
        : null;

      return {
        date: day.date,
        dayOfMonth: day.dayOfMonth,
        dayLabel: format(new Date(day.date), 'dd'),
        dayOfWeek: projection?.dayOfWeek ?? dayOfWeekCalc,
        weekdayName: projection?.weekdayName ?? WEEKDAY_NAMES[dayOfWeekCalc],
        weekdayFactor: projection?.weekdayFactor ?? weekdayFactorCalc,
        forecast: Math.round(forecast),
        actual,
        variance,
        variancePct,
        isHoliday: projection?.isHoliday ?? false,
        holidayName: projection?.holidayName,
        operationFactor: projection?.operationFactor ?? 1,
        combinedFactor: projection?.combinedFactor ?? weekdayFactorCalc,
        forecastCumulative: Math.round(forecastCumulative),
        actualCumulative: isPast || isToday ? actualCumulative : null,
        isPast,
        isToday
      };
    });
  }, [dailyActuals, holidayAdjustment, currentDailyPace, currentDay]);

  const metrics = useMemo((): ForecastVsActualMetrics | null => {
    if (comparisons.length === 0) return null;

    const pastDays = comparisons.filter(d => d.isPast || d.isToday);
    const daysCompleted = pastDays.length;
    const daysRemaining = comparisons.length - daysCompleted;
    
    const daysMetForecast = pastDays.filter(d => 
      d.actual !== null && d.actual >= d.forecast
    ).length;

    const variances = pastDays
      .filter(d => d.variance !== null)
      .map(d => d.variance as number);
    
    const avgVariance = variances.length > 0 
      ? variances.reduce((a, b) => a + b, 0) / variances.length 
      : 0;

    const variancePcts = pastDays
      .filter(d => d.variancePct !== null)
      .map(d => d.variancePct as number);
    
    const avgVariancePct = variancePcts.length > 0
      ? variancePcts.reduce((a, b) => a + b, 0) / variancePcts.length
      : 0;

    // Determine trend from last 3 days
    const recentDays = pastDays.slice(-3);
    const recentVariances = recentDays
      .filter(d => d.variance !== null)
      .map(d => d.variance as number);
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentVariances.length >= 2) {
      const first = recentVariances[0];
      const last = recentVariances[recentVariances.length - 1];
      if (last > first + 2) trend = 'improving';
      else if (last < first - 2) trend = 'declining';
    }

    const totalForecast = comparisons.reduce((sum, d) => sum + d.forecast, 0);
    const totalActual = pastDays.reduce((sum, d) => sum + (d.actual || 0), 0);

    return {
      daysCompleted,
      daysRemaining,
      daysMetForecast,
      avgVariance,
      avgVariancePct,
      trend,
      totalForecast,
      totalActual
    };
  }, [comparisons]);

  return {
    comparisons,
    metrics,
    isLoading: loadingActuals || loadingDynamic || loadingHoliday
  };
};
