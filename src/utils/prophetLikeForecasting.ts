/**
 * Prophet-like forecasting implementation in JavaScript
 * Implements trend detection, seasonality, and changepoint detection
 */

export interface ProphetConfig {
  seasonalityMode: 'additive' | 'multiplicative';
  changePointPriorScale: number;
  seasonalityPriorScale: number;
  n_changepoints: number;
  yearly_seasonality: boolean;
  weekly_seasonality: boolean;
  daily_seasonality: boolean;
  intervals: number[];
}

export interface ProphetResult {
  forecast: number[];
  trend: number[];
  seasonal: number[];
  residuals: number[];
  changepoints: number[];
  lower_bound: number[];
  upper_bound: number[];
  confidence: number;
  components: {
    trend: number[];
    yearly: number[];
    residual: number[];
  };
}

/**
 * Default Prophet configuration optimized for business data
 */
const DEFAULT_CONFIG: ProphetConfig = {
  seasonalityMode: 'additive',
  changePointPriorScale: 0.15, // Increased from 0.05 to capture recent acceleration
  seasonalityPriorScale: 20.0, // Increased from 10.0 for better trend flexibility
  n_changepoints: 35, // Increased from 25 for better trend detection
  yearly_seasonality: true,
  weekly_seasonality: false,
  daily_seasonality: false,
  intervals: [0.8, 0.95]
};

/**
 * Detect changepoints in time series using simple linear regression segments
 */
function detectChangepoints(data: number[], n_changepoints: number = 25): number[] {
  if (data.length < 10) return [];
  
  const changepoints: number[] = [];
  const segmentSize = Math.floor(data.length / (n_changepoints + 1));
  
  for (let i = segmentSize; i < data.length - segmentSize; i += segmentSize) {
    if (changepoints.length < n_changepoints) {
      // Calculate trend change at this point
      const before = data.slice(Math.max(0, i - segmentSize), i);
      const after = data.slice(i, Math.min(data.length, i + segmentSize));
      
      const trendBefore = calculateTrend(before);
      const trendAfter = calculateTrend(after);
      
      // If trend change is significant, mark as changepoint
      if (Math.abs(trendAfter - trendBefore) > 0.1 * Math.abs(trendBefore)) {
        changepoints.push(i);
      }
    }
  }
  
  return changepoints;
}

/**
 * Calculate linear trend for a data segment
 */
function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0;
  
  const n = data.length;
  const x = Array.from({length: n}, (_, i) => i);
  const y = data;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

/**
 * Calculate seasonal components using Fourier series
 */
function calculateSeasonality(
  data: number[], 
  period: number = 12, 
  harmonics: number = 3
): number[] {
  const n = data.length;
  const seasonal = new Array(n).fill(0);
  
  // Calculate Fourier components
  for (let h = 1; h <= harmonics; h++) {
    let sinSum = 0;
    let cosSum = 0;
    
    for (let i = 0; i < n; i++) {
      const angle = 2 * Math.PI * h * i / period;
      sinSum += data[i] * Math.sin(angle);
      cosSum += data[i] * Math.cos(angle);
    }
    
    const sinCoeff = (2 * sinSum) / n;
    const cosCoeff = (2 * cosSum) / n;
    
    for (let i = 0; i < n; i++) {
      const angle = 2 * Math.PI * h * i / period;
      seasonal[i] += sinCoeff * Math.sin(angle) + cosCoeff * Math.cos(angle);
    }
  }
  
  return seasonal;
}

/**
 * Fit piecewise linear trend with changepoints
 */
function fitPiecewiseTrend(
  data: number[], 
  changepoints: number[],
  changePointPriorScale: number = 0.05
): number[] {
  const n = data.length;
  const trend = new Array(n);
  
  if (changepoints.length === 0) {
    // Simple linear trend
    const slope = calculateTrend(data);
    const intercept = data[0];
    
    for (let i = 0; i < n; i++) {
      trend[i] = intercept + slope * i;
    }
    
    return trend;
  }
  
  // Fit piecewise linear segments
  const segments = [0, ...changepoints, n - 1];
  
  for (let s = 0; s < segments.length - 1; s++) {
    const start = segments[s];
    const end = segments[s + 1];
    const segmentData = data.slice(start, end + 1);
    const segmentTrend = calculateTrend(segmentData);
    
    let intercept;
    if (s === 0) {
      intercept = data[start];
    } else {
      // Ensure continuity
      intercept = trend[start - 1] - segmentTrend * start;
    }
    
    for (let i = start; i <= end; i++) {
      trend[i] = intercept + segmentTrend * i;
    }
  }
  
  return trend;
}

/**
 * Calculate prediction intervals using residual variance
 */
function calculatePredictionIntervals(
  forecast: number[],
  residuals: number[],
  intervals: number[] = [0.8, 0.95]
): { lower_bound: number[]; upper_bound: number[] } {
  const residualVar = residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length;
  const residualStd = Math.sqrt(residualVar);
  
  // Use t-distribution approximation for confidence intervals
  const tValue95 = 1.96; // Approximate for large samples
  const tValue80 = 1.28;
  
  const lower_bound = forecast.map(f => f - tValue95 * residualStd);
  const upper_bound = forecast.map(f => f + tValue95 * residualStd);
  
  return { lower_bound, upper_bound };
}

/**
 * Main Prophet-like forecasting function
 */
export function prophetForecast(
  data: number[],
  periods: number = 1,
  config: Partial<ProphetConfig> = {}
): ProphetResult {
  const conf = { ...DEFAULT_CONFIG, ...config };
  
  if (data.length < 4) {
    // Fallback for insufficient data
    const lastValue = data[data.length - 1] || 0;
    return {
      forecast: new Array(periods).fill(lastValue),
      trend: new Array(data.length).fill(lastValue),
      seasonal: new Array(data.length).fill(0),
      residuals: new Array(data.length).fill(0),
      changepoints: [],
      lower_bound: new Array(periods).fill(lastValue * 0.8),
      upper_bound: new Array(periods).fill(lastValue * 1.2),
      confidence: 0.3,
      components: {
        trend: new Array(data.length).fill(lastValue),
        yearly: new Array(data.length).fill(0),
        residual: new Array(data.length).fill(0)
      }
    };
  }
  
  // Step 1: Detect changepoints
  const changepoints = detectChangepoints(data, conf.n_changepoints);
  
  // Step 2: Fit trend
  const trend = fitPiecewiseTrend(data, changepoints, conf.changePointPriorScale);
  
  // Step 3: Calculate seasonality
  const seasonal = conf.yearly_seasonality ? 
    calculateSeasonality(data, 12, 3) : 
    new Array(data.length).fill(0);
  
  // Step 4: Calculate residuals
  const residuals = data.map((d, i) => d - trend[i] - seasonal[i]);
  
  // Step 5: Forecast future periods
  const forecast: number[] = [];
  const forecastTrend: number[] = [];
  const forecastSeasonal: number[] = [];
  
  const lastTrendSlope = trend.length > 1 ? 
    trend[trend.length - 1] - trend[trend.length - 2] : 0;
  
  for (let p = 0; p < periods; p++) {
    const futureIndex = data.length + p;
    
    // Extrapolate trend
    const futureTrend = trend[trend.length - 1] + lastTrendSlope * (p + 1);
    forecastTrend.push(futureTrend);
    
    // Extrapolate seasonality
    const seasonalIndex = futureIndex % 12;
    const avgSeasonal = seasonal.length > 12 ? 
      seasonal.slice(-12)[seasonalIndex] || 0 : 0;
    forecastSeasonal.push(avgSeasonal);
    
    // Combine components
    if (conf.seasonalityMode === 'additive') {
      forecast.push(futureTrend + avgSeasonal);
    } else {
      forecast.push(futureTrend * (1 + avgSeasonal));
    }
  }
  
  // Step 6: Calculate prediction intervals
  const { lower_bound, upper_bound } = calculatePredictionIntervals(
    forecast, 
    residuals, 
    conf.intervals
  );
  
  // Step 7: Calculate confidence
  const residualVar = residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length;
  const dataVar = data.reduce((sum, d) => {
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    return sum + (d - mean) * (d - mean);
  }, 0) / data.length;
  
  const confidence = Math.max(0, Math.min(1, 1 - (residualVar / dataVar)));
  
  return {
    forecast,
    trend,
    seasonal,
    residuals,
    changepoints,
    lower_bound,
    upper_bound,
    confidence,
    components: {
      trend,
      yearly: seasonal,
      residual: residuals
    }
  };
}

/**
 * Optimize Prophet parameters using grid search
 */
export function optimizeProphetParameters(
  data: number[],
  validationPeriods: number = 3
): ProphetConfig {
  if (data.length < validationPeriods + 6) {
    return DEFAULT_CONFIG;
  }
  
  const trainData = data.slice(0, -validationPeriods);
  const testData = data.slice(-validationPeriods);
  
  const paramGrid = {
    changePointPriorScale: [0.001, 0.01, 0.05, 0.1, 0.5],
    seasonalityPriorScale: [0.01, 0.1, 1.0, 10.0],
    n_changepoints: [5, 10, 15, 25]
  };
  
  let bestConfig = DEFAULT_CONFIG;
  let bestError = Infinity;
  
  for (const cps of paramGrid.changePointPriorScale) {
    for (const sps of paramGrid.seasonalityPriorScale) {
      for (const nc of paramGrid.n_changepoints) {
        const config = {
          ...DEFAULT_CONFIG,
          changePointPriorScale: cps,
          seasonalityPriorScale: sps,
          n_changepoints: nc
        };
        
        try {
          const result = prophetForecast(trainData, validationPeriods, config);
          const error = testData.reduce((sum, actual, i) => {
            const predicted = result.forecast[i] || actual;
            return sum + Math.abs(actual - predicted);
          }, 0) / validationPeriods;
          
          if (error < bestError) {
            bestError = error;
            bestConfig = config;
          }
        } catch (error) {
          continue;
        }
      }
    }
  }
  
  return bestConfig;
}