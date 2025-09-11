/**
 * Mathematical Regime Detection System
 * Detecta automáticamente regímenes de crecimiento (normal, exponencial, declive)
 * usando métodos estadísticos avanzados
 */

// ========== INTERFACES ==========

export interface RegimeDetectionResult {
  regime: 'normal' | 'exponential' | 'declining' | 'volatile';
  confidence: number; // 0-1
  score: number; // Métrica específica del régimen
  changepoints: number[]; // Puntos de cambio detectados
  exponentialParams: {
    lambda: number; // Tasa de crecimiento
    r_squared: number; // Bondad de ajuste
    stability: number; // Estabilidad temporal
  };
  bayesianProbability: {
    normal: number;
    exponential: number;
    declining: number;
    volatile: number;
  };
  mathematicalEvidence: {
    ljungBoxTest: { statistic: number; pValue: number; isWhiteNoise: boolean; };
    changePointStrength: number;
    trendStability: number;
    volatilityScore: number;
  };
}

export interface AdaptiveGuardrails {
  upperLimit: number;
  lowerLimit: number;
  confidenceInterval: { lower: number; upper: number; };
  k_factor: number; // Factor de adaptación basado en régimen
  regime_multiplier: number;
}

// ========== ALGORITMO PELT SIMPLIFICADO ==========

export function detectChangepoints(data: number[], penalty: number = 1.5): number[] {
  if (data.length < 6) return [];
  
  const n = data.length;
  const changepoints: number[] = [];
  
  // Implementación simplificada de PELT
  for (let i = 2; i < n - 2; i++) {
    const leftSegment = data.slice(0, i);
    const rightSegment = data.slice(i);
    
    const leftMean = leftSegment.reduce((a, b) => a + b, 0) / leftSegment.length;
    const rightMean = rightSegment.reduce((a, b) => a + b, 0) / rightSegment.length;
    
    const leftVariance = leftSegment.reduce((sum, val) => sum + Math.pow(val - leftMean, 2), 0) / leftSegment.length;
    const rightVariance = rightSegment.reduce((sum, val) => sum + Math.pow(val - rightMean, 2), 0) / rightSegment.length;
    
    // Test estadístico para cambio de media
    const pooledStd = Math.sqrt((leftVariance + rightVariance) / 2);
    const tStatistic = Math.abs(leftMean - rightMean) / (pooledStd * Math.sqrt(2 / Math.min(leftSegment.length, rightSegment.length)));
    
    // Umbral adaptativo basado en penalty
    if (tStatistic > penalty && Math.abs(leftMean - rightMean) > 0.1 * Math.max(leftMean, rightMean)) {
      changepoints.push(i);
    }
  }
  
  return changepoints;
}

// ========== FUNCIÓN DE SCORE DE CRECIMIENTO EXPONENCIAL ==========

export function calculateExponentialGrowthScore(data: number[]): {
  lambda: number;
  r_squared: number;
  stability: number;
  overallScore: number;
} {
  if (data.length < 4) {
    return { lambda: 0, r_squared: 0, stability: 0, overallScore: 0 };
  }
  
  // Ajuste exponencial: y = a * e^(λx)
  // Transformamos a: ln(y) = ln(a) + λx (regresión lineal)
  const validData = data.filter(x => x > 0);
  if (validData.length < 4) {
    return { lambda: 0, r_squared: 0, stability: 0, overallScore: 0 };
  }
  
  const logY = validData.map(Math.log);
  const x = validData.map((_, i) => i);
  
  // Regresión lineal
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = logY.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * logY[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const lambda = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - lambda * sumX) / n;
  
  // R²
  const yMean = sumY / n;
  const predictions = x.map(xi => intercept + lambda * xi);
  const ssRes = logY.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
  const ssTot = logY.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const r_squared = Math.max(0, 1 - ssRes / ssTot);
  
  // Estabilidad: Varianza de la tasa de crecimiento período a período
  const growthRates = [];
  for (let i = 1; i < validData.length; i++) {
    if (validData[i-1] > 0) {
      growthRates.push(validData[i] / validData[i-1] - 1);
    }
  }
  const growthMean = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  const growthVariance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - growthMean, 2), 0) / growthRates.length;
  const stability = Math.max(0, 1 - Math.sqrt(growthVariance) / Math.abs(growthMean));
  
  // Score combinado
  const overallScore = (r_squared * 0.4) + (stability * 0.4) + (Math.min(1, Math.abs(lambda) / 0.2) * 0.2);
  
  return { lambda, r_squared, stability: isFinite(stability) ? stability : 0, overallScore };
}

// ========== TEST DE LJUNG-BOX ==========

export function ljungBoxTest(residuals: number[], lag: number = 5): {
  statistic: number;
  pValue: number;
  isWhiteNoise: boolean;
} {
  if (residuals.length < lag + 2) {
    return { statistic: 0, pValue: 1, isWhiteNoise: true };
  }
  
  const n = residuals.length;
  const autocorrelations: number[] = [];
  
  // Calcular autocorrelaciones
  for (let k = 1; k <= lag; k++) {
    const numerator = residuals.slice(k).reduce((sum, val, i) => sum + val * residuals[i], 0);
    const denominator = residuals.reduce((sum, val) => sum + val * val, 0);
    autocorrelations.push(denominator !== 0 ? numerator / denominator : 0);
  }
  
  // Estadístico Ljung-Box
  const lbStatistic = n * (n + 2) * autocorrelations.reduce((sum, rho, k) => {
    return sum + (rho * rho) / (n - k - 1);
  }, 0);
  
  // Aproximación p-value (distribución chi-cuadrado)
  const pValue = Math.exp(-lbStatistic / (2 * lag)); // Aproximación simple
  
  return {
    statistic: lbStatistic,
    pValue,
    isWhiteNoise: pValue > 0.05 // Umbral típico de significancia
  };
}

// ========== PROBABILIDAD BAYESIANA ==========

export function calculateBayesianProbabilities(data: number[], exponentialScore: {
  lambda: number;
  r_squared: number;
  stability: number;
  overallScore: number;
}): {
  normal: number;
  exponential: number;
  declining: number;
  volatile: number;
} {
  // Priors (probabilidades a priori)
  const priors = {
    normal: 0.6,      // La mayoría de los datos son crecimiento normal
    exponential: 0.15, // Crecimiento exponencial es menos común
    declining: 0.15,   // Declive ocasional
    volatile: 0.1      // Volatilidad alta es rara
  };
  
  // Calcular evidencias (likelihood)
  const recentTrend = data.length >= 3 ? 
    (data[data.length - 1] / data[data.length - 3] - 1) : 0;
  
  const volatility = data.length >= 4 ? 
    Math.sqrt(data.slice(-4).reduce((sum, val, i, arr) => {
      if (i === 0) return 0;
      const growth = val / arr[i-1] - 1;
      return sum + growth * growth;
    }, 0) / 3) : 0;
  
  // Likelihoods basadas en evidencia
  const likelihoods = {
    normal: Math.max(0.1, 1 - Math.abs(recentTrend - 0.05) * 5) * (1 - volatility * 2),
    exponential: exponentialScore.overallScore * (recentTrend > 0.1 ? 2 : 0.5),
    declining: Math.max(0.1, recentTrend < -0.05 ? 1 + recentTrend * 10 : 0.2),
    volatile: Math.min(1, volatility * 3)
  };
  
  // Posteriors (Bayes)
  const rawPosteriors = {
    normal: priors.normal * likelihoods.normal,
    exponential: priors.exponential * likelihoods.exponential,
    declining: priors.declining * likelihoods.declining,
    volatile: priors.volatile * likelihoods.volatile
  };
  
  // Normalizar
  const total = Object.values(rawPosteriors).reduce((a, b) => a + b, 0);
  
  if (total === 0) {
    return { normal: 1, exponential: 0, declining: 0, volatile: 0 };
  }
  
  return {
    normal: rawPosteriors.normal / total,
    exponential: rawPosteriors.exponential / total,
    declining: rawPosteriors.declining / total,
    volatile: rawPosteriors.volatile / total
  };
}

// ========== DETECTOR PRINCIPAL DE RÉGIMEN ==========

export function detectGrowthRegime(data: number[]): RegimeDetectionResult {
  if (data.length < 3) {
    return {
      regime: 'normal',
      confidence: 0.5,
      score: 0,
      changepoints: [],
      exponentialParams: { lambda: 0, r_squared: 0, stability: 0 },
      bayesianProbability: { normal: 1, exponential: 0, declining: 0, volatile: 0 },
      mathematicalEvidence: {
        ljungBoxTest: { statistic: 0, pValue: 1, isWhiteNoise: true },
        changePointStrength: 0,
        trendStability: 0.5,
        volatilityScore: 0
      }
    };
  }
  
  // 1. Detectar changepoints
  const changepoints = detectChangepoints(data);
  
  // 2. Score de crecimiento exponencial
  const exponentialScore = calculateExponentialGrowthScore(data);
  
  // 3. Test de Ljung-Box en residuos
  const recentData = data.slice(-Math.min(12, data.length));
  const trend = recentData.length > 1 ? 
    recentData.map((val, i) => val - (recentData[0] + (recentData[recentData.length-1] - recentData[0]) * i / (recentData.length-1))) : [0];
  const ljungBox = ljungBoxTest(trend);
  
  // 4. Probabilidades Bayesianas
  const bayesianProbs = calculateBayesianProbabilities(data, exponentialScore);
  
  // 5. Métricas adicionales
  const volatilityScore = data.length >= 4 ? 
    Math.sqrt(data.slice(-4).reduce((sum, val, i, arr) => {
      if (i === 0) return 0;
      const growth = val / arr[i-1] - 1;
      return sum + growth * growth;
    }, 0) / 3) : 0;
  
  const changePointStrength = changepoints.length / Math.max(1, data.length / 4);
  const trendStability = exponentialScore.stability;
  
  // 6. Determinación del régimen
  const maxProb = Math.max(...Object.values(bayesianProbs));
  const regime = Object.entries(bayesianProbs).find(([_, prob]) => prob === maxProb)?.[0] as any || 'normal';
  
  // 7. Confidence score
  const confidence = Math.min(1, maxProb * (1 + exponentialScore.r_squared) * (1 + trendStability) / 2);
  
  return {
    regime,
    confidence,
    score: regime === 'exponential' ? exponentialScore.overallScore : bayesianProbs[regime],
    changepoints,
    exponentialParams: exponentialScore,
    bayesianProbability: bayesianProbs,
    mathematicalEvidence: {
      ljungBoxTest: ljungBox,
      changePointStrength,
      trendStability,
      volatilityScore
    }
  };
}

// ========== GUARDRAILS ADAPTATIVOS ==========

export function calculateAdaptiveGuardrails(
  historicalData: number[],
  currentValue: number,
  regimeResult: RegimeDetectionResult,
  timeHorizon: number = 1
): AdaptiveGuardrails {
  
  const μ_historico = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
  const σ_historico = Math.sqrt(
    historicalData.reduce((sum, val) => sum + Math.pow(val - μ_historico, 2), 0) / historicalData.length
  );
  
  // Factor k adaptativo basado en régimen detectado
  let k_factor: number;
  let regime_multiplier: number;
  
  switch (regimeResult.regime) {
    case 'exponential':
      // Para crecimiento exponencial validado: límites más amplios
      k_factor = 2.58 + (regimeResult.confidence * 0.5); // Hasta 3.08
      regime_multiplier = 1.5 + (regimeResult.exponentialParams.lambda * 2);
      break;
    case 'volatile':
      // Para datos volátiles: límites más conservadores pero flexibles
      k_factor = 2.24;
      regime_multiplier = 1.2;
      break;
    case 'declining':
      // Para declive: límites asimétricos (más restrictivos al alza)
      k_factor = 1.96;
      regime_multiplier = 0.8;
      break;
    default: // normal
      // Para crecimiento normal: límites estándar
      k_factor = 1.96; // 95% CI
      regime_multiplier = 1.0;
  }
  
  // Límites adaptativos
  const base_upper = μ_historico * (1 + k_factor * (σ_historico / μ_historico) * Math.sqrt(timeHorizon));
  const base_lower = μ_historico * (1 - k_factor * (σ_historico / μ_historico) * Math.sqrt(timeHorizon));
  
  const upperLimit = base_upper * regime_multiplier;
  const lowerLimit = Math.max(0, base_lower * regime_multiplier);
  
  // Intervalos de confianza específicos
  const ci_width = k_factor * σ_historico * Math.sqrt(timeHorizon);
  const confidenceInterval = {
    lower: Math.max(0, currentValue - ci_width),
    upper: currentValue + ci_width * regime_multiplier
  };
  
  return {
    upperLimit,
    lowerLimit,
    confidenceInterval,
    k_factor,
    regime_multiplier
  };
}

// ========== FUNCIÓN PRINCIPAL DE ANÁLISIS ==========

export function performMathematicalRegimeAnalysis(
  historicalData: number[],
  currentValue: number,
  timeHorizon: number = 1
): {
  regime: RegimeDetectionResult;
  guardrails: AdaptiveGuardrails;
  recommendations: string[];
  mathematicalJustification: string;
} {
  
  const regime = detectGrowthRegime(historicalData);
  const guardrails = calculateAdaptiveGuardrails(historicalData, currentValue, regime, timeHorizon);
  
  // Recomendaciones basadas en el régimen
  const recommendations: string[] = [];
  let mathematicalJustification = '';
  
  switch (regime.regime) {
    case 'exponential':
      recommendations.push(`Crecimiento exponencial detectado (λ=${regime.exponentialParams.lambda.toFixed(3)}, R²=${regime.exponentialParams.r_squared.toFixed(3)})`);
      recommendations.push(`Límites expandidos automáticamente (k=${guardrails.k_factor.toFixed(2)})`);
      mathematicalJustification = `Régimen exponencial validado matemáticamente: tasa λ=${regime.exponentialParams.lambda.toFixed(3)}, bondad de ajuste R²=${regime.exponentialParams.r_squared.toFixed(3)}, estabilidad=${regime.exponentialParams.stability.toFixed(3)}. Límites adaptativos con k=${guardrails.k_factor.toFixed(2)}.`;
      break;
      
    case 'volatile':
      recommendations.push('Datos volátiles detectados - usar intervalos de confianza más amplios');
      recommendations.push('Considerar factores externos o estacionalidad');
      mathematicalJustification = `Régimen volátil: variabilidad alta detectada (σ=${regime.mathematicalEvidence.volatilityScore.toFixed(3)}). Límites conservadores aplicados.`;
      break;
      
    case 'declining':
      recommendations.push('Tendencia declinante detectada - límites asimétricos aplicados');
      recommendations.push('Revisar factores causales del declive');
      mathematicalJustification = `Régimen declinante: probabilidad bayesiana=${regime.bayesianProbability.declining.toFixed(3)}. Límites restrictivos al alza.`;
      break;
      
    default:
      recommendations.push('Crecimiento normal - límites estándar aplicados');
      mathematicalJustification = `Régimen normal: crecimiento dentro de parámetros históricos (μ±1.96σ). Límites estándar con 95% de confianza.`;
  }
  
  if (regime.confidence < 0.7) {
    recommendations.push('⚠️ Confianza del modelo < 70% - usar con precaución');
  }
  
  return {
    regime,
    guardrails,
    recommendations,
    mathematicalJustification
  };
}