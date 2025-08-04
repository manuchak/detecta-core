import { useQuery } from '@tanstack/react-query';
import { useProphetForecast } from './useProphetForecast';
import { useHoltWintersForecast } from './useHoltWintersForecast';
import { calculateAdvancedMetrics, AdvancedMetrics } from '@/utils/advancedMetrics';

export interface EnsembleForecastData {
  // Final ensemble results - structured for ForecastCard compatibility
  monthlyServices: {
    forecast: number;
    actual: number;
  };
  annualServices: {
    forecast: number;
    actual: number;
  };
  monthlyGMV: {
    forecast: number;
    actual: number;
  };
  annualGMV: {
    forecast: number;
    actual: number;
  };
  
  // Add variance for display
  variance: {
    services: number;
    gmv: number;
  };
  
  // Enhanced metrics
  metrics: AdvancedMetrics & {
    ensembleConfidence: number;
    modelAgreement: number;
  };
  
  // Individual model contributions
  modelWeights: {
    prophet: number;
    holtWinters: number;
    linear: number;
  };
  
  // Model results for transparency
  individualResults: {
    prophet: number;
    holtWinters: number;
    linear: number;
  };
  
  // Performance tracking
  performance: {
    prophetPerformance: AdvancedMetrics;
    holtWintersPerformance: AdvancedMetrics;
    ensemblePerformance: AdvancedMetrics;
  };
  
  // Confidence and quality
  confidence: 'Alta' | 'Media' | 'Baja';
  lastUpdated: string;
  recommendedActions: string[];
}

export function useEnsembleForecast() {
  // Get individual model forecasts
  const prophetResult = useProphetForecast();
  const holtWintersResult = useHoltWintersForecast();

  // Calculate ensemble forecast with proper debugging
  const { data: ensembleData, isLoading, error } = useQuery({
    queryKey: ['ensemble-forecast', prophetResult.forecast, holtWintersResult],
    queryFn: () => {
      console.log('🧮 Calculating ensemble with:', { 
        prophetData: prophetResult.forecast,
        holtWintersData: holtWintersResult,
        prophetLoading: prophetResult.isLoading,
        hwLoading: !!holtWintersResult
      });
      return calculateEnsembleForecast(prophetResult.forecast, holtWintersResult);
    },
    enabled: !prophetResult.isLoading && !!holtWintersResult, // Fixed condition
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  return {
    forecast: ensembleData,
    isLoading: isLoading || prophetResult.isLoading,
    error: error || prophetResult.error,
    rawModels: {
      prophet: prophetResult,
      holtWinters: holtWintersResult
    }
  };
}

function calculateEnsembleForecast(
  prophetData: any,
  holtWintersData: any
): EnsembleForecastData {
  if (!prophetData || !holtWintersData) {
    return getDefaultEnsembleData();
  }

  try {
    // Extract individual model predictions with proper field mapping
    const prophetServices = prophetData.monthlyServices || 0;
    const holtWintersServices = holtWintersData.monthlyServicesForecast || holtWintersData.monthlyServices || 0; // Fix field name
    const prophetGMV = prophetData.monthlyGMV || 0;
    const holtWintersGMV = holtWintersData.monthlyGmvForecast || holtWintersData.monthlyGMV || 0; // Fix field name

    console.log('🔧 ENSEMBLE DATA EXTRACTION:', {
      prophetServices,
      holtWintersServices,
      prophetGMV,
      holtWintersGMV,
      prophetRaw: prophetData,
      holtWintersRaw: holtWintersData
    });

    // Calculate simple linear regression forecast for third model
    const linearServices = calculateLinearForecast([prophetServices, holtWintersServices]);
    const linearGMV = calculateLinearForecast([prophetGMV, holtWintersGMV]);

    // Calculate model performance scores
    const prophetPerf = prophetData.metrics || getDefaultMetrics();
    const holtWintersPerf = holtWintersData.metrics || getDefaultMetrics();

    // Calculate adaptive weights based on recent performance
    const weights = calculateAdaptiveWeights(prophetPerf, holtWintersPerf);

    // Ensemble calculation with adaptive weights
    const ensembleServices = Math.round(
      weights.prophet * prophetServices +
      weights.holtWinters * holtWintersServices +
      weights.linear * linearServices
    );

    const ensembleGMV = Math.round(
      weights.prophet * prophetGMV +
      weights.holtWinters * holtWintersGMV +
      weights.linear * linearGMV
    );

    // Calculate model agreement (how close the predictions are)
    const servicesPredictions = [prophetServices, holtWintersServices, linearServices];
    const gmvPredictions = [prophetGMV, holtWintersGMV, linearGMV];
    
    const modelAgreement = calculateModelAgreement(servicesPredictions);

    // Calculate ensemble confidence
    const ensembleConfidence = calculateEnsembleConfidence(
      prophetPerf,
      holtWintersPerf,
      modelAgreement,
      weights
    );

    // Calculate overall metrics
    const ensembleMetrics: AdvancedMetrics & { ensembleConfidence: number; modelAgreement: number } = {
      smape: (prophetPerf.smape * weights.prophet + holtWintersPerf.smape * weights.holtWinters) / (weights.prophet + weights.holtWinters),
      mase: (prophetPerf.mase * weights.prophet + holtWintersPerf.mase * weights.holtWinters) / (weights.prophet + weights.holtWinters),
      mae: (prophetPerf.mae * weights.prophet + holtWintersPerf.mae * weights.holtWinters) / (weights.prophet + weights.holtWinters),
      weightedMape: (prophetPerf.weightedMape * weights.prophet + holtWintersPerf.weightedMape * weights.holtWinters) / (weights.prophet + weights.holtWinters),
      confidence: determineEnsembleConfidence(ensembleConfidence),
      quality: determineEnsembleQuality(prophetPerf, holtWintersPerf, modelAgreement),
      ensembleConfidence,
      modelAgreement
    };

    // Generate ensemble-specific recommendations
    const recommendedActions = generateEnsembleRecommendations(
      ensembleMetrics,
      prophetPerf,
      holtWintersPerf,
      weights,
      modelAgreement
    );

    // Build ensemble forecast data with comprehensive metrics and proper structure
    return {
      // Primary forecasts - match ForecastCard expectations
      monthlyServices: {
        forecast: ensembleServices,
        actual: holtWintersData.monthlyServicesActual || holtWintersData.monthlyServices || 0
      },
      annualServices: {
        forecast: ensembleServices * 12,
        actual: (holtWintersData.monthlyServicesActual || holtWintersData.monthlyServices || 0) * 12
      },
      monthlyGMV: {
        forecast: ensembleGMV,
        actual: holtWintersData.monthlyGmvActual || holtWintersData.monthlyGMV || 0
      },
      annualGMV: {
        forecast: ensembleGMV * 12,
        actual: (holtWintersData.monthlyGmvActual || holtWintersData.monthlyGMV || 0) * 12
      },
      
      // Add variance calculation
      variance: {
        services: holtWintersData.monthlyServicesActual > 0 ? 
          ((ensembleServices - holtWintersData.monthlyServicesActual) / holtWintersData.monthlyServicesActual * 100) : 0,
        gmv: holtWintersData.monthlyGmvActual > 0 ?
          ((ensembleGMV - holtWintersData.monthlyGmvActual) / holtWintersData.monthlyGmvActual * 100) : 0
      },
      
      metrics: ensembleMetrics,
      
      modelWeights: weights,
      
      individualResults: {
        prophet: prophetServices,
        holtWinters: holtWintersServices,
        linear: linearServices
      },
      
      performance: {
        prophetPerformance: prophetPerf,
        holtWintersPerformance: holtWintersPerf,
        ensemblePerformance: ensembleMetrics
      },
      
      confidence: ensembleMetrics.confidence,
      lastUpdated: new Date().toISOString(),
      recommendedActions
    };

  } catch (error) {
    console.error('Error calculating ensemble forecast:', error);
    return getDefaultEnsembleData();
  }
}

function calculateLinearForecast(predictions: number[]): number {
  if (predictions.length < 2) return predictions[0] || 0;
  
  // Simple average as linear model baseline
  return predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
}

function calculateAdaptiveWeights(
  prophetPerf: AdvancedMetrics,
  holtWintersPerf: AdvancedMetrics
): { prophet: number; holtWinters: number; linear: number } {
  // Convert performance metrics to weights (lower error = higher weight)
  const prophetScore = 1 / (1 + prophetPerf.smape / 100 + prophetPerf.mase);
  const holtWintersScore = 1 / (1 + holtWintersPerf.smape / 100 + holtWintersPerf.mase);
  
  // Base weights on performance, with Prophet getting slight preference for its advanced features
  const totalScore = prophetScore + holtWintersScore;
  
  let prophetWeight = totalScore > 0 ? (prophetScore / totalScore) * 0.7 : 0.6; // 70% max for Prophet
  let holtWintersWeight = totalScore > 0 ? (holtWintersScore / totalScore) * 0.6 : 0.3; // 60% max for HW
  
  // Ensure Prophet gets at least 50% if it's performing reasonably well
  if (prophetPerf.smape < 30 && prophetWeight < 0.5) {
    prophetWeight = 0.5;
    holtWintersWeight = 0.35;
  }
  
  const linearWeight = Math.max(0.1, 1 - prophetWeight - holtWintersWeight); // At least 10% for stability
  
  // Normalize to ensure they sum to 1
  const total = prophetWeight + holtWintersWeight + linearWeight;
  
  return {
    prophet: prophetWeight / total,
    holtWinters: holtWintersWeight / total,
    linear: linearWeight / total
  };
}

function calculateModelAgreement(predictions: number[]): number {
  if (predictions.length < 2) return 1;
  
  const mean = predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
  const variance = predictions.reduce((sum, pred) => sum + Math.pow(pred - mean, 2), 0) / predictions.length;
  const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1;
  
  // Convert CV to agreement score (lower CV = higher agreement)
  return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
}

function calculateEnsembleConfidence(
  prophetPerf: AdvancedMetrics,
  holtWintersPerf: AdvancedMetrics,
  modelAgreement: number,
  weights: { prophet: number; holtWinters: number; linear: number }
): number {
  // Individual model confidences
  const prophetConf = prophetPerf.smape < 20 ? 0.8 : prophetPerf.smape < 40 ? 0.6 : 0.3;
  const holtWintersConf = holtWintersPerf.smape < 20 ? 0.8 : holtWintersPerf.smape < 40 ? 0.6 : 0.3;
  
  // Weighted average confidence
  const avgConfidence = prophetConf * weights.prophet + holtWintersConf * weights.holtWinters + 0.5 * weights.linear;
  
  // Boost confidence if models agree
  const agreementBoost = modelAgreement * 0.2;
  
  return Math.min(1, avgConfidence + agreementBoost);
}

function determineEnsembleConfidence(ensembleConfidence: number): 'Alta' | 'Media' | 'Baja' {
  if (ensembleConfidence > 0.7) return 'Alta';
  if (ensembleConfidence > 0.5) return 'Media';
  return 'Baja';
}

function determineEnsembleQuality(
  prophetPerf: AdvancedMetrics,
  holtWintersPerf: AdvancedMetrics,
  modelAgreement: number
): 'high' | 'medium' | 'low' {
  const avgSMAPE = (prophetPerf.smape + holtWintersPerf.smape) / 2;
  const avgMASE = (prophetPerf.mase + holtWintersPerf.mase) / 2;
  
  if (avgSMAPE < 20 && avgMASE < 1.2 && modelAgreement > 0.7) return 'high';
  if (avgSMAPE < 35 && avgMASE < 2.0 && modelAgreement > 0.5) return 'medium';
  return 'low';
}

function generateEnsembleRecommendations(
  ensembleMetrics: any,
  prophetPerf: AdvancedMetrics,
  holtWintersPerf: AdvancedMetrics,
  weights: any,
  modelAgreement: number
): string[] {
  const recommendations: string[] = [];

  if (ensembleMetrics.smape > 25) {
    recommendations.push('Considerar reentrenamiento con datos más recientes');
  }

  if (modelAgreement < 0.5) {
    recommendations.push('Baja concordancia entre modelos - revisar datos de entrada');
  }

  if (weights.prophet < 0.4 && prophetPerf.smape > 30) {
    recommendations.push('Optimizar parámetros del modelo Prophet');
  }

  if (weights.holtWinters < 0.2 && holtWintersPerf.smape < 25) {
    recommendations.push('Incrementar peso del modelo Holt-Winters');
  }

  if (ensembleMetrics.ensembleConfidence > 0.8) {
    recommendations.push('Modelo ensemble funcionando óptimamente');
  } else if (ensembleMetrics.ensembleConfidence < 0.4) {
    recommendations.push('Considerar incorporar variables externas adicionales');
  }

  return recommendations.length > 0 ? recommendations : ['Continuar monitoreo regular del ensemble'];
}

function getDefaultMetrics(): AdvancedMetrics {
  return {
    smape: 100,
    mase: 10,
    mae: 1000,
    weightedMape: 100,
    confidence: 'Baja',
    quality: 'low'
  };
}

function getDefaultEnsembleData(): EnsembleForecastData {
  return {
    monthlyServices: { forecast: 0, actual: 0 },
    annualServices: { forecast: 0, actual: 0 },
    monthlyGMV: { forecast: 0, actual: 0 },
    annualGMV: { forecast: 0, actual: 0 },
    variance: { services: 0, gmv: 0 },
    metrics: {
      smape: 100,
      mase: 10,
      mae: 1000,
      weightedMape: 100,
      confidence: 'Baja',
      quality: 'low',
      ensembleConfidence: 0,
      modelAgreement: 0
    },
    modelWeights: {
      prophet: 0.6,
      holtWinters: 0.3,
      linear: 0.1
    },
    individualResults: {
      prophet: 0,
      holtWinters: 0,
      linear: 0
    },
    performance: {
      prophetPerformance: getDefaultMetrics(),
      holtWintersPerformance: getDefaultMetrics(),
      ensemblePerformance: getDefaultMetrics()
    },
    confidence: 'Baja',
    lastUpdated: new Date().toISOString(),
    recommendedActions: ['Datos insuficientes para ensemble confiable']
  };
}