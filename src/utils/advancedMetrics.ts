/**
 * Advanced forecasting metrics and validation utilities
 * Implements sMAPE, MASE, MAE, and robust error calculation methods
 */

export interface AdvancedMetrics {
  smape: number;
  mase: number;
  mae: number;
  weightedMape: number;
  confidence: 'Alta' | 'Media' | 'Baja';
  quality: 'high' | 'medium' | 'low';
}

export interface OutlierDetection {
  outliers: number[];
  cleanedData: number[];
  outlierIndices: number[];
  winsorizedData: number[];
}

/**
 * Calculate Symmetric Mean Absolute Percentage Error (sMAPE)
 * More robust than MAPE, especially for values near zero
 */
export function calculateSMAPE(actual: number[], forecast: number[]): number {
  if (actual.length !== forecast.length || actual.length === 0) return 100;
  
  let sum = 0;
  let validPoints = 0;
  
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i];
    const f = forecast[i];
    
    if (a !== 0 || f !== 0) {
      const denominator = (Math.abs(a) + Math.abs(f)) / 2;
      if (denominator > 0) {
        sum += Math.abs(a - f) / denominator;
        validPoints++;
      }
    }
  }
  
  return validPoints > 0 ? (sum / validPoints) * 100 : 100;
}

/**
 * Calculate Mean Absolute Scaled Error (MASE)
 * Scale-independent metric, compares against naive forecast
 */
export function calculateMASE(
  actual: number[], 
  forecast: number[], 
  seasonalPeriod: number = 12
): number {
  if (actual.length !== forecast.length || actual.length === 0) return 10;
  
  // Calculate MAE of forecast
  const mae = actual.reduce((sum, a, i) => sum + Math.abs(a - forecast[i]), 0) / actual.length;
  
  // Calculate MAE of naive seasonal forecast
  let naiveMae = 0;
  let naiveCount = 0;
  
  for (let i = seasonalPeriod; i < actual.length; i++) {
    naiveMae += Math.abs(actual[i] - actual[i - seasonalPeriod]);
    naiveCount++;
  }
  
  if (naiveCount === 0) return mae; // Fallback to MAE if not enough data
  
  const naiveMAE = naiveMae / naiveCount;
  return naiveMAE > 0 ? mae / naiveMAE : mae;
}

/**
 * Calculate Mean Absolute Error (MAE)
 */
export function calculateMAE(actual: number[], forecast: number[]): number {
  if (actual.length !== forecast.length || actual.length === 0) return 1000;
  
  return actual.reduce((sum, a, i) => sum + Math.abs(a - forecast[i]), 0) / actual.length;
}

/**
 * Calculate weighted MAPE with time decay
 */
export function calculateWeightedMAPE(
  actual: number[], 
  forecast: number[], 
  decayFactor: number = 0.9
): number {
  if (actual.length !== forecast.length || actual.length === 0) return 100;
  
  let weightedError = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < actual.length; i++) {
    const weight = Math.pow(decayFactor, actual.length - 1 - i);
    const a = actual[i];
    const f = forecast[i];
    
    if (Math.abs(a) > 0.01) { // Avoid division by very small numbers
      weightedError += weight * Math.abs((a - f) / a);
      totalWeight += weight;
    }
  }
  
  return totalWeight > 0 ? (weightedError / totalWeight) * 100 : 100;
}

/**
 * Detect outliers using IQR method with automatic winsorization
 */
export function detectAndTreatOutliers(
  data: number[], 
  multiplier: number = 2.5
): OutlierDetection {
  if (data.length < 4) {
    return {
      outliers: [],
      cleanedData: [...data],
      outlierIndices: [],
      winsorizedData: [...data]
    };
  }
  
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;
  
  const outliers: number[] = [];
  const outlierIndices: number[] = [];
  const cleanedData: number[] = [];
  const winsorizedData: number[] = [];
  
  // Calculate 5th and 95th percentiles for winsorization
  const p5 = sorted[Math.floor(sorted.length * 0.05)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  
  data.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      outliers.push(value);
      outlierIndices.push(index);
      // For cleaned data, use median of surrounding values
      const median = sorted[Math.floor(sorted.length / 2)];
      cleanedData.push(median);
    } else {
      cleanedData.push(value);
    }
    
    // Winsorization: cap extreme values
    if (value < p5) {
      winsorizedData.push(p5);
    } else if (value > p95) {
      winsorizedData.push(p95);
    } else {
      winsorizedData.push(value);
    }
  });
  
  return {
    outliers,
    cleanedData,
    outlierIndices,
    winsorizedData
  };
}

/**
 * Calculate comprehensive metrics with confidence assessment
 */
export function calculateAdvancedMetrics(
  actual: number[], 
  forecast: number[], 
  dataQuality: 'high' | 'medium' | 'low' = 'medium'
): AdvancedMetrics {
  const smape = calculateSMAPE(actual, forecast);
  const mase = calculateMASE(actual, forecast);
  const mae = calculateMAE(actual, forecast);
  const weightedMape = calculateWeightedMAPE(actual, forecast);
  
  // Determine confidence based on multiple metrics
  let confidence: 'Alta' | 'Media' | 'Baja';
  
  if (smape < 15 && mase < 1.0 && dataQuality === 'high') {
    confidence = 'Alta';
  } else if (smape < 25 && mase < 1.5 && dataQuality !== 'low') {
    confidence = 'Media';
  } else {
    confidence = 'Baja';
  }
  
  // Quality assessment based on metrics
  let quality: 'high' | 'medium' | 'low';
  if (smape < 20 && mase < 1.2) {
    quality = 'high';
  } else if (smape < 40 && mase < 2.0) {
    quality = 'medium';
  } else {
    quality = 'low';
  }
  
  return {
    smape,
    mase,
    mae,
    weightedMape,
    confidence,
    quality
  };
}

/**
 * Temporal cross-validation with walk-forward approach
 */
export function performWalkForwardValidation(
  data: number[],
  forecastFunction: (trainData: number[], periods: number) => number[],
  minTrainSize: number = 6,
  testSize: number = 1
): AdvancedMetrics {
  if (data.length < minTrainSize + testSize) {
    return {
      smape: 100,
      mase: 10,
      mae: 1000,
      weightedMape: 100,
      confidence: 'Baja',
      quality: 'low'
    };
  }
  
  const actualValues: number[] = [];
  const forecastValues: number[] = [];
  
  for (let i = minTrainSize; i <= data.length - testSize; i++) {
    const trainData = data.slice(0, i);
    const testData = data.slice(i, i + testSize);
    
    try {
      const forecast = forecastFunction(trainData, testSize);
      
      if (forecast && forecast.length >= testSize) {
        actualValues.push(...testData);
        forecastValues.push(...forecast.slice(0, testSize));
      }
    } catch (error) {
      console.warn('Walk-forward validation error:', error);
    }
  }
  
  if (actualValues.length === 0) {
    return {
      smape: 100,
      mase: 10,
      mae: 1000,
      weightedMape: 100,
      confidence: 'Baja',
      quality: 'low'
    };
  }
  
  return calculateAdvancedMetrics(actualValues, forecastValues);
}