/**
 * Hook for backtesting with real database data
 * Queries servicios_custodia and compares historical forecasts vs actual results
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback } from 'react';
import { calculateIntelligentEnsemble } from '@/utils/intelligentEnsemble';

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
  modelComparison: Array<{
    name: string;
    mape: number;
    accuracy: number;
  }>;
}

interface MonthlyData {
  month: string;
  services: number;
  gmv: number;
}

export const useBacktestingData = (monthsToTest: number = 6) => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);

  // Fetch historical monthly data from servicios_custodia
  const { data: historicalData, isLoading: loadingData } = useQuery({
    queryKey: ['backtesting-historical-data'],
    queryFn: async (): Promise<MonthlyData[]> => {
      console.log('🔬 Cargando datos históricos para backtesting...');
      
      // Query servicios_custodia grouped by month
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita, monto_cliente_final')
        .not('fecha_hora_cita', 'is', null)
        .order('fecha_hora_cita', { ascending: true });

      if (error) {
        console.error('Error fetching historical data:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No historical data found');
        return [];
      }

      // Group by month
      const monthlyMap = new Map<string, { services: number; gmv: number }>();
      
      data.forEach((service: any) => {
        if (!service.fecha_hora_cita) return;
        
        const date = new Date(service.fecha_hora_cita);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const existing = monthlyMap.get(monthKey) || { services: 0, gmv: 0 };
        monthlyMap.set(monthKey, {
          services: existing.services + 1,
          gmv: existing.gmv + (service.monto_cliente_final || 0)
        });
      });

      // Convert to array and sort
      const result: MonthlyData[] = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          services: data.services,
          gmv: data.gmv
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      console.log(`📊 Datos históricos cargados: ${result.length} meses`);
      return result;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Run backtesting on historical data
  const { data: backtestResults, isLoading: loadingBacktest, refetch } = useQuery({
    queryKey: ['backtesting-results', monthsToTest, historicalData?.length],
    queryFn: async (): Promise<{ results: BacktestResult[]; summary: BacktestSummary }> => {
      if (!historicalData || historicalData.length < monthsToTest + 6) {
        console.warn('Insufficient data for backtesting');
        return { results: [], summary: getDefaultSummary() };
      }

      console.log(`🔬 Ejecutando backtesting sobre ${monthsToTest} meses...`);
      setIsRunning(true);

      const results: BacktestResult[] = [];
      const modelMAPEs: Record<string, number[]> = {
        'Ensemble': [],
        'Seasonal': [],
        'Linear': [],
        'Holt-Winters': [],
        'Prophet': []
      };

      try {
        // Walk-forward validation: for each test month, train on all previous data
        for (let i = 0; i < monthsToTest; i++) {
          const testIndex = historicalData.length - monthsToTest + i;
          const trainData = historicalData.slice(0, testIndex);
          const testData = historicalData[testIndex];

          if (trainData.length < 6) continue;

          // Extract services array for ensemble
          const servicesHistory = trainData.map(d => d.services);
          const currentValue = servicesHistory[servicesHistory.length - 1];

          // Run ensemble prediction
          const ensembleResult = calculateIntelligentEnsemble(
            servicesHistory,
            currentValue,
            'medium'
          );

          const predictedServices = Math.round(ensembleResult.prediction);
          const actualServices = testData.services;
          const avgGMVPerService = trainData.reduce((sum, d) => sum + d.gmv, 0) / 
                                   trainData.reduce((sum, d) => sum + d.services, 0);
          const predictedGMV = predictedServices * avgGMVPerService;
          const actualGMV = testData.gmv;

          const servicesError = predictedServices - actualServices;
          const gmvError = predictedGMV - actualGMV;
          const servicesAPE = actualServices > 0 ? Math.abs(servicesError / actualServices) * 100 : 0;
          const gmvAPE = actualGMV > 0 ? Math.abs(gmvError / actualGMV) * 100 : 0;

          results.push({
            month: testData.month,
            actualServices,
            actualGMV,
            predictedServices,
            predictedGMV,
            servicesError,
            gmvError,
            servicesAPE,
            gmvAPE,
            confidence: ensembleResult.confidence,
            model: 'Ensemble'
          });

          // Track MAPE by model
          modelMAPEs['Ensemble'].push(servicesAPE);
          
          // Track individual model performance
          ensembleResult.individual_models.forEach(model => {
            const modelAPE = actualServices > 0 
              ? Math.abs((model.value - actualServices) / actualServices) * 100 
              : 0;
            if (!modelMAPEs[model.name]) modelMAPEs[model.name] = [];
            modelMAPEs[model.name].push(modelAPE);
          });
        }

        // Calculate summary
        const avgMAPE = results.reduce((sum, r) => sum + r.servicesAPE, 0) / results.length;
        const avgGMVMAPE = results.reduce((sum, r) => sum + r.gmvAPE, 0) / results.length;
        const avgServicesError = results.reduce((sum, r) => sum + r.servicesError, 0) / results.length;
        const avgGMVError = results.reduce((sum, r) => sum + r.gmvError, 0) / results.length;
        const servicesMAE = results.reduce((sum, r) => sum + Math.abs(r.servicesError), 0) / results.length;
        const gmvMAE = results.reduce((sum, r) => sum + Math.abs(r.gmvError), 0) / results.length;

        // Find best/worst months
        const sortedByError = [...results].sort((a, b) => a.servicesAPE - b.servicesAPE);
        const bestMonth = sortedByError[0]?.month || 'N/A';
        const worstMonth = sortedByError[sortedByError.length - 1]?.month || 'N/A';

        // Model comparison
        const modelComparison = Object.entries(modelMAPEs)
          .filter(([_, mapes]) => mapes.length > 0)
          .map(([name, mapes]) => ({
            name,
            mape: mapes.reduce((a, b) => a + b, 0) / mapes.length,
            accuracy: 100 - (mapes.reduce((a, b) => a + b, 0) / mapes.length)
          }))
          .sort((a, b) => a.mape - b.mape);

        const bestModel = modelComparison[0]?.name || 'Ensemble';

        const summary: BacktestSummary = {
          totalMonths: results.length,
          avgServicesError,
          avgGMVError,
          servicesMAE,
          gmvMAE,
          servicesMAPE: avgMAPE,
          gmvMAPE: avgGMVMAPE,
          accuracy: 100 - avgMAPE,
          bestModel,
          worstMonth,
          bestMonth,
          modelComparison
        };

        console.log(`✅ Backtesting completado: MAPE ${avgMAPE.toFixed(1)}%, Accuracy ${(100 - avgMAPE).toFixed(1)}%`);
        
        return { results, summary };
      } finally {
        setIsRunning(false);
      }
    },
    enabled: !!historicalData && historicalData.length >= monthsToTest + 6,
    staleTime: 30 * 60 * 1000,
  });

  const runBacktest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['backtesting-results'] });
    refetch();
  }, [queryClient, refetch]);

  return {
    backtestResults: backtestResults?.results ?? [],
    summary: backtestResults?.summary ?? null,
    historicalData: historicalData ?? [],
    isLoading: loadingData || loadingBacktest,
    isRunning,
    runBacktest
  };
};

function getDefaultSummary(): BacktestSummary {
  return {
    totalMonths: 0,
    avgServicesError: 0,
    avgGMVError: 0,
    servicesMAE: 0,
    gmvMAE: 0,
    servicesMAPE: 0,
    gmvMAPE: 0,
    accuracy: 0,
    bestModel: 'N/A',
    worstMonth: 'N/A',
    bestMonth: 'N/A',
    modelComparison: []
  };
}
