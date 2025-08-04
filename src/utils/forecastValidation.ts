// Temporal Validation and Anomaly Detection System

export interface ValidationMetrics {
  mape: number;
  mae: number;
  rmse: number;
  accuracy: number;
  confidence: 'Alta' | 'Media' | 'Baja';
}

export interface AnomalyDetection {
  isAnomaly: boolean;
  anomalyScore: number;
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface BacktestResult {
  period: string;
  actual: number;
  forecast: number;
  error: number;
  percentageError: number;
}

// === BACKTESTING Y VALIDACIÓN TEMPORAL ===

export function performBacktesting(
  historicalData: number[],
  validationPeriods: number = 6
): {
  results: BacktestResult[];
  overallMAPE: number;
  monthlyMAPE: number[];
  confidence: 'Alta' | 'Media' | 'Baja';
} {
  const results: BacktestResult[] = [];
  const monthlyMAPE: number[] = [];
  
  // Realizar backtesting para los últimos N períodos
  for (let i = validationPeriods; i > 0; i--) {
    const trainData = historicalData.slice(0, -i);
    const actualValue = historicalData[historicalData.length - i];
    
    if (trainData.length < 12) continue;
    
    // Calcular forecast usando Holt-Winters optimizado
    const forecast = calculateOptimizedHoltWinters(trainData, 1)[0];
    const error = actualValue - forecast;
    const percentageError = Math.abs(error / actualValue) * 100;
    
    results.push({
      period: `${historicalData.length - i + 1}`,
      actual: actualValue,
      forecast,
      error,
      percentageError
    });
    
    monthlyMAPE.push(percentageError);
  }
  
  const overallMAPE = monthlyMAPE.reduce((sum, mape) => sum + mape, 0) / monthlyMAPE.length;
  const confidence = overallMAPE < 15 ? 'Alta' : overallMAPE < 25 ? 'Media' : 'Baja';
  
  return {
    results,
    overallMAPE,
    monthlyMAPE,
    confidence
  };
}

// === DETECCIÓN DE ANOMALÍAS AVANZADA ===

export function detectAnomalies(
  data: number[],
  currentValue?: number
): AnomalyDetection {
  if (data.length < 6) {
    return {
      isAnomaly: false,
      anomalyScore: 0,
      reasons: ['Datos insuficientes para detección de anomalías'],
      severity: 'low'
    };
  }
  
  const reasons: string[] = [];
  let anomalyScore = 0;
  
  // 1. Detección de outliers usando IQR
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  if (currentValue && (currentValue < lowerBound || currentValue > upperBound)) {
    reasons.push('Valor fuera del rango IQR normal');
    anomalyScore += 0.3;
  }
  
  // 2. Detección de cambios abruptos en tendencia
  const recent3 = data.slice(-3);
  const previous3 = data.slice(-6, -3);
  
  if (recent3.length === 3 && previous3.length === 3) {
    const recentAvg = recent3.reduce((sum, val) => sum + val, 0) / 3;
    const previousAvg = previous3.reduce((sum, val) => sum + val, 0) / 3;
    const changePercent = Math.abs((recentAvg - previousAvg) / previousAvg);
    
    if (changePercent > 0.25) {
      reasons.push(`Cambio abrupto detectado: ${(changePercent * 100).toFixed(1)}%`);
      anomalyScore += 0.4;
    }
  }
  
  // 3. Detección de volatilidad excesiva
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;
  
  if (coefficientOfVariation > 0.3) {
    reasons.push(`Alta volatilidad detectada: CV=${(coefficientOfVariation * 100).toFixed(1)}%`);
    anomalyScore += 0.2;
  }
  
  // 4. Detección de valores negativos o cero
  if (currentValue !== undefined && currentValue <= 0) {
    reasons.push('Valor no válido (≤ 0)');
    anomalyScore += 0.5;
  }
  
  const isAnomaly = anomalyScore >= 0.4;
  const severity: 'low' | 'medium' | 'high' = 
    anomalyScore >= 0.7 ? 'high' : 
    anomalyScore >= 0.4 ? 'medium' : 'low';
  
  return {
    isAnomaly,
    anomalyScore,
    reasons,
    severity
  };
}

// === VALIDACIÓN DE CALIDAD DE DATOS ===

export function validateDataQuality(data: number[]): {
  quality: 'high' | 'medium' | 'low';
  issues: string[];
  completeness: number;
  consistency: number;
} {
  const issues: string[] = [];
  
  // 1. Completeness - porcentaje de datos no nulos/cero
  const validData = data.filter(val => val > 0);
  const completeness = (validData.length / data.length) * 100;
  
  if (completeness < 80) {
    issues.push(`Datos incompletos: ${completeness.toFixed(1)}% válidos`);
  }
  
  // 2. Consistency - detectar patrones inconsistentes
  let consistency = 100;
  const outliers = data.filter(val => {
    const mean = validData.reduce((sum, v) => sum + v, 0) / validData.length;
    const stdDev = Math.sqrt(validData.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / validData.length);
    return Math.abs(val - mean) > 2 * stdDev;
  });
  
  if (outliers.length > data.length * 0.1) {
    consistency -= 30;
    issues.push(`Múltiples outliers detectados: ${outliers.length}`);
  }
  
  // 3. Temporal consistency
  let zeroCount = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i] === 0 && data[i-1] > 0) {
      zeroCount++;
    }
  }
  
  if (zeroCount > 2) {
    consistency -= 20;
    issues.push(`Inconsistencias temporales: ${zeroCount} caídas a cero`);
  }
  
  const quality: 'high' | 'medium' | 'low' = 
    completeness >= 95 && consistency >= 85 ? 'high' :
    completeness >= 80 && consistency >= 70 ? 'medium' : 'low';
  
  return {
    quality,
    issues,
    completeness,
    consistency
  };
}

// === HOLT-WINTERS OPTIMIZADO ===

function calculateOptimizedHoltWinters(
  data: number[],
  periods: number,
  optimizeFor: 'accuracy' | 'responsiveness' = 'accuracy'
): number[] {
  if (data.length < 12) {
    throw new Error('Datos insuficientes para Holt-Winters');
  }
  
  const seasonLength = 12;
  let bestMAPE = Infinity;
  let bestResult: number[] = [];
  
  // Grid search optimizado
  const paramRanges = optimizeFor === 'responsiveness' 
    ? {
        alpha: [0.6, 0.7, 0.8, 0.9],
        beta: [0.3, 0.4, 0.5, 0.6],
        gamma: [0.2, 0.3, 0.4, 0.5]
      }
    : {
        alpha: [0.3, 0.4, 0.5, 0.6, 0.7],
        beta: [0.1, 0.2, 0.3, 0.4],
        gamma: [0.1, 0.2, 0.3, 0.4]
      };
  
  for (const alpha of paramRanges.alpha) {
    for (const beta of paramRanges.beta) {
      for (const gamma of paramRanges.gamma) {
        try {
          const result = holtWintersCore(data, seasonLength, periods, alpha, beta, gamma);
          const mape = calculateMAPE(data, result.forecast.slice(0, data.length));
          
          if (mape < bestMAPE) {
            bestMAPE = mape;
            bestResult = result.forecast;
          }
        } catch (e) {
          continue;
        }
      }
    }
  }
  
  return bestResult.slice(0, periods);
}

// === CORE HOLT-WINTERS IMPLEMENTATION ===

function holtWintersCore(
  data: number[],
  seasonLength: number,
  periods: number,
  alpha: number,
  beta: number,
  gamma: number
): { forecast: number[]; level: number; trend: number; seasonal: number[] } {
  const n = data.length;
  const level: number[] = new Array(n);
  const trend: number[] = new Array(n);
  const seasonal: number[] = new Array(n + periods);
  
  // Inicialización mejorada
  level[0] = data.slice(0, seasonLength).reduce((sum, val) => sum + val, 0) / seasonLength;
  trend[0] = 0;
  
  // Inicialización de componentes estacionales
  for (let i = 0; i < seasonLength; i++) {
    seasonal[i] = data[i] / level[0];
  }
  
  // Aplicar algoritmo Holt-Winters
  for (let i = 1; i < n; i++) {
    const prevLevel = level[i - 1];
    const prevTrend = trend[i - 1];
    const seasonalIndex = (i - seasonLength) % seasonLength;
    
    level[i] = alpha * (data[i] / seasonal[seasonalIndex]) + (1 - alpha) * (prevLevel + prevTrend);
    trend[i] = beta * (level[i] - prevLevel) + (1 - beta) * prevTrend;
    seasonal[i] = gamma * (data[i] / level[i]) + (1 - gamma) * seasonal[seasonalIndex];
  }
  
  // Generar forecast
  const forecast: number[] = [];
  for (let i = 0; i < periods; i++) {
    const seasonalIndex = (n + i - seasonLength) % seasonLength;
    const forecastValue = (level[n - 1] + (i + 1) * trend[n - 1]) * seasonal[seasonalIndex];
    forecast.push(Math.max(0, forecastValue));
  }
  
  return {
    forecast,
    level: level[n - 1],
    trend: trend[n - 1],
    seasonal: seasonal.slice(0, seasonLength)
  };
}

// === UTILIDADES ===

function calculateMAPE(actual: number[], forecast: number[]): number {
  if (actual.length !== forecast.length || actual.length === 0) {
    return 50;
  }
  
  let totalError = 0;
  let validPairs = 0;
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] > 0) {
      totalError += Math.abs((actual[i] - forecast[i]) / actual[i]);
      validPairs++;
    }
  }
  
  return validPairs > 0 ? (totalError / validPairs) * 100 : 50;
}