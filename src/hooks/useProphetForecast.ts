import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { prophetForecast, optimizeProphetParameters, ProphetResult } from '@/utils/prophetLikeForecasting';
import { 
  calculateAdvancedMetrics, 
  detectAndTreatOutliers, 
  performWalkForwardValidation,
  AdvancedMetrics 
} from '@/utils/advancedMetrics';

export interface ProphetForecastData {
  // Core forecast results
  monthlyServices: number;
  annualServices: number;
  monthlyGMV: number;
  annualGMV: number;
  
  // Advanced metrics (replacing problematic MAPE)
  metrics: AdvancedMetrics;
  
  // Prophet-specific results
  prophetResult: ProphetResult;
  
  // Forecast components and diagnostics
  components: {
    trend: number;
    seasonal: number;
    residual: number;
  };
  
  // Prediction intervals
  intervals: {
    lower80: number;
    upper80: number;
    lower95: number;
    upper95: number;
  };
  
  // Validation and quality
  validation: {
    walkForwardMetrics: AdvancedMetrics;
    dataQuality: 'high' | 'medium' | 'low';
    outlierInfo: {
      detected: number;
      treated: boolean;
      impact: 'low' | 'medium' | 'high';
    };
  };
  
  // Meta information
  lastUpdated: string;
  confidence: 'Alta' | 'Media' | 'Baja';
  recommendedActions: string[];
}

export function useProphetForecast() {
  // Fetch historical data
  const { data: historicalData, isLoading: loadingHistorical, error: historicalError } = useQuery({
    queryKey: ['prophet-historical-data'],
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
    queryKey: ['prophet-current-month'],
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

  // Calculate Prophet forecast
  const { data: forecastData, isLoading: loadingForecast, error: forecastError } = useQuery({
    queryKey: ['prophet-forecast', historicalData, currentMonthData],
    queryFn: () => calculateProphetForecast(historicalData as any[], currentMonthData),
    enabled: !!historicalData && Array.isArray(historicalData) && historicalData.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

function calculateProphetForecast(
  historicalData: any[] | undefined,
  currentMonthData: any | null
): ProphetForecastData {
  if (!historicalData || historicalData.length < 6) {
    return getDefaultProphetForecastData();
  }

  try {
    // Extract and prepare time series data
    const serviceData = historicalData.map(item => item.total_services || 0);
    const gmvData = historicalData.map(item => item.total_gmv || 0);

    // Step 1: Detect and treat outliers
    const serviceOutliers = detectAndTreatOutliers(serviceData, 2.0);
    const gmvOutliers = detectAndTreatOutliers(gmvData, 2.0);

    // Use winsorized data for more robust forecasting
    const cleanServiceData = serviceOutliers.winsorizedData;
    const cleanGmvData = gmvOutliers.winsorizedData;

    // Step 2: Optimize Prophet parameters
    const optimizedConfig = optimizeProphetParameters(cleanServiceData, 3);

    // Step 3: Generate Prophet forecasts
    const serviceProphetResult = prophetForecast(cleanServiceData, 1, optimizedConfig);
    const gmvProphetResult = prophetForecast(cleanGmvData, 1, optimizedConfig);

    // Step 4: Apply current month correction if available
    let monthlyServices = serviceProphetResult.forecast[0];
    let monthlyGMV = gmvProphetResult.forecast[0];

    if (currentMonthData) {
      const monthProgress = calculateMonthProgress();
      const currentRate = currentMonthData.total_services / monthProgress;
      const forecastedMonthlyFromCurrent = currentRate * 1.0;

      // Hybrid approach: weight Prophet vs current month extrapolation
      const prophetWeight = Math.min(0.7, serviceProphetResult.confidence);
      const currentWeight = 1 - prophetWeight;

      monthlyServices = prophetWeight * monthlyServices + currentWeight * forecastedMonthlyFromCurrent;

      // Similar for GMV
      if (currentMonthData.total_gmv > 0) {
        const currentGMVRate = currentMonthData.total_gmv / monthProgress;
        const forecastedGMVFromCurrent = currentGMVRate * 1.0;
        monthlyGMV = prophetWeight * monthlyGMV + currentWeight * forecastedGMVFromCurrent;
      }
    }

    // Step 5: Calculate annual projections
    const annualServices = monthlyServices * 12;
    const annualGMV = monthlyGMV * 12;

    // Step 6: Calculate advanced metrics using actual vs Prophet predictions
    const serviceForecastHistory = prophetForecast(cleanServiceData.slice(0, -1), 1, optimizedConfig);
    const lastActualService = cleanServiceData[cleanServiceData.length - 1];
    const lastForecastService = serviceForecastHistory.forecast[0];

    const metrics = calculateAdvancedMetrics(
      [lastActualService],
      [lastForecastService],
      determineDataQuality(serviceOutliers, cleanServiceData)
    );

    // Step 7: Perform walk-forward validation
    const validationMetrics = performWalkForwardValidation(
      cleanServiceData,
      (trainData, periods) => prophetForecast(trainData, periods, optimizedConfig).forecast,
      Math.min(6, Math.floor(cleanServiceData.length * 0.6)),
      1
    );

    // Step 8: Generate prediction intervals
    const serviceIntervals = {
      lower80: serviceProphetResult.lower_bound[0] * 0.9,
      upper80: serviceProphetResult.upper_bound[0] * 0.9,
      lower95: serviceProphetResult.lower_bound[0] * 0.8,
      upper95: serviceProphetResult.upper_bound[0] * 1.2
    };

    // Step 9: Determine overall confidence
    const confidence = determineOverallConfidence(metrics, validationMetrics, serviceProphetResult.confidence);

    // Step 10: Generate recommendations
    const recommendedActions = generateRecommendations(metrics, validationMetrics, serviceOutliers);

    return {
      monthlyServices: Math.round(monthlyServices),
      annualServices: Math.round(annualServices),
      monthlyGMV: Math.round(monthlyGMV),
      annualGMV: Math.round(annualGMV),
      
      metrics: {
        ...metrics,
        confidence
      },
      
      prophetResult: serviceProphetResult,
      
      components: {
        trend: serviceProphetResult.trend[serviceProphetResult.trend.length - 1],
        seasonal: serviceProphetResult.seasonal[serviceProphetResult.seasonal.length - 1],
        residual: serviceProphetResult.residuals[serviceProphetResult.residuals.length - 1]
      },
      
      intervals: serviceIntervals,
      
      validation: {
        walkForwardMetrics: validationMetrics,
        dataQuality: determineDataQuality(serviceOutliers, cleanServiceData),
        outlierInfo: {
          detected: serviceOutliers.outliers.length,
          treated: serviceOutliers.outliers.length > 0,
          impact: serviceOutliers.outliers.length > 2 ? 'high' : 
                  serviceOutliers.outliers.length > 0 ? 'medium' : 'low'
        }
      },
      
      lastUpdated: new Date().toISOString(),
      confidence,
      recommendedActions
    };

  } catch (error) {
    console.error('Error calculating Prophet forecast:', error);
    return getDefaultProphetForecastData();
  }
}

function calculateMonthProgress(): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const totalDays = endOfMonth.getDate();
  const currentDay = now.getDate();
  
  return Math.min(currentDay / totalDays, 0.95); // Cap at 95% to avoid extrapolation issues
}

function determineDataQuality(outliers: any, data: number[]): 'high' | 'medium' | 'low' {
  const outlierRatio = outliers.outliers.length / data.length;
  const variance = calculateVariance(data);
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

function calculateVariance(data: number[]): number {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  return data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length;
}

function determineOverallConfidence(
  metrics: AdvancedMetrics,
  validationMetrics: AdvancedMetrics,
  prophetConfidence: number
): 'Alta' | 'Media' | 'Baja' {
  const avgSMAPE = (metrics.smape + validationMetrics.smape) / 2;
  const avgMASE = (metrics.mase + validationMetrics.mase) / 2;
  
  if (avgSMAPE < 15 && avgMASE < 1.0 && prophetConfidence > 0.7) {
    return 'Alta';
  } else if (avgSMAPE < 25 && avgMASE < 1.5 && prophetConfidence > 0.5) {
    return 'Media';
  } else {
    return 'Baja';
  }
}

function generateRecommendations(
  metrics: AdvancedMetrics,
  validationMetrics: AdvancedMetrics,
  outlierInfo: any
): string[] {
  const recommendations: string[] = [];

  if (metrics.smape > 25) {
    recommendations.push('Considerar incorporar variables externas (marketing, estacionalidad)');
  }

  if (metrics.mase > 1.5) {
    recommendations.push('El modelo actual no supera significativamente al pronóstico naive');
  }

  if (outlierInfo.outliers.length > 2) {
    recommendations.push('Investigar causas de valores atípicos detectados');
  }

  if (validationMetrics.confidence === 'Baja') {
    recommendations.push('Incrementar frecuencia de recalibración del modelo');
  }

  if (recommendations.length === 0) {
    recommendations.push('Modelo funcionando dentro de parámetros aceptables');
  }

  return recommendations;
}

function getDefaultProphetForecastData(): ProphetForecastData {
  return {
    monthlyServices: 0,
    annualServices: 0,
    monthlyGMV: 0,
    annualGMV: 0,
    metrics: {
      smape: 100,
      mase: 10,
      mae: 1000,
      weightedMape: 100,
      confidence: 'Baja',
      quality: 'low'
    },
    prophetResult: {
      forecast: [0],
      trend: [0],
      seasonal: [0],
      residuals: [0],
      changepoints: [],
      lower_bound: [0],
      upper_bound: [0],
      confidence: 0,
      components: {
        trend: [0],
        yearly: [0],
        residual: [0]
      }
    },
    components: {
      trend: 0,
      seasonal: 0,
      residual: 0
    },
    intervals: {
      lower80: 0,
      upper80: 0,
      lower95: 0,
      upper95: 0
    },
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
    },
    lastUpdated: new Date().toISOString(),
    confidence: 'Baja',
    recommendedActions: ['Datos insuficientes para generar pronóstico confiable']
  };
}