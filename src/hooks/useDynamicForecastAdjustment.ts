import { useMemo } from 'react';
import { 
  calculateWeightedVariance, 
  probabilityToReachTarget 
} from '@/utils/statisticalUtils';

interface DayVariance {
  variancePct: number;
  daysAgo: number;
}

export interface DynamicAdjustmentResult {
  // Varianza observada del mes actual
  observedVariancePct: number;
  observedVarianceAbsolute: number;
  
  // Factor corrector dinámico
  correctionFactor: number;
  adjustmentReason: string;
  
  // Métricas de confianza
  confidenceLevel: 'high' | 'medium' | 'low';
  dataPointsUsed: number;
}

export interface AdjustedDayForecast {
  originalForecast: number;
  adjustedForecast: number;
  adjustmentDelta: number;
  probabilityToReach: number;
  uncertainty: number;
}

// Mínimo de días para aplicar ajuste dinámico
const MIN_DAYS_FOR_ADJUSTMENT = 5;

// Límites del factor corrector (±30% máximo)
const MAX_ADJUSTMENT = 0.30;

/**
 * Hook para calcular factor corrector dinámico basado en rendimiento observado
 */
export const useDynamicForecastAdjustment = (
  pastDaysData: Array<{
    dayOfMonth: number;
    forecast: number;
    actual: number | null;
    variancePct: number | null;
  }>,
  currentDay: number
) => {
  return useMemo((): DynamicAdjustmentResult => {
    // Filtrar días con datos válidos
    const validDays = pastDaysData.filter(
      d => d.actual !== null && d.variancePct !== null && d.forecast > 0
    );
    
    const dataPointsUsed = validDays.length;
    
    // Si no hay suficientes datos, no ajustar
    if (dataPointsUsed < MIN_DAYS_FOR_ADJUSTMENT) {
      return {
        observedVariancePct: 0,
        observedVarianceAbsolute: 0,
        correctionFactor: 1,
        adjustmentReason: `Insuficientes datos (${dataPointsUsed}/${MIN_DAYS_FOR_ADJUSTMENT} días)`,
        confidenceLevel: 'low',
        dataPointsUsed
      };
    }
    
    // Calcular varianzas con peso por recencia
    const dailyVariances: DayVariance[] = validDays.map(d => ({
      variancePct: (d.variancePct ?? 0) / 100, // Convertir a decimal
      daysAgo: currentDay - d.dayOfMonth
    }));
    
    // Varianza ponderada (días recientes pesan más)
    const weightedVariance = calculateWeightedVariance(dailyVariances);
    
    // Limitar el ajuste a ±30%
    const clampedVariance = Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, weightedVariance));
    
    // Factor corrector: 1 + varianza observada
    // Si rendimiento es -13.5%, factor será 0.865
    const correctionFactor = 1 + clampedVariance;
    
    // Varianza absoluta promedio
    const avgForecast = validDays.reduce((sum, d) => sum + d.forecast, 0) / validDays.length;
    const observedVarianceAbsolute = avgForecast * clampedVariance;
    
    // Determinar nivel de confianza
    let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
    if (dataPointsUsed >= 10) confidenceLevel = 'high';
    else if (dataPointsUsed >= MIN_DAYS_FOR_ADJUSTMENT) confidenceLevel = 'medium';
    
    // Generar razón del ajuste
    const adjustmentPct = (clampedVariance * 100).toFixed(1);
    const adjustmentReason = clampedVariance < 0
      ? `Ajustado ${adjustmentPct}% por bajo rendimiento MTD (${dataPointsUsed} días)`
      : clampedVariance > 0
        ? `Ajustado +${adjustmentPct}% por alto rendimiento MTD (${dataPointsUsed} días)`
        : 'Sin ajuste necesario';
    
    return {
      observedVariancePct: clampedVariance * 100,
      observedVarianceAbsolute,
      correctionFactor,
      adjustmentReason,
      confidenceLevel,
      dataPointsUsed
    };
  }, [pastDaysData, currentDay]);
};

/**
 * Calcula forecast ajustado y probabilidad para un día específico
 */
export const calculateAdjustedDayForecast = (
  originalForecast: number,
  correctionFactor: number,
  uncertainty: number
): AdjustedDayForecast => {
  const adjustedForecast = Math.round(originalForecast * correctionFactor);
  const adjustmentDelta = adjustedForecast - originalForecast;
  
  // Probabilidad de alcanzar el forecast ORIGINAL dado el ajustado
  const probability = probabilityToReachTarget(
    originalForecast,
    adjustedForecast,
    uncertainty
  );
  
  return {
    originalForecast,
    adjustedForecast,
    adjustmentDelta,
    probabilityToReach: probability,
    uncertainty
  };
};
