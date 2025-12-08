/**
 * Intelligent Ensemble System
 * Sistema de ensemble inteligente con pesos dinámicos y validación cruzada temporal
 * Includes Prophet model integration
 */

import { RegimeDetectionResult, performMathematicalRegimeAnalysis } from './regimeDetection';
import { calculateAdvancedMetrics, performWalkForwardValidation, type AdvancedMetrics } from './advancedMetrics';
import { prophetForecast } from './prophetLikeForecasting';

// ========== INTERFACES ==========

export interface ModelPrediction {
  name: string;
  value: number;
  confidence: number;
  performance_score: number;
  regime_affinity: number; // Qué tan bien funciona en el régimen actual
}

export interface IntelligentEnsembleResult {
  prediction: number;
  confidence: number;
  ensemble_weights: Record<string, number>;
  individual_models: ModelPrediction[];
  regime_analysis: RegimeDetectionResult;
  mathematical_justification: string;
  uncertainty_bounds: { lower: number; upper: number; };
  adaptive_guardrails: {
    upper_limit: number;
    lower_limit: number;
    regime_adjusted: boolean;
  };
}

// ========== MODELOS INDIVIDUALES ==========

export function calculateHoltWintersModel(data: number[], alpha: number = 0.3): ModelPrediction {
  if (data.length < 3) {
    return { name: 'Holt-Winters', value: data[data.length - 1] || 0, confidence: 0.3, performance_score: 0.3, regime_affinity: 0.7 };
  }
  
  // Holt-Winters simplificado (sin estacionalidad para mensual)
  let level = data[0];
  let trend = data.length > 1 ? data[1] - data[0] : 0;
  
  for (let i = 1; i < data.length; i++) {
    const prevLevel = level;
    level = alpha * data[i] + (1 - alpha) * (level + trend);
    trend = alpha * (level - prevLevel) + (1 - alpha) * trend;
  }
  
  const prediction = level + trend;
  
  // Calcular performance histórico (MAPE simplificado)
  const predictions = [];
  let tempLevel = data[0];
  let tempTrend = data.length > 1 ? data[1] - data[0] : 0;
  
  for (let i = 1; i < data.length; i++) {
    predictions.push(tempLevel + tempTrend);
    const prevLevel = tempLevel;
    tempLevel = alpha * data[i] + (1 - alpha) * (tempLevel + tempTrend);
    tempTrend = alpha * (tempLevel - prevLevel) + (1 - alpha) * tempTrend;
  }
  
  const mape = predictions.reduce((sum, pred, i) => {
    const actual = data[i + 1];
    return sum + (actual > 0 ? Math.abs(pred - actual) / actual : 0);
  }, 0) / predictions.length;
  
  const performance_score = Math.max(0, 1 - mape);
  const confidence = Math.min(0.9, performance_score * 1.2);
  
  return {
    name: 'Holt-Winters',
    value: prediction,
    confidence,
    performance_score,
    regime_affinity: 0.8 // Funciona bien en regímenes estables
  };
}

export function calculateLinearRegressionModel(data: number[]): ModelPrediction {
  if (data.length < 3) {
    return { name: 'Linear Regression', value: data[data.length - 1] || 0, confidence: 0.3, performance_score: 0.3, regime_affinity: 0.6 };
  }
  
  const x = data.map((_, i) => i);
  const y = data;
  const n = data.length;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const prediction = intercept + slope * n; // Próximo punto
  
  // R² para performance
  const yMean = sumY / n;
  const predictions = x.map(xi => intercept + slope * xi);
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const r_squared = Math.max(0, 1 - ssRes / ssTot);
  
  return {
    name: 'Linear Regression',
    value: prediction,
    confidence: Math.min(0.85, r_squared),
    performance_score: r_squared,
    regime_affinity: 0.9 // Funciona muy bien en regímenes lineales
  };
}

export function calculateMonteCarloModel(data: number[], simulations: number = 1000): ModelPrediction {
  if (data.length < 3) {
    return { name: 'Monte Carlo', value: data[data.length - 1] || 0, confidence: 0.4, performance_score: 0.4, regime_affinity: 0.7 };
  }
  
  // Calcular distribución de growth rates
  const growthRates = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1] > 0) {
      growthRates.push(data[i] / data[i - 1] - 1);
    }
  }
  
  if (growthRates.length === 0) {
    return { name: 'Monte Carlo', value: data[data.length - 1] || 0, confidence: 0.4, performance_score: 0.4, regime_affinity: 0.7 };
  }
  
  const meanGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  const stdGrowth = Math.sqrt(growthRates.reduce((sum, rate) => sum + Math.pow(rate - meanGrowth, 2), 0) / growthRates.length);
  
  // Simulaciones Monte Carlo
  const simResults = [];
  const lastValue = data[data.length - 1];
  
  for (let i = 0; i < simulations; i++) {
    // Box-Muller para normal random
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const randomGrowth = meanGrowth + z * stdGrowth;
    
    simResults.push(lastValue * (1 + randomGrowth));
  }
  
  const prediction = simResults.reduce((a, b) => a + b, 0) / simulations;
  const simStd = Math.sqrt(simResults.reduce((sum, val) => sum + Math.pow(val - prediction, 2), 0) / simulations);
  
  // Confidence basado en consistencia de simulaciones
  const confidence = Math.max(0.3, Math.min(0.8, 1 - (simStd / prediction)));
  
  return {
    name: 'Monte Carlo',
    value: prediction,
    confidence,
    performance_score: confidence,
    regime_affinity: 0.9 // Funciona bien en todos los regímenes por su naturaleza estocástica
  };
}

export function calculateSeasonalModel(data: number[]): ModelPrediction {
  if (data.length < 6) {
    return { name: 'Seasonal', value: data[data.length - 1] || 0, confidence: 0.3, performance_score: 0.3, regime_affinity: 0.5 };
  }
  
  // Descomposición estacional simple (asumiendo ciclo de 12 meses)
  const seasonalPeriod = Math.min(12, data.length);
  
  // Calcular componente estacional
  const seasonal = [];
  for (let i = 0; i < seasonalPeriod; i++) {
    const values = [];
    for (let j = i; j < data.length; j += seasonalPeriod) {
      values.push(data[j]);
    }
    seasonal[i] = values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  // Trend component (regresión lineal en datos deseasonalizados)
  const deseasonalized = data.map((val, i) => val - seasonal[i % seasonalPeriod]);
  const trend = calculateLinearRegressionModel(deseasonalized);
  
  // Prediction = trend + seasonal
  const nextSeasonalIndex = data.length % seasonalPeriod;
  const prediction = trend.value + seasonal[nextSeasonalIndex];
  
  return {
    name: 'Seasonal',
    value: prediction,
    confidence: Math.min(0.75, trend.confidence * 0.8),
    performance_score: trend.performance_score * 0.8,
    regime_affinity: 0.6 // Moderadamente útil en la mayoría de regímenes
  };
}

/**
 * Prophet Model integration
 * Uses the existing prophetForecast function from prophetLikeForecasting.ts
 */
export function calculateProphetModel(data: number[]): ModelPrediction {
  if (data.length < 6) {
    return { name: 'Prophet', value: data[data.length - 1] || 0, confidence: 0.3, performance_score: 0.3, regime_affinity: 0.8 };
  }
  
  try {
    // Use Prophet implementation
    const result = prophetForecast(data, 1);
    
    const prediction = result.forecast[0] || data[data.length - 1];
    const confidence = result.confidence;
    
    // Calculate performance score based on in-sample fit
    const residuals = result.residuals;
    const mse = residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length;
    const dataMean = data.reduce((a, b) => a + b, 0) / data.length;
    const dataVar = data.reduce((sum, d) => sum + Math.pow(d - dataMean, 2), 0) / data.length;
    const performance_score = Math.max(0, 1 - (mse / dataVar));
    
    return {
      name: 'Prophet',
      value: prediction,
      confidence,
      performance_score,
      regime_affinity: 0.85 // Prophet handles changepoints and seasonality well
    };
  } catch (error) {
    console.warn('Prophet model calculation failed, using fallback:', error);
    return { name: 'Prophet', value: data[data.length - 1] || 0, confidence: 0.3, performance_score: 0.3, regime_affinity: 0.8 };
  }
}

// ========== PESOS DINÁMICOS ==========

export function calculateDynamicWeights(
  models: ModelPrediction[],
  regime: RegimeDetectionResult,
  dataQuality: 'high' | 'medium' | 'low' = 'medium'
): Record<string, number> {
  
  // Factores de calidad de datos
  const qualityMultiplier = dataQuality === 'high' ? 1.2 : dataQuality === 'low' ? 0.8 : 1.0;
  
  // Calcular score combinado para cada modelo
  const modelScores = models.map(model => {
    const performanceScore = model.performance_score * qualityMultiplier;
    const regimeAffinityScore = model.regime_affinity;
    const confidenceScore = model.confidence;
    
    // Ajuste específico por régimen
    let regimeBonus = 1.0;
    switch (regime.regime) {
      case 'exponential':
        if (model.name === 'Monte Carlo' || model.name === 'Linear Regression') {
          regimeBonus = 1.3; // Favorece modelos que capturan crecimiento
        }
        if (model.name === 'Prophet') {
          regimeBonus = 1.2; // Prophet handles exponential trends well
        }
        break;
      case 'volatile':
        if (model.name === 'Monte Carlo') {
          regimeBonus = 1.4; // Monte Carlo maneja mejor la volatilidad
        }
        if (model.name === 'Prophet') {
          regimeBonus = 1.25; // Prophet's changepoint detection helps
        }
        break;
      case 'declining':
        if (model.name === 'Holt-Winters' || model.name === 'Linear Regression') {
          regimeBonus = 1.2; // Modelos que capturan tendencias lineales
        }
        break;
      default: // normal
        regimeBonus = 1.0; // Pesos balanceados
    }
    
    // Score final
    const combinedScore = (
      performanceScore * 0.4 +
      regimeAffinityScore * 0.3 +
      confidenceScore * 0.3
    ) * regimeBonus;
    
    return { model: model.name, score: combinedScore };
  });
  
  // Softmax para normalizar pesos
  const expScores = modelScores.map(m => Math.exp(m.score));
  const sumExpScores = expScores.reduce((a, b) => a + b, 0);
  
  const weights: Record<string, number> = {};
  modelScores.forEach((modelScore, i) => {
    weights[modelScore.model] = expScores[i] / sumExpScores;
  });
  
  return weights;
}

// ========== ENSEMBLE PRINCIPAL ==========

export function calculateIntelligentEnsemble(
  historicalData: number[],
  currentValue: number,
  dataQuality: 'high' | 'medium' | 'low' = 'medium',
  externalAdjustment?: { factor: number; reason: string }
): IntelligentEnsembleResult {
  
  if (historicalData.length < 3) {
    return {
      prediction: currentValue,
      confidence: 0.3,
      ensemble_weights: { 'simple': 1.0 },
      individual_models: [],
      regime_analysis: {
        regime: 'normal',
        confidence: 0.3,
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
      },
      mathematical_justification: 'Datos insuficientes para análisis matemático completo',
      uncertainty_bounds: { lower: currentValue * 0.8, upper: currentValue * 1.2 },
      adaptive_guardrails: { upper_limit: currentValue * 1.3, lower_limit: currentValue * 0.7, regime_adjusted: false }
    };
  }
  
  // 1. Análisis de régimen
  const regimeAnalysis = performMathematicalRegimeAnalysis(historicalData, currentValue);
  
  // 2. Calcular modelos individuales (now includes Prophet - 5 models)
  const models: ModelPrediction[] = [
    calculateHoltWintersModel(historicalData),
    calculateLinearRegressionModel(historicalData),
    calculateMonteCarloModel(historicalData),
    calculateSeasonalModel(historicalData),
    calculateProphetModel(historicalData) // NEW: Prophet model
  ];
  
  // 3. Pesos dinámicos
  const weights = calculateDynamicWeights(models, regimeAnalysis.regime, dataQuality);
  
  // 4. Predicción ensemble
  const ensemblePrediction = models.reduce((sum, model) => {
    return sum + model.value * (weights[model.name] || 0);
  }, 0);
  
  // 5. Confidence ensemble
  const ensembleConfidence = models.reduce((sum, model) => {
    return sum + model.confidence * (weights[model.name] || 0);
  }, 0);
  
  // 6. Uncertainty bounds (basado en dispersión de modelos)
  const modelValues = models.map(m => m.value);
  const modelMean = modelValues.reduce((a, b) => a + b, 0) / modelValues.length;
  const modelStd = Math.sqrt(modelValues.reduce((sum, val) => sum + Math.pow(val - modelMean, 2), 0) / modelValues.length);
  
  const uncertaintyBounds = {
    lower: ensemblePrediction - 1.96 * modelStd,
    upper: ensemblePrediction + 1.96 * modelStd
  };
  
  // 7. Aplicar guardrails adaptativos
  const guardrails = regimeAnalysis.guardrails;
  let finalPrediction = ensemblePrediction;
  let regime_adjusted = false;
  
  if (ensemblePrediction > guardrails.upperLimit) {
    finalPrediction = guardrails.upperLimit;
    regime_adjusted = true;
  } else if (ensemblePrediction < guardrails.lowerLimit) {
    finalPrediction = guardrails.lowerLimit;
    regime_adjusted = true;
  }
  
  // 7.5. Aplicar ajuste externo (ej: feriados)
  let externalAdjustmentApplied = false;
  let externalAdjustmentReason = '';
  if (externalAdjustment && externalAdjustment.factor !== 1.0) {
    finalPrediction = finalPrediction * externalAdjustment.factor;
    externalAdjustmentApplied = true;
    externalAdjustmentReason = externalAdjustment.reason;
  }
  
  // 8. Justificación matemática
  const topModel = models.reduce((prev, current) => (weights[current.name] || 0) > (weights[prev.name] || 0) ? current : prev);
  const mathematicalJustification = `
    Régimen: ${regimeAnalysis.regime.regime} (conf: ${regimeAnalysis.regime.confidence.toFixed(2)}).
    Modelo dominante: ${topModel.name} (peso: ${(weights[topModel.name] * 100).toFixed(1)}%).
    Ensemble de ${models.length} modelos: ${models.map(m => m.name).join(', ')}.
    ${regimeAnalysis.mathematicalJustification}
    ${regime_adjusted ? `Ajustado por guardrails: ${ensemblePrediction.toFixed(0)} → ${finalPrediction.toFixed(0)}` : ''}
    ${externalAdjustmentApplied ? `Ajuste externo (${externalAdjustmentReason}): factor ${externalAdjustment?.factor.toFixed(3)}` : ''}
  `.trim();
  
  return {
    prediction: finalPrediction,
    confidence: ensembleConfidence * (regime_adjusted ? 0.8 : 1.0), // Reduce confidence si se ajustó
    ensemble_weights: weights,
    individual_models: models,
    regime_analysis: regimeAnalysis.regime,
    mathematical_justification: mathematicalJustification,
    uncertainty_bounds: uncertaintyBounds,
    adaptive_guardrails: {
      upper_limit: guardrails.upperLimit,
      lower_limit: guardrails.lowerLimit,
      regime_adjusted
    }
  };
}

// ========== VALIDACIÓN TEMPORAL ==========

export function performTemporalValidation(
  historicalData: number[],
  ensembleFunction: (data: number[]) => number,
  validationPeriods: number = 3
): {
  accuracy: number;
  mape: number;
  consistency: number;
  temporal_performance: Array<{ period: number; accuracy: number; prediction: number; actual: number; }>;
} {
  
  if (historicalData.length < validationPeriods + 3) {
    return {
      accuracy: 0.5,
      mape: 0.3,
      consistency: 0.5,
      temporal_performance: []
    };
  }
  
  const results = [];
  
  // Walk-forward validation
  for (let i = 0; i < validationPeriods; i++) {
    const trainEndIndex = historicalData.length - validationPeriods + i;
    const trainData = historicalData.slice(0, trainEndIndex);
    const actual = historicalData[trainEndIndex];
    
    if (trainData.length >= 3) {
      const prediction = ensembleFunction(trainData);
      const accuracy = actual > 0 ? 1 - Math.abs(prediction - actual) / actual : 0;
      
      results.push({
        period: i + 1,
        accuracy: Math.max(0, accuracy),
        prediction,
        actual
      });
    }
  }
  
  if (results.length === 0) {
    return {
      accuracy: 0.5,
      mape: 0.3,
      consistency: 0.5,
      temporal_performance: []
    };
  }
  
  // Métricas agregadas
  const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
  
  const mape = results.reduce((sum, r) => {
    return sum + (r.actual > 0 ? Math.abs(r.prediction - r.actual) / r.actual : 0);
  }, 0) / results.length;
  
  // Consistency: varianza de las accuracies
  const accuracyMean = avgAccuracy;
  const accuracyVariance = results.reduce((sum, r) => sum + Math.pow(r.accuracy - accuracyMean, 2), 0) / results.length;
  const consistency = Math.max(0, 1 - Math.sqrt(accuracyVariance));
  
  return {
    accuracy: avgAccuracy,
    mape,
    consistency,
    temporal_performance: results
  };
}
