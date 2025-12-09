import { useMemo } from 'react';
import { useDailyActualServices, DailyActualData } from './useDailyActualServices';
import { useHolidayAdjustment } from './useHolidayAdjustment';
import { useDynamicServiceData } from './useDynamicServiceData';
import { useDynamicForecastAdjustment, calculateAdjustedDayForecast } from './useDynamicForecastAdjustment';
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

// Incertidumbre base del 15% (MAPE histórico típico)
const BASE_UNCERTAINTY = 0.15;

// La incertidumbre crece conforme nos alejamos del presente
const getDayUncertainty = (daysFromToday: number): number => {
  if (daysFromToday <= 0) return 0; // Días pasados no tienen incertidumbre
  // Crece con raíz cuadrada para cono suave: ~15% día 1, ~22% día 10, ~30% día 25
  return BASE_UNCERTAINTY * (1 + Math.sqrt(daysFromToday) * 0.15);
};

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
  // Bandas de confianza 80%
  forecastLower: number;
  forecastUpper: number;
  forecastCumulativeLower: number;
  forecastCumulativeUpper: number;
  uncertainty: number;         // Porcentaje de incertidumbre para el día
  // Forecast ajustado dinámicamente
  adjustedForecast: number;
  adjustmentFactor: number;
  probabilityToReach: number;  // % probabilidad de alcanzar forecast original
  adjustedForecastCumulative: number;
  // GMV fields
  gmvForecast: number;
  gmvActual: number | null;
  gmvVariance: number | null;
  gmvVariancePct: number | null;
  gmvForecastCumulative: number;
  gmvActualCumulative: number | null;
  gmvForecastLower: number;
  gmvForecastUpper: number;
  gmvForecastCumulativeLower: number;
  gmvForecastCumulativeUpper: number;
  gmvAdjustedForecast: number;
  gmvAdjustedForecastCumulative: number;
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
  // GMV metrics
  totalGmvForecast: number;
  totalGmvActual: number;
  avgGmvVariance: number;
  gmvDaysMetForecast: number;
  // Daily averages
  avgDailyServicesActual: number;
  avgDailyServicesForecast: number;
  avgDailyGmvActual: number;
  avgDailyGmvForecast: number;
  // Ajuste dinámico
  correctionFactorApplied: number;
  currentMonthVariancePct: number;
  adjustedMonthlyForecast: number;
  originalMonthlyForecast: number;
  monthlyTargetProbability: number;
  adjustmentReason: string;
  adjustmentConfidence: 'high' | 'medium' | 'low';
  // GMV ajustado
  adjustedMonthlyGmvForecast: number;
  originalMonthlyGmvForecast: number;
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

  // AOV for GMV calculations
  const currentAOV = dynamicData?.currentMonth?.aov ?? 8500;

  // Preparar datos de días pasados para el ajuste dinámico
  const pastDaysForAdjustment = useMemo(() => {
    if (!dailyActuals) return [];
    return dailyActuals
      .filter(d => d.dayOfMonth < currentDay)
      .map(d => {
        const forecast = currentDailyPace * WEEKDAY_FACTORS[new Date(d.date).getUTCDay()];
        return {
          dayOfMonth: d.dayOfMonth,
          forecast,
          actual: d.services,
          variancePct: forecast > 0 ? ((d.services - forecast) / forecast) * 100 : null
        };
      });
  }, [dailyActuals, currentDay, currentDailyPace]);

  // Calcular ajuste dinámico basado en rendimiento observado
  const dynamicAdjustment = useDynamicForecastAdjustment(pastDaysForAdjustment, currentDay);

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
    let gmvForecastCumulative = 0;
    let gmvActualCumulative = 0;
    let forecastCumulativeLower = 0;
    let forecastCumulativeUpper = 0;
    let gmvForecastCumulativeLower = 0;
    let gmvForecastCumulativeUpper = 0;
    let adjustedForecastCumulative = 0;
    let gmvAdjustedForecastCumulative = 0;

    return dailyActuals.map(day => {
      const projection = projectionMap.get(day.date);
      const isPast = day.dayOfMonth < currentDay;
      const isToday = day.dayOfMonth === currentDay;
      
      // Calcular día de semana y factor para todos los días (UTC para consistencia con fecha string)
      const dayOfWeekCalc = new Date(day.date).getUTCDay();
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
      const gmvActual = isPast || isToday ? day.gmv : null;
      const gmvForecast = forecast * currentAOV;
      
      // Calcular incertidumbre para bandas de confianza
      const daysFromToday = day.dayOfMonth - currentDay;
      const uncertainty = getDayUncertainty(daysFromToday);
      const forecastLower = forecast * (1 - uncertainty);
      const forecastUpper = forecast * (1 + uncertainty);
      const gmvForecastLower = gmvForecast * (1 - uncertainty);
      const gmvForecastUpper = gmvForecast * (1 + uncertainty);
      
      // Calcular forecast ajustado dinámicamente (solo para días futuros)
      const adjustmentFactor = !isPast && !isToday ? dynamicAdjustment.correctionFactor : 1;
      const adjustedDayData = calculateAdjustedDayForecast(
        Math.round(forecast),
        adjustmentFactor,
        uncertainty > 0 ? uncertainty : BASE_UNCERTAINTY
      );
      
      forecastCumulative += forecast;
      gmvForecastCumulative += gmvForecast;
      forecastCumulativeLower += forecastLower;
      forecastCumulativeUpper += forecastUpper;
      gmvForecastCumulativeLower += gmvForecastLower;
      gmvForecastCumulativeUpper += gmvForecastUpper;
      
      // Para días pasados/hoy, usar actual; para futuros, usar ajustado
      const effectiveForAdjustedCum = isPast || isToday 
        ? (actual ?? 0) 
        : adjustedDayData.adjustedForecast;
      adjustedForecastCumulative += effectiveForAdjustedCum;
      gmvAdjustedForecastCumulative += effectiveForAdjustedCum * currentAOV;
      
      if (actual !== null) {
        actualCumulative += actual;
      }
      if (gmvActual !== null) {
        gmvActualCumulative += gmvActual;
      }

      const variance = actual !== null ? actual - forecast : null;
      const variancePct = actual !== null && forecast > 0 
        ? ((actual - forecast) / forecast) * 100 
        : null;

      const gmvVariance = gmvActual !== null ? gmvActual - gmvForecast : null;
      const gmvVariancePct = gmvActual !== null && gmvForecast > 0
        ? ((gmvActual - gmvForecast) / gmvForecast) * 100
        : null;

      return {
        date: day.date,
        dayOfMonth: day.dayOfMonth,
        dayLabel: String(day.dayOfMonth).padStart(2, '0'),
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
        isToday,
        // Bandas de confianza
        forecastLower: Math.round(forecastLower),
        forecastUpper: Math.round(forecastUpper),
        forecastCumulativeLower: Math.round(forecastCumulativeLower),
        forecastCumulativeUpper: Math.round(forecastCumulativeUpper),
        uncertainty,
        // Forecast ajustado dinámicamente
        adjustedForecast: adjustedDayData.adjustedForecast,
        adjustmentFactor,
        probabilityToReach: adjustedDayData.probabilityToReach,
        adjustedForecastCumulative: Math.round(adjustedForecastCumulative),
        // GMV fields
        gmvForecast: Math.round(gmvForecast),
        gmvActual,
        gmvVariance,
        gmvVariancePct,
        gmvForecastCumulative: Math.round(gmvForecastCumulative),
        gmvActualCumulative: isPast || isToday ? gmvActualCumulative : null,
        gmvForecastLower: Math.round(gmvForecastLower),
        gmvForecastUpper: Math.round(gmvForecastUpper),
        gmvForecastCumulativeLower: Math.round(gmvForecastCumulativeLower),
        gmvForecastCumulativeUpper: Math.round(gmvForecastCumulativeUpper),
        gmvAdjustedForecast: Math.round(adjustedDayData.adjustedForecast * currentAOV),
        gmvAdjustedForecastCumulative: Math.round(gmvAdjustedForecastCumulative)
      };
    });
  }, [dailyActuals, holidayAdjustment, currentDailyPace, currentDay, currentAOV, dynamicAdjustment]);

  const metrics = useMemo((): ForecastVsActualMetrics | null => {
    if (comparisons.length === 0) return null;

    const pastDays = comparisons.filter(d => d.isPast || d.isToday);
    const futureDays = comparisons.filter(d => !d.isPast && !d.isToday);
    const daysCompleted = pastDays.length;
    const daysRemainingCount = comparisons.length - daysCompleted;
    
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

    // GMV metrics
    const totalGmvForecast = comparisons.reduce((sum, d) => sum + d.gmvForecast, 0);
    const totalGmvActual = pastDays.reduce((sum, d) => sum + (d.gmvActual || 0), 0);
    
    const gmvVariances = pastDays
      .filter(d => d.gmvVariance !== null)
      .map(d => d.gmvVariance as number);
    
    const avgGmvVariance = gmvVariances.length > 0
      ? gmvVariances.reduce((a, b) => a + b, 0) / gmvVariances.length
      : 0;

    const gmvDaysMetForecast = pastDays.filter(d =>
      d.gmvActual !== null && d.gmvActual >= d.gmvForecast
    ).length;

    // Daily averages (only for completed days for fair comparison)
    const avgDailyServicesActual = daysCompleted > 0 ? totalActual / daysCompleted : 0;
    const avgDailyServicesForecast = daysCompleted > 0 
      ? pastDays.reduce((sum, d) => sum + d.forecast, 0) / daysCompleted 
      : 0;
    const avgDailyGmvActual = daysCompleted > 0 ? totalGmvActual / daysCompleted : 0;
    const avgDailyGmvForecast = daysCompleted > 0 
      ? pastDays.reduce((sum, d) => sum + d.gmvForecast, 0) / daysCompleted 
      : 0;

    // Calcular forecast ajustado mensual
    const adjustedFutureServices = futureDays.reduce((sum, d) => sum + d.adjustedForecast, 0);
    const originalFutureServices = futureDays.reduce((sum, d) => sum + d.forecast, 0);
    
    const adjustedMonthlyForecast = totalActual + adjustedFutureServices;
    const originalMonthlyForecast = totalActual + originalFutureServices;
    
    const adjustedMonthlyGmvForecast = totalGmvActual + futureDays.reduce((sum, d) => sum + d.gmvAdjustedForecast, 0);
    const originalMonthlyGmvForecast = totalGmvActual + futureDays.reduce((sum, d) => sum + d.gmvForecast, 0);

    // Probabilidad de alcanzar el target original mensual
    // Usando promedio ponderado de probabilidades de días futuros
    const avgFutureProbability = futureDays.length > 0
      ? futureDays.reduce((sum, d) => sum + d.probabilityToReach, 0) / futureDays.length
      : 100;

    return {
      daysCompleted,
      daysRemaining: daysRemainingCount,
      daysMetForecast,
      avgVariance,
      avgVariancePct,
      trend,
      totalForecast,
      totalActual,
      totalGmvForecast,
      totalGmvActual,
      avgGmvVariance,
      gmvDaysMetForecast,
      avgDailyServicesActual,
      avgDailyServicesForecast,
      avgDailyGmvActual,
      avgDailyGmvForecast,
      // Ajuste dinámico
      correctionFactorApplied: dynamicAdjustment.correctionFactor,
      currentMonthVariancePct: dynamicAdjustment.observedVariancePct,
      adjustedMonthlyForecast: Math.round(adjustedMonthlyForecast),
      originalMonthlyForecast: Math.round(originalMonthlyForecast),
      monthlyTargetProbability: Math.round(avgFutureProbability),
      adjustmentReason: dynamicAdjustment.adjustmentReason,
      adjustmentConfidence: dynamicAdjustment.confidenceLevel,
      // GMV ajustado
      adjustedMonthlyGmvForecast: Math.round(adjustedMonthlyGmvForecast),
      originalMonthlyGmvForecast: Math.round(originalMonthlyGmvForecast)
    };
  }, [comparisons, dynamicAdjustment]);

  return {
    comparisons,
    metrics,
    isLoading: loadingActuals || loadingDynamic || loadingHoliday
  };
};
