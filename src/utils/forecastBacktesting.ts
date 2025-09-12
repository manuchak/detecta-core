import { supabase } from '@/integrations/supabase/client';

export interface BacktestResult {
  month: string;
  actualServices: number;
  actualGMV: number;
  predictedServices: number;
  predictedGMV: number;
  servicesError: number;
  gmvError: number;
  servicesAPE: number;
  gmvAPE: number;
  confidence: number;
  model: string;
}

export interface BacktestSummary {
  totalMonths: number;
  avgServicesError: number;
  avgGMVError: number;
  servicesMAE: number;
  gmvMAE: number;
  servicesMAPE: number;
  gmvMAPE: number;
  accuracy: number;
  bestModel: string;
  worstMonth: string;
  bestMonth: string;
}

export interface ModelPerformance {
  name: string;
  mape: number;
  mae: number;
  accuracy: number;
  consistency: number;
  strengths: string[];
  weaknesses: string[];
}

/**
 * Performs systematic backtesting of forecasting models
 */
export const performSystematicBacktesting = async (monthsToTest: number = 6): Promise<{
  results: BacktestResult[];
  summary: BacktestSummary;
  modelComparison: ModelPerformance[];
}> => {
  console.log(`🔬 BACKTESTING SISTEMÁTICO - Evaluando ${monthsToTest} meses...`);
  
  const results: BacktestResult[] = [];
  const modelPerformance: Record<string, number[]> = {
    seasonal: [],
    linear: [],
    holtWinters: [],
    ensemble: []
  };

  // Get historical data for backtesting
  const { data: historicalData, error } = await supabase.rpc('get_monthly_services_summary');
  if (error) throw error;

  // Sort by date
  const sortedData = historicalData.sort((a, b) => 
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  // Perform walk-forward validation
  for (let i = Math.max(3, sortedData.length - monthsToTest); i < sortedData.length; i++) {
    const trainData = sortedData.slice(0, i);
    const testMonth = sortedData[i];
    
    if (trainData.length < 3) continue; // Need minimum data
    
    // Test multiple models
    const seasonalPrediction = await testSeasonalModel(trainData, testMonth);
    const linearPrediction = testLinearModel(trainData);
    const holtWintersPrediction = testHoltWintersModel(trainData);
    const ensemblePrediction = combineModelPredictions([
      seasonalPrediction,
      linearPrediction,
      holtWintersPrediction
    ]);

    // Calculate errors for each model
    const models = [
      { name: 'seasonal', prediction: seasonalPrediction },
      { name: 'linear', prediction: linearPrediction },
      { name: 'holtWinters', prediction: holtWintersPrediction },
      { name: 'ensemble', prediction: ensemblePrediction }
    ];

    for (const model of models) {
      const servicesError = ((model.prediction.services - testMonth.total_services) / testMonth.total_services) * 100;
      const gmvError = ((model.prediction.gmv - testMonth.total_gmv) / testMonth.total_gmv) * 100;
      
      modelPerformance[model.name].push(Math.abs(servicesError));
      
      results.push({
        month: testMonth.month,
        actualServices: testMonth.total_services,
        actualGMV: testMonth.total_gmv,
        predictedServices: model.prediction.services,
        predictedGMV: model.prediction.gmv,
        servicesError,
        gmvError,
        servicesAPE: Math.abs(servicesError),
        gmvAPE: Math.abs(gmvError),
        confidence: model.prediction.confidence || 0.7,
        model: model.name
      });
    }
  }

  // Calculate summary statistics
  const summary = calculateBacktestSummary(results);
  const modelComparison = calculateModelComparison(modelPerformance);

  console.log('📊 Resultados del backtesting:', {
    totalTests: results.length,
    avgMAPE: summary.servicesMAPE,
    bestModel: summary.bestModel
  });

  return { results, summary, modelComparison };
};

/**
 * Test seasonal model on historical data
 */
const testSeasonalModel = async (trainData: any[], testMonth: any) => {
  // Simple seasonal calculation for backtesting
  const avgServices = trainData.reduce((sum, month) => sum + month.total_services, 0) / trainData.length;
  const avgGMV = trainData.reduce((sum, month) => sum + month.total_gmv, 0) / trainData.length;
  
  // Apply seasonal adjustment (simplified)
  const seasonalFactor = getSeasonalFactor(testMonth.month);
  
  return {
    services: Math.round(avgServices * seasonalFactor),
    gmv: avgGMV * seasonalFactor,
    confidence: 0.75
  };
};

/**
 * Test linear regression model
 */
const testLinearModel = (trainData: any[]) => {
  const n = trainData.length;
  const xSum = trainData.reduce((sum, _, i) => sum + i, 0);
  const ySum = trainData.reduce((sum, month) => sum + month.total_services, 0);
  const xySum = trainData.reduce((sum, month, i) => sum + i * month.total_services, 0);
  const xSqSum = trainData.reduce((sum, _, i) => sum + i * i, 0);
  
  const slope = (n * xySum - xSum * ySum) / (n * xSqSum - xSum * xSum);
  const intercept = (ySum - slope * xSum) / n;
  
  const predictedServices = Math.round(slope * n + intercept);
  const avgAOV = 6500; // Simplified
  
  return {
    services: Math.max(0, predictedServices),
    gmv: predictedServices * avgAOV,
    confidence: 0.6
  };
};

/**
 * Test Holt-Winters model
 */
const testHoltWintersModel = (trainData: any[]) => {
  const data = trainData.map(month => month.total_services);
  const alpha = 0.3;
  const beta = 0.1;
  
  let level = data[0];
  let trend = data[1] - data[0];
  
  for (let i = 1; i < data.length; i++) {
    const prevLevel = level;
    level = alpha * data[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  
  const predictedServices = Math.round(level + trend);
  const avgAOV = 6500;
  
  return {
    services: Math.max(0, predictedServices),
    gmv: predictedServices * avgAOV,
    confidence: 0.8
  };
};

/**
 * Combine multiple model predictions
 */
const combineModelPredictions = (predictions: any[]) => {
  const weights = [0.4, 0.2, 0.4]; // Seasonal, Linear, Holt-Winters
  
  const weightedServices = predictions.reduce((sum, pred, i) => 
    sum + pred.services * weights[i], 0
  );
  const weightedGMV = predictions.reduce((sum, pred, i) => 
    sum + pred.gmv * weights[i], 0
  );
  
  return {
    services: Math.round(weightedServices),
    gmv: weightedGMV,
    confidence: 0.85
  };
};

/**
 * Get seasonal factor for a given month
 */
const getSeasonalFactor = (monthStr: string): number => {
  const month = new Date(monthStr).getMonth();
  const seasonalFactors = [1.0, 0.95, 1.05, 1.1, 1.15, 1.2, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85];
  return seasonalFactors[month] || 1.0;
};

/**
 * Calculate comprehensive backtest summary
 */
const calculateBacktestSummary = (results: BacktestResult[]): BacktestSummary => {
  const servicesErrors = results.map(r => r.servicesError);
  const gmvErrors = results.map(r => r.gmvError);
  const servicesAPEs = results.map(r => r.servicesAPE);
  const gmvAPEs = results.map(r => r.gmvAPE);
  
  // Group by model to find best performing
  const modelMAPEs = results.reduce((acc, result) => {
    if (!acc[result.model]) acc[result.model] = [];
    acc[result.model].push(result.servicesAPE);
    return acc;
  }, {} as Record<string, number[]>);
  
  const modelAvgMAPEs = Object.entries(modelMAPEs).map(([model, apes]) => ({
    model,
    mape: apes.reduce((sum, ape) => sum + ape, 0) / apes.length
  }));
  
  const bestModel = modelAvgMAPEs.reduce((best, current) => 
    current.mape < best.mape ? current : best
  ).model;
  
  // Find best and worst months
  const monthlyErrors = results.reduce((acc, result) => {
    if (!acc[result.month]) acc[result.month] = [];
    acc[result.month].push(result.servicesAPE);
    return acc;
  }, {} as Record<string, number[]>);
  
  const monthlyAvgErrors = Object.entries(monthlyErrors).map(([month, errors]) => ({
    month,
    error: errors.reduce((sum, err) => sum + err, 0) / errors.length
  }));
  
  const worstMonth = monthlyAvgErrors.reduce((worst, current) => 
    current.error > worst.error ? current : worst
  ).month;
  
  const bestMonth = monthlyAvgErrors.reduce((best, current) => 
    current.error < best.error ? current : best
  ).month;
  
  return {
    totalMonths: new Set(results.map(r => r.month)).size,
    avgServicesError: servicesErrors.reduce((sum, err) => sum + err, 0) / servicesErrors.length,
    avgGMVError: gmvErrors.reduce((sum, err) => sum + err, 0) / gmvErrors.length,
    servicesMAE: servicesAPEs.reduce((sum, ape) => sum + ape, 0) / servicesAPEs.length,
    gmvMAE: gmvAPEs.reduce((sum, ape) => sum + ape, 0) / gmvAPEs.length,
    servicesMAPE: servicesAPEs.reduce((sum, ape) => sum + ape, 0) / servicesAPEs.length,
    gmvMAPE: gmvAPEs.reduce((sum, ape) => sum + ape, 0) / gmvAPEs.length,
    accuracy: Math.max(0, 100 - (servicesAPEs.reduce((sum, ape) => sum + ape, 0) / servicesAPEs.length)),
    bestModel,
    worstMonth,
    bestMonth
  };
};

/**
 * Calculate model comparison metrics
 */
const calculateModelComparison = (modelPerformance: Record<string, number[]>): ModelPerformance[] => {
  return Object.entries(modelPerformance).map(([name, errors]) => {
    const mape = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    const mae = mape; // Simplified for now
    const accuracy = Math.max(0, 100 - mape);
    
    // Calculate consistency (lower std dev = higher consistency)
    const mean = mape;
    const variance = errors.reduce((sum, err) => sum + Math.pow(err - mean, 2), 0) / errors.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));
    
    return {
      name,
      mape,
      mae,
      accuracy,
      consistency,
      strengths: getModelStrengths(name),
      weaknesses: getModelWeaknesses(name)
    };
  });
};

const getModelStrengths = (model: string): string[] => {
  const strengths: Record<string, string[]> = {
    seasonal: ['Captura patrones estacionales', 'Buen rendimiento a largo plazo'],
    linear: ['Simple y rápido', 'Funciona bien con tendencias lineales'],
    holtWinters: ['Maneja tendencias y estacionalidad', 'Adaptativo'],
    ensemble: ['Combina fortalezas', 'Mayor robustez']
  };
  return strengths[model] || [];
};

const getModelWeaknesses = (model: string): string[] => {
  const weaknesses: Record<string, string[]> = {
    seasonal: ['Puede ser lento para adaptarse', 'Requiere datos históricos'],
    linear: ['No captura estacionalidad', 'Sensible a outliers'],
    holtWinters: ['Más complejo', 'Requiere calibración'],
    ensemble: ['Mayor complejidad computacional', 'Difícil de interpretar']
  };
  return weaknesses[model] || [];
};

/**
 * Real-time model validation
 */
export const validateCurrentMonthPrediction = async () => {
  console.log('🎯 VALIDACIÓN EN TIEMPO REAL - Evaluando predicción del mes actual...');
  
  // Get current month data up to yesterday
  const { data: currentData } = await supabase.rpc('get_current_month_summary');
  if (!currentData) return null;
  
  // Get our current prediction
  const prediction = await getCurrentMonthPrediction();
  
  // Calculate current accuracy
  const daysElapsed = new Date().getDate() - 1; // Accounting for data lag
  const projectedDaily = prediction.services / 30;
  const currentDaily = currentData.total_services / daysElapsed;
  
  const dailyError = Math.abs((projectedDaily - currentDaily) / currentDaily) * 100;
  
  return {
    currentAccuracy: Math.max(0, 100 - dailyError),
    projectedServices: prediction.services,
    currentPace: currentDaily,
    confidence: prediction.confidence,
    daysElapsed,
    recommendation: dailyError > 15 ? 'Recalibrar modelo' : 'Modelo funcionando bien'
  };
};

const getCurrentMonthPrediction = async () => {
  // Simplified current prediction - in real implementation, this would call the actual forecasting system
  return {
    services: 1200,
    gmv: 7800000,
    confidence: 0.8
  };
};