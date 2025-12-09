/**
 * Utilidades estadísticas para cálculos de probabilidad y distribución
 */

/**
 * Función de distribución acumulada normal estándar (CDF)
 * Aproximación usando algoritmo de Abramowitz-Stegun
 */
export function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Calcula el Z-score
 */
export function zScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calcula la probabilidad de alcanzar o superar un target
 * Usando distribución normal
 */
export function probabilityToReachTarget(
  target: number,
  adjustedMean: number,
  uncertainty: number
): number {
  if (adjustedMean <= 0 || target <= 0) return 0;
  
  // Desviación estándar basada en la incertidumbre
  const stdDev = target * uncertainty;
  if (stdDev === 0) return adjustedMean >= target ? 100 : 0;
  
  const z = zScore(target, adjustedMean, stdDev);
  
  // P(X >= target) = 1 - CDF(z)
  const probability = (1 - normalCDF(z)) * 100;
  
  // Limitar entre 0 y 100
  return Math.max(0, Math.min(100, probability));
}

/**
 * Calcula varianza ponderada dando más peso a días recientes
 */
export function calculateWeightedVariance(
  dailyVariances: { variancePct: number; daysAgo: number }[]
): number {
  if (dailyVariances.length === 0) return 0;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  dailyVariances.forEach(({ variancePct, daysAgo }) => {
    // Peso exponencial: días más recientes pesan más
    const weight = Math.exp(-0.15 * daysAgo);
    weightedSum += variancePct * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
