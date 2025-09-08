import { toast } from "sonner";

export interface ForecastValidationConfig {
  minServices: number;
  maxServices: number;
  minGMV: number;
  maxGMV: number;
  maxDeviationPercent: number;
  ytdContext: {
    services: number;
    gmv: number;
    avgMonthly: number;
  };
  recentTrend: {
    lastMonthServices: number;
    growth: number;
    acceleration: boolean;
  };
}

export interface ValidationResult {
  isValid: boolean;
  adjustedServices?: number;
  adjustedGMV?: number;
  warnings: string[];
  confidence: 'high' | 'medium' | 'low';
  deviation: number;
}

/**
 * Validates forecast results against realistic bounds and recent trends
 */
export function validateForecastRealism(
  forecastServices: number,
  forecastGMV: number,
  config: ForecastValidationConfig
): ValidationResult {
  const warnings: string[] = [];
  let adjustedServices = forecastServices;
  let adjustedGMV = forecastGMV;
  let isValid = true;
  let confidence: 'high' | 'medium' | 'low' = 'high';

  // Calculate deviation from YTD average
  const deviation = Math.abs(forecastServices - config.ytdContext.avgMonthly) / config.ytdContext.avgMonthly;

  // 1. Range validation
  if (forecastServices < config.minServices || forecastServices > config.maxServices) {
    warnings.push(`Services forecast ${forecastServices} outside realistic range [${config.minServices}, ${config.maxServices}]`);
    adjustedServices = Math.max(config.minServices, Math.min(config.maxServices, forecastServices));
    isValid = false;
    confidence = 'low';
  }

  if (forecastGMV < config.minGMV || forecastGMV > config.maxGMV) {
    warnings.push(`GMV forecast ${forecastGMV} outside realistic range [${config.minGMV}, ${config.maxGMV}]`);
    adjustedGMV = Math.max(config.minGMV, Math.min(config.maxGMV, forecastGMV));
    isValid = false;
    confidence = 'low';
  }

  // 2. Trend consistency validation
  const expectedMinGrowth = config.recentTrend.acceleration ? 0.1 : 0.05; // 10% if accelerating, 5% if stable
  const expectedMaxGrowth = config.recentTrend.acceleration ? 0.5 : 0.25; // 50% if accelerating, 25% if stable
  
  const impliedGrowth = (forecastServices - config.recentTrend.lastMonthServices) / config.recentTrend.lastMonthServices;
  
  if (impliedGrowth < expectedMinGrowth && config.recentTrend.acceleration) {
    warnings.push(`Forecast growth ${(impliedGrowth * 100).toFixed(1)}% too conservative given recent acceleration`);
    const minExpectedServices = Math.round(config.recentTrend.lastMonthServices * (1 + expectedMinGrowth));
    adjustedServices = Math.max(adjustedServices, minExpectedServices);
    confidence = 'medium';
  }

  if (impliedGrowth > expectedMaxGrowth) {
    warnings.push(`Forecast growth ${(impliedGrowth * 100).toFixed(1)}% unrealistically high`);
    const maxExpectedServices = Math.round(config.recentTrend.lastMonthServices * (1 + expectedMaxGrowth));
    adjustedServices = Math.min(adjustedServices, maxExpectedServices);
    confidence = 'medium';
  }

  // 3. Deviation alert
  if (deviation > config.maxDeviationPercent / 100) {
    warnings.push(`Large deviation ${(deviation * 100).toFixed(1)}% from YTD average`);
    if (confidence === 'high') confidence = 'medium';
  }

  // 4. GMV consistency check
  const impliedAOV = forecastGMV / adjustedServices;
  const historicalAOV = config.ytdContext.gmv / config.ytdContext.services;
  const aovDeviation = Math.abs(impliedAOV - historicalAOV) / historicalAOV;

  if (aovDeviation > 0.2) { // 20% AOV deviation
    warnings.push(`Implied AOV ${impliedAOV.toFixed(0)} deviates ${(aovDeviation * 100).toFixed(1)}% from historical ${historicalAOV.toFixed(0)}`);
    adjustedGMV = Math.round(adjustedServices * historicalAOV);
    if (confidence === 'high') confidence = 'medium';
  }

  // 5. Show validation alerts
  if (warnings.length > 0) {
    console.warn('⚠️ FORECAST VALIDATION WARNINGS:', warnings);
    
    if (confidence === 'low') {
      toast.error(`Forecast validation failed: ${warnings.length} critical issues detected`);
    } else if (warnings.length >= 2) {
      toast.warning(`Forecast validation: ${warnings.length} warnings detected`);
    }
  }

  return {
    isValid,
    adjustedServices: adjustedServices !== forecastServices ? adjustedServices : undefined,
    adjustedGMV: adjustedGMV !== forecastGMV ? adjustedGMV : undefined,
    warnings,
    confidence,
    deviation: deviation * 100 // Return as percentage
  };
}

/**
 * Creates validation config based on historical context
 */
export function createValidationConfig(
  ytdServices: number,
  ytdGMV: number,
  lastMonthServices: number,
  recentGrowthRate: number
): ForecastValidationConfig {
  const avgMonthly = ytdServices / 8; // Assuming 8 months of data
  
  return {
    minServices: Math.round(avgMonthly * 0.7), // 30% below average minimum
    maxServices: Math.round(avgMonthly * 1.8), // 80% above average maximum
    minGMV: Math.round((ytdGMV / 8) * 0.7),
    maxGMV: Math.round((ytdGMV / 8) * 1.8),
    maxDeviationPercent: 25, // 25% max deviation from YTD average
    ytdContext: {
      services: ytdServices,
      gmv: ytdGMV,
      avgMonthly
    },
    recentTrend: {
      lastMonthServices,
      growth: recentGrowthRate,
      acceleration: recentGrowthRate > 0.15 // Consider >15% growth as acceleration
    }
  };
}

/**
 * Calculate asymmetric MAPE that penalizes underestimation more heavily
 */
export function calculateAsymmetricMAPE(actual: number[], forecast: number[], underestimationPenalty: number = 2): number {
  if (actual.length !== forecast.length || actual.length === 0) return 0;
  
  let totalError = 0;
  let validPairs = 0;
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] > 0) {
      const error = Math.abs(actual[i] - forecast[i]) / actual[i];
      // Apply penalty multiplier for underestimation
      const adjustedError = forecast[i] < actual[i] ? error * underestimationPenalty : error;
      totalError += adjustedError;
      validPairs++;
    }
  }
  
  return validPairs > 0 ? (totalError / validPairs) * 100 : 0;
}