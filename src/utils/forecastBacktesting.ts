import { supabase } from '@/integrations/supabase/client';

// Simplified mock functions for backtesting since RPC functions don't exist yet
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
 * Simplified backtesting using existing data
 */
export const performSystematicBacktesting = async (monthsToTest: number = 6): Promise<{
  results: BacktestResult[];
  summary: BacktestSummary;
  modelComparison: ModelPerformance[];
}> => {
  console.log(`🔬 BACKTESTING SIMULADO - Evaluando ${monthsToTest} meses...`);
  
  // Generate mock historical performance data
  const mockResults: BacktestResult[] = [];
  const models = ['seasonal', 'linear', 'holtWinters', 'ensemble'];
  
  // Mock 6 months of data
  const months = [
    { name: '2024-04', actual: 980, predicted: 1020 },
    { name: '2024-05', actual: 1150, predicted: 1100 },
    { name: '2024-06', actual: 1280, predicted: 1250 },
    { name: '2024-07', actual: 1320, predicted: 1300 },
    { name: '2024-08', actual: 1250, predicted: 1280 },
    { name: '2024-09', actual: 1200, predicted: 1180 }
  ];

  models.forEach(model => {
    months.slice(-monthsToTest).forEach(month => {
      const servicesError = ((month.predicted - month.actual) / month.actual) * 100;
      const gmvError = servicesError; // Simplified
      
      mockResults.push({
        month: month.name,
        actualServices: month.actual,
        actualGMV: month.actual * 6500,
        predictedServices: month.predicted,
        predictedGMV: month.predicted * 6500,
        servicesError,
        gmvError,
        servicesAPE: Math.abs(servicesError),
        gmvAPE: Math.abs(gmvError),
        confidence: 0.8,
        model
      });
    });
  });

  // Calculate summary
  const avgMAPE = mockResults.reduce((sum, r) => sum + r.servicesAPE, 0) / mockResults.length;
  const bestModel = 'seasonal'; // Mock best model
  
  const summary: BacktestSummary = {
    totalMonths: monthsToTest,
    avgServicesError: 0,
    avgGMVError: 0,
    servicesMAE: avgMAPE,
    gmvMAE: avgMAPE,
    servicesMAPE: avgMAPE,
    gmvMAPE: avgMAPE,
    accuracy: 100 - avgMAPE,
    bestModel,
    worstMonth: '2024-04',
    bestMonth: '2024-09'
  };

  // Model comparison
  const modelComparison: ModelPerformance[] = [
    {
      name: 'seasonal',
      mape: 8.5,
      mae: 8.5,
      accuracy: 91.5,
      consistency: 85,
      strengths: ['Captura patrones estacionales', 'Buen rendimiento a largo plazo'],
      weaknesses: ['Puede ser lento para adaptarse']
    },
    {
      name: 'ensemble',
      mape: 12.2,
      mae: 12.2,
      accuracy: 87.8,
      consistency: 82,
      strengths: ['Combina fortalezas', 'Mayor robustez'],
      weaknesses: ['Mayor complejidad computacional']
    }
  ];

  return { results: mockResults, summary, modelComparison };
};

/**
 * Mock current month validation
 */
export const validateCurrentMonthPrediction = async () => {
  console.log('🎯 VALIDACIÓN SIMULADA - Evaluando predicción del mes actual...');
  
  return {
    currentAccuracy: 85.5,
    projectedServices: 1200,
    currentPace: 38.5,
    confidence: 0.8,
    daysElapsed: 11,
    recommendation: 'Modelo funcionando bien'
  };
};