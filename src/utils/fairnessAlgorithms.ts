/**
 * Shared fairness/equity calculation algorithms.
 * Used by both custodian and armed guard fairness audits.
 */

export type ZScoreCategoria = 'MUY_FAVORECIDO' | 'FAVORECIDO' | 'NORMAL' | 'SUBFAVORECIDO' | 'MUY_SUBFAVORECIDO';

/**
 * Gini Index - Measures inequality in distribution.
 * 0 = perfect equality (everyone receives equal)
 * 1 = maximum inequality (one receives all)
 * Target: < 0.25
 */
export function calcularGini(valores: number[]): number {
  if (valores.length === 0) return 0;
  const sorted = [...valores].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  
  let giniSum = 0;
  sorted.forEach((val, i) => {
    giniSum += val * (i + 1);
  });
  
  return (2 * giniSum) / (n * sum) - (n + 1) / n;
}

/**
 * Shannon Entropy - Measures diversity in distribution.
 * 100% = perfectly distributed assignments
 * Low values indicate concentration in few recipients
 */
export function calcularEntropia(valores: number[]): { entropia: number; maxima: number } {
  const total = valores.reduce((a, b) => a + b, 0);
  if (total === 0) return { entropia: 0, maxima: 0 };
  
  const entropia = -valores
    .filter(x => x > 0)
    .map(x => x / total)
    .reduce((sum, p) => sum + p * Math.log2(p), 0);
  
  const maxima = Math.log2(valores.length);
  return { entropia, maxima };
}

/**
 * Herfindahl-Hirschman Index (HHI) - Measures market concentration.
 * < 1,500 = low concentration (healthy)
 * 1,500-2,500 = moderate
 * > 2,500 = high concentration (problem)
 */
export function calcularHHI(valores: number[]): number {
  const total = valores.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  
  return valores.reduce((sum, s) => {
    const share = (s / total) * 100;
    return sum + share * share;
  }, 0);
}

/**
 * Z-Scores - Number of standard deviations from mean.
 * Used to identify outliers (over/under-assigned).
 */
export function calcularZScores(valores: number[]): number[] {
  if (valores.length === 0) return [];
  const mean = valores.reduce((a, b) => a + b, 0) / valores.length;
  const variance = valores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / valores.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return valores.map(() => 0);
  return valores.map(s => (s - mean) / stdDev);
}

/**
 * Palma Ratio - Compares top 10% vs bottom 40%.
 * > 2x indicates significant inequality requiring attention.
 */
export function calcularPalmaRatio(valores: number[]): number {
  if (valores.length < 10) return 1;
  const sorted = [...valores].sort((a, b) => b - a);
  const n = sorted.length;
  const top10 = sorted.slice(0, Math.ceil(n * 0.1));
  const bottom40 = sorted.slice(Math.floor(n * 0.6));
  const sumTop = top10.reduce((a, b) => a + b, 0);
  const sumBottom = bottom40.reduce((a, b) => a + b, 0);
  return sumBottom > 0 ? sumTop / sumBottom : 10;
}

/**
 * Categorize Z-Score into qualitative labels.
 */
export function categorizarZScore(z: number): ZScoreCategoria {
  if (z > 2) return 'MUY_FAVORECIDO';
  if (z > 1) return 'FAVORECIDO';
  if (z < -2) return 'MUY_SUBFAVORECIDO';
  if (z < -1) return 'SUBFAVORECIDO';
  return 'NORMAL';
}

/**
 * Calculate mean from array of values.
 */
export function calcularMedia(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

/**
 * Interpret Gini index value.
 */
export function interpretarGini(gini: number): 'bajo' | 'moderado' | 'alto' {
  if (gini < 0.25) return 'bajo';
  if (gini < 0.40) return 'moderado';
  return 'alto';
}

/**
 * Interpret HHI value.
 */
export function interpretarHHI(hhi: number): 'baja' | 'moderada' | 'alta' {
  if (hhi < 1500) return 'baja';
  if (hhi < 2500) return 'moderada';
  return 'alta';
}

/**
 * Normalize name for matching (handles duplicates like "FLORENTINO" vs "FLORENTINORAMIREZ").
 */
export function normalizarNombre(nombre: string): string {
  return nombre
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents
}
