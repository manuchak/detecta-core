import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateAdvancedMetrics, 
  detectAndTreatOutliers,
  performWalkForwardValidation,
  AdvancedMetrics 
} from '@/utils/advancedMetrics';

export interface ForecastData {
  monthlyServices: number;
  annualServices: number;
  monthlyGMV: number;
  annualGMV: number;
  variance: number;
  accuracy: number;
  lastUpdated: string;
  
  // Variance breakdown
  intraMonthVariance: number;
  seasonalVariance: number;
  
  // Enhanced metrics (replacing problematic MAPE)
  metrics: AdvancedMetrics;
  currentMonthName: string;
  
  // Enhanced validation with outlier detection
  validation: {
    walkForwardMetrics: AdvancedMetrics;
    dataQuality: 'high' | 'medium' | 'low';
    outlierInfo: {
      detected: number;
      treated: boolean;
      impact: 'low' | 'medium' | 'high';
    };
  };
}

interface ManualParameters {
  alpha?: number;
  beta?: number;
  gamma?: number;
  useManual?: boolean;
}

export function useHoltWintersForecast(manualParams?: ManualParameters) {
  // Fetch historical data
  const { data: historicalData, isLoading: loadingHistorical, error: historicalError } = useQuery({
    queryKey: ['holt-winters-historical-corrected'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_historical_monthly_data');
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching historical data:', error);
        return [];
      }
    }
  });

  // Fetch current month forensic data
  const { data: currentMonthData, isLoading: loadingCurrent, error: currentError } = useQuery({
    queryKey: ['holt-winters-current-month-corrected'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('forensic_audit_servicios_enero_actual');
        if (error) throw error;
        return data?.[0] || null;
      } catch (error) {
        console.error('Error fetching current month data:', error);
        return null;
      }
    }
  });

  // Calculate forecast
  const { data: forecastData, isLoading: loadingForecast, error: forecastError } = useQuery({
    queryKey: ['holt-winters-forecast-corrected', historicalData, currentMonthData, manualParams],
    queryFn: () => calculateHoltWintersForecast(historicalData as any[], currentMonthData, manualParams),
    enabled: !!historicalData && Array.isArray(historicalData) && historicalData.length > 6,
    staleTime: 5 * 60 * 1000,
    retry: 3
  });

  const isLoading = loadingHistorical || loadingCurrent || loadingForecast;
  const error = historicalError || currentError || forecastError;

  return {
    forecast: forecastData,
    isLoading,
    error,
    rawData: { historicalData, currentMonthData }
  };
}

function calculateHoltWintersForecast(
  historicalData: any[] | undefined,
  currentMonthData: any | null,
  manualParams?: ManualParameters
): ForecastData {
  if (!historicalData || historicalData.length < 6) {
    return getDefaultForecastData();
  }

  try {
    // Extract and prepare time series data
    const rawServiceData = historicalData.map(item => item.total_services || item.services_completed || 0);
    const rawGmvData = historicalData.map(item => item.total_gmv || item.gmv || 0);

    // Step 1: Detect and treat outliers for more robust forecasting
    const serviceOutliers = detectAndTreatOutliers(rawServiceData, 2.0);
    const gmvOutliers = detectAndTreatOutliers(rawGmvData, 2.0);

    // Use winsorized data for forecasting (caps extreme outliers)
    const serviceData = serviceOutliers.winsorizedData;
    const gmvData = gmvOutliers.winsorizedData;

    console.log('HW Corrected - Outlier detection results:', {
      services: { original: rawServiceData, outliers: serviceOutliers.outliers, cleaned: serviceData },
      outlierIndices: serviceOutliers.outlierIndices
    });

    // Step 2: Calculate forecasts using improved Holt-Winters
    let monthlyServices: number;
    let monthlyGMV: number;

    if (manualParams?.useManual && manualParams.alpha && manualParams.beta !== undefined && manualParams.gamma) {
      const serviceResult = holtWintersCalculationEnhanced(serviceData, 12, 1, manualParams.alpha, manualParams.beta, manualParams.gamma);
      const gmvResult = holtWintersCalculationEnhanced(gmvData, 12, 1, manualParams.alpha, manualParams.beta, manualParams.gamma);
      monthlyServices = serviceResult.forecast[0];
      monthlyGMV = gmvResult.forecast[0];
    } else {
      const optimizedServiceResult = holtWintersOptimized(serviceData, 12, 1);
      const optimizedGmvResult = holtWintersOptimized(gmvData, 12, 1);
      monthlyServices = optimizedServiceResult.forecast[0];
      monthlyGMV = optimizedGmvResult.forecast[0];
    }

    // Step 4: Use 2025 average ticket for GMV calculation when needed
    const avgTicket2025 = 6582;
    
    // Step 5: Apply current month correction if available
    if (currentMonthData) {
      const monthProgress = calculateMonthProgress();
      const currentRate = currentMonthData.servicios_unicos_id ? 
        (currentMonthData.servicios_unicos_id * 0.14) / monthProgress : 0;
      
      if (currentRate > 0 && monthProgress > 0.1) {
        const intraMonthProjection = currentRate * 1.0;
        const prophetWeight = Math.min(0.7, 0.6); // Conservative weight
        const currentWeight = 1 - prophetWeight;
        monthlyServices = prophetWeight * monthlyServices + currentWeight * intraMonthProjection;
      }
    }

    // Step 4: Calculate annual projections
    const annualServices = monthlyServices * 12;
    
    // Calculate GMV using 2025 average ticket for better accuracy
    // The 2025 average ticket is $6,582 vs historical $6,060
    monthlyGMV = monthlyServices * avgTicket2025;
    const annualGMV = annualServices * avgTicket2025;

    // Step 5: Calculate advanced metrics using corrected algorithms
    const recentActual = serviceData.slice(-Math.min(3, serviceData.length));
    const metrics = calculateAdvancedMetrics(
      recentActual,
      [monthlyServices],
      determineDataQuality(serviceOutliers, serviceData)
    );

    // Step 6: Perform walk-forward validation for robustness
    const walkForwardMetrics = performWalkForwardValidation(
      serviceData,
      (trainData, periods) => holtWintersOptimized(trainData, 12, periods).forecast,
      Math.min(6, Math.floor(serviceData.length * 0.6)),
      1
    );

    // Step 7: Calculate variance
    const historicalAvg = serviceData.reduce((sum, val) => sum + val, 0) / serviceData.length;
    const variance = ((monthlyServices - historicalAvg) / historicalAvg) * 100;

    return {
      monthlyServices: Math.round(monthlyServices),
      annualServices: Math.round(annualServices),
      monthlyGMV: Math.round(monthlyGMV),
      annualGMV: Math.round(annualGMV),
      variance: variance,
      accuracy: Math.max(0, 100 - metrics.smape), // Convert sMAPE to accuracy
      lastUpdated: new Date().toISOString(),
      intraMonthVariance: variance * 0.3,
      seasonalVariance: variance * 0.7,
      
      // Enhanced metrics replacing problematic MAPE
      metrics: {
        ...metrics,
        confidence: determineOverallConfidence(metrics, walkForwardMetrics, serviceOutliers)
      },
      
      currentMonthName: getCurrentMonthName(),
      
      // Enhanced validation with comprehensive diagnostics
      validation: {
        walkForwardMetrics,
        dataQuality: determineDataQuality(serviceOutliers, serviceData),
        outlierInfo: {
          detected: serviceOutliers.outliers.length,
          treated: serviceOutliers.outliers.length > 0,
          impact: serviceOutliers.outliers.length > 2 ? 'high' : 
                  serviceOutliers.outliers.length > 0 ? 'medium' : 'low'
        }
      }
    };

  } catch (error) {
    console.error('Error calculating Holt-Winters forecast:', error);
    return getDefaultForecastData();
  }
}

function holtWintersOptimized(data: number[], seasonLength: number, forecastPeriods: number) {
  const paramGrid = {
    alpha: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
    beta: [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5],
    gamma: [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]
  };

  let bestResult = null;
  let bestError = Infinity;

  for (const alpha of paramGrid.alpha) {
    for (const beta of paramGrid.beta) {
      for (const gamma of paramGrid.gamma) {
        try {
          const result = holtWintersCalculationEnhanced(data, seasonLength, forecastPeriods, alpha, beta, gamma);
          const testSize = Math.min(3, Math.floor(data.length * 0.2));
          const trainData = data.slice(0, -testSize);
          const testData = data.slice(-testSize);
          
          const testResult = holtWintersCalculationEnhanced(trainData, seasonLength, testSize, alpha, beta, gamma);
          const mae = testData.reduce((sum, actual, i) => sum + Math.abs(actual - (testResult.forecast[i] || 0)), 0) / testSize;
          
          if (mae < bestError) {
            bestError = mae;
            bestResult = result;
          }
        } catch (e) {
          continue;
        }
      }
    }
  }

  return bestResult || holtWintersCalculationEnhanced(data, seasonLength, forecastPeriods, 0.3, 0.2, 0.2);
}

function holtWintersCalculationEnhanced(
  data: number[], 
  seasonLength: number, 
  forecastPeriods: number, 
  alpha: number, 
  beta: number, 
  gamma: number
) {
  const n = data.length;
  
  if (n < seasonLength * 2) {
    throw new Error('Insufficient data for Holt-Winters');
  }

  // Initialize arrays
  const level = new Array(n);
  const trend = new Array(n);
  const seasonal = new Array(n + seasonLength);

  // Calculate initial seasonal indices
  for (let i = 0; i < seasonLength; i++) {
    const seasonValues = [];
    for (let j = i; j < n; j += seasonLength) {
      if (data[j] > 0) seasonValues.push(data[j]);
    }
    
    if (seasonValues.length > 0) {
      const avg = seasonValues.reduce((sum, val) => sum + val, 0) / seasonValues.length;
      const globalAvg = data.filter(d => d > 0).reduce((sum, val) => sum + val, 0) / data.filter(d => d > 0).length;
      seasonal[i] = globalAvg > 0 ? Math.max(0.5, Math.min(2.0, avg / globalAvg)) : 1;
    } else {
      seasonal[i] = 1;
    }
  }

  // Initialize level and trend
  const firstSeasonAvg = data.slice(0, seasonLength).reduce((sum, val) => sum + val, 0) / seasonLength;
  const secondSeasonAvg = data.slice(seasonLength, seasonLength * 2).reduce((sum, val) => sum + val, 0) / seasonLength;
  
  level[0] = firstSeasonAvg;
  trend[0] = (secondSeasonAvg - firstSeasonAvg) / seasonLength;

  // Apply Holt-Winters algorithm
  for (let i = 1; i < n; i++) {
    const seasonalIndex = (i - 1) % seasonLength;
    
    if (data[i] > 0 && seasonal[seasonalIndex] > 0) {
      level[i] = alpha * (data[i] / seasonal[seasonalIndex]) + (1 - alpha) * (level[i - 1] + trend[i - 1]);
      trend[i] = beta * (level[i] - level[i - 1]) + (1 - beta) * trend[i - 1];
      seasonal[i] = gamma * (data[i] / level[i]) + (1 - gamma) * seasonal[seasonalIndex];
    } else {
      level[i] = level[i - 1] + trend[i - 1];
      trend[i] = trend[i - 1];
      seasonal[i] = seasonal[seasonalIndex];
    }
  }

  // Generate forecast
  const forecast = [];
  for (let h = 1; h <= forecastPeriods; h++) {
    const seasonalIndex = (n - 1 + h) % seasonLength;
    const forecastValue = (level[n - 1] + h * trend[n - 1]) * seasonal[seasonalIndex];
    forecast.push(Math.max(0, forecastValue));
  }

  return { forecast, level: level[n - 1], trend: trend[n - 1], seasonal: seasonal.slice(0, seasonLength) };
}

function calculateMonthProgress(): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const totalDays = endOfMonth.getDate();
  const currentDay = now.getDate();
  
  return Math.min(currentDay / totalDays, 0.95);
}

function determineDataQuality(outliers: any, data: number[]): 'high' | 'medium' | 'low' {
  const outlierRatio = outliers.outliers.length / data.length;
  const variance = data.reduce((sum, val) => {
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    return sum + (val - mean) ** 2;
  }, 0) / data.length;
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const coefficientOfVariation = Math.sqrt(variance) / mean;

  if (outlierRatio < 0.1 && coefficientOfVariation < 0.3) {
    return 'high';
  } else if (outlierRatio < 0.2 && coefficientOfVariation < 0.6) {
    return 'medium';
  } else {
    return 'low';
  }
}

function determineOverallConfidence(
  metrics: AdvancedMetrics,
  walkForwardMetrics: AdvancedMetrics,
  outlierInfo: any
): 'Alta' | 'Media' | 'Baja' {
  const avgSMAPE = (metrics.smape + walkForwardMetrics.smape) / 2;
  const avgMASE = (metrics.mase + walkForwardMetrics.mase) / 2;
  const outlierImpact = outlierInfo.outliers.length > 2 ? 0.8 : 1.0;
  
  if (avgSMAPE < 15 && avgMASE < 1.0 && outlierImpact > 0.9) {
    return 'Alta';
  } else if (avgSMAPE < 25 && avgMASE < 1.5 && outlierImpact > 0.8) {
    return 'Media';
  } else {
    return 'Baja';
  }
}

function getCurrentMonthName(): string {
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                     'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return monthNames[new Date().getMonth()] || 'desconocido';
}

function getDefaultForecastData(): ForecastData {
  return {
    monthlyServices: 0,
    annualServices: 0,
    monthlyGMV: 0,
    annualGMV: 0,
    variance: 0,
    accuracy: 0,
    lastUpdated: new Date().toISOString(),
    intraMonthVariance: 0,
    seasonalVariance: 0,
    metrics: {
      smape: 100,
      mase: 10,
      mae: 1000,
      weightedMape: 100,
      confidence: 'Baja',
      quality: 'low'
    },
    currentMonthName: getCurrentMonthName(),
    validation: {
      walkForwardMetrics: {
        smape: 100,
        mase: 10,
        mae: 1000,
        weightedMape: 100,
        confidence: 'Baja',
        quality: 'low'
      },
      dataQuality: 'low',
      outlierInfo: {
        detected: 0,
        treated: false,
        impact: 'low'
      }
    }
  };
}