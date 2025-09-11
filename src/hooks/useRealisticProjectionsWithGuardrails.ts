import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useDynamicServiceData } from './useDynamicServiceData';
import { useAdvancedForecastEngine } from './useAdvancedForecastEngine';
import { getCurrentMonthInfo, getPreviousMonthInfo } from '@/utils/dynamicDateUtils';
import { calculateIntelligentEnsemble } from '@/utils/intelligentEnsemble';
import { supabase } from '@/integrations/supabase/client';

interface ProjectionScenario {
  name: 'Pesimista' | 'Realista' | 'Optimista';
  services: number;
  gmv: number;
  probability: number;
  description: string;
  color: 'destructive' | 'warning' | 'success';
  confidenceLevel: 'low' | 'medium' | 'high';
}

interface RealisticProjections {
  current: {
    services: number;
    gmv: number;
    days: number;
    aov: number;
    dailyPace: number;
  };
  target: {
    services: number;
    gmv: number;
  };
  scenarios: ProjectionScenario[];
  daysRemaining: number;
  mostLikely: ProjectionScenario;
  insights: {
    paceNeeded: number;
    currentTrend: 'declining' | 'stable' | 'growing';
    aovTrend: 'declining' | 'stable' | 'growing';
  };
  confidence: {
    overall: 'low' | 'medium' | 'high';
    reasoning: string[];
    warnings: string[];
  };
  regime: {
    type: 'normal' | 'exponential' | 'declining' | 'volatile';
    confidence: number;
    mathematicalJustification: string;
    adaptiveGuardrails: boolean;
  };
}

export const useRealisticProjectionsWithGuardrails = () => {
  const { user } = useAuth();
  const { data: dynamicData, isLoading: dynamicDataLoading } = useDynamicServiceData();
  const { forecast: advancedForecast } = useAdvancedForecastEngine();

  // Fetch historical data for regime analysis
  const { data: historicalData } = useQuery({
    queryKey: ['historical-monthly-data'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_historical_monthly_data');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  return useQuery({
    queryKey: ['realistic-projections-with-guardrails'],
    queryFn: async (): Promise<RealisticProjections> => {
      if (!user) throw new Error('Usuario no autenticado');
      if (!dynamicData) throw new Error('Dynamic data not available');
      if (!historicalData || historicalData.length < 3) throw new Error('Insufficient historical data for regime analysis');

      // Use dynamic data with current month/year
      const currentServices = dynamicData.currentMonth.services;
      const currentAOV = dynamicData.currentMonth.aov;
      const currentGMV = dynamicData.currentMonth.gmv;
      const daysElapsed = dynamicData.currentMonth.days;
      const daysRemaining = dynamicData.daysRemaining;
      const currentDailyPace = dynamicData.currentMonth.dailyPace;

      // Extract historical services data for regime analysis
      const historicalServices = historicalData.map((item: any) => item.total_services || 0).filter(s => s > 0);

      // Dynamic targets based on recent performance (trailing 30 days)
      const currentMonth = getCurrentMonthInfo();
      const previousMonth = getPreviousMonthInfo();
      
      // ========== INTELLIGENT ENSEMBLE WITH REGIME DETECTION ==========
      console.log('🧠 Applying Intelligent Ensemble with Regime Detection...');
      
      // Calculate intrames projection (base realistic scenario)
      const monthProgress = daysElapsed / (daysElapsed + daysRemaining);
      const intramensProjection = Math.round(currentServices / monthProgress);
      
      // Use intelligent ensemble for sophisticated analysis
      const ensembleResult = calculateIntelligentEnsemble(
        historicalServices,
        intramensProjection,
        historicalServices.length >= 12 ? 'high' : historicalServices.length >= 6 ? 'medium' : 'low'
      );
      
      // Apply mathematical guardrails - ensemble already includes adaptive limits
      const currentMonthTargetServices = ensembleResult.prediction;
      const currentMonthTargetGMV = (currentMonthTargetServices * currentAOV) / 1000000;
      
      console.log(`📊 Regime Analysis: ${ensembleResult.regime_analysis.regime} (confidence: ${(ensembleResult.regime_analysis.confidence * 100).toFixed(1)}%)`);
      console.log(`🎯 Ensemble Prediction: ${currentMonthTargetServices} services (${ensembleResult.adaptive_guardrails.regime_adjusted ? 'adjusted by guardrails' : 'within normal bounds'})`);
      console.log(`💰 Target GMV: $${currentMonthTargetGMV.toFixed(2)}M (AOV: $${currentAOV.toLocaleString()})`);
      
      const regimeInfo = {
        type: ensembleResult.regime_analysis.regime,
        confidence: ensembleResult.regime_analysis.confidence,
        mathematicalJustification: ensembleResult.mathematical_justification,
        adaptiveGuardrails: ensembleResult.adaptive_guardrails.regime_adjusted
      };

      // ========== INTELLIGENT CONFIDENCE ASSESSMENT ==========
      const paceNeeded = (currentMonthTargetServices - currentServices) / daysRemaining;
      const paceRatio = paceNeeded / currentDailyPace;
      
      // Confidence now based on ensemble + regime analysis
      let overallConfidence: 'low' | 'medium' | 'high';
      const reasoning: string[] = [];
      const warnings: string[] = [];
      
      // Base confidence from ensemble
      const ensembleConfidence = ensembleResult.confidence;
      
      if (ensembleConfidence >= 0.7 && regimeInfo.confidence >= 0.7) {
        overallConfidence = 'high';
        reasoning.push(`${regimeInfo.type} regime detected with high mathematical confidence`);
      } else if (ensembleConfidence >= 0.5 && regimeInfo.confidence >= 0.5) {
        overallConfidence = 'medium';
        reasoning.push(`${regimeInfo.type} regime with moderate confidence`);
      } else {
        overallConfidence = 'low';
        warnings.push(`Low confidence in ${regimeInfo.type} regime detection`);
      }
      
      // Additional warnings based on mathematical analysis
      if (ensembleResult.adaptive_guardrails.regime_adjusted) {
        warnings.push('Projection adjusted by adaptive guardrails for realism');
      }
      
      if (regimeInfo.type === 'exponential' && regimeInfo.confidence > 0.8) {
        reasoning.push('🚀 Exponential growth regime validated - limits automatically expanded');
      } else if (regimeInfo.type === 'volatile') {
        warnings.push('⚠️ Volatile pattern detected - higher uncertainty expected');
      }

      if (daysRemaining < 5) {
        warnings.push('Pocos días restantes - margen de error muy bajo');
      }

      // ========== MATHEMATICALLY-GROUNDED SCENARIOS ==========
      // Scenarios now based on uncertainty bounds from ensemble
      const lowerBound = Math.max(
        currentServices,
        ensembleResult.uncertainty_bounds.lower
      );
      const upperBound = Math.min(
        ensembleResult.adaptive_guardrails.upper_limit,
        ensembleResult.uncertainty_bounds.upper
      );
      
      const scenarios: ProjectionScenario[] = [
        {
          name: 'Pesimista',
          services: Math.round(lowerBound),
          gmv: 0,
          probability: regimeInfo.type === 'declining' ? 45 : 25,
          description: regimeInfo.type === 'declining' ? 'Régimen declinante confirmado' : 'Límite inferior estadístico',
          color: 'destructive',
          confidenceLevel: regimeInfo.confidence > 0.7 ? 'high' : 'medium'
        },
        {
          name: 'Realista',
          services: Math.round(ensembleResult.prediction),
          gmv: 0,
          probability: Math.round(ensembleResult.confidence * 100),
          description: `Predicción ensemble (${regimeInfo.type})`,
          color: 'warning',
          confidenceLevel: overallConfidence
        },
        {
          name: 'Optimista',
          services: Math.round(upperBound),
          gmv: 0,
          probability: regimeInfo.type === 'exponential' ? 35 : 15,
          description: regimeInfo.type === 'exponential' ? '🚀 Crecimiento exponencial detectado' : 'Límite superior estadístico',
          color: 'success',
          confidenceLevel: regimeInfo.type === 'exponential' && regimeInfo.confidence > 0.8 ? 'high' : 'medium'
        }
      ];

      // Calculate GMV with current AOV (not outdated AOV)
      scenarios.forEach(scenario => {
        scenario.gmv = (scenario.services * currentAOV) / 1000000;
      });

      // Most likely is highest probability
      const mostLikely = scenarios.reduce((prev, current) => 
        current.probability > prev.probability ? current : prev
      );

      return {
        current: {
          services: currentServices,
          gmv: currentGMV,
          days: daysElapsed,
          aov: currentAOV,
          dailyPace: currentDailyPace
        },
        target: {
          services: currentMonthTargetServices,
          gmv: currentMonthTargetGMV
        },
        scenarios,
        daysRemaining,
        mostLikely,
        insights: {
          paceNeeded: Math.round(paceNeeded * 10) / 10,
          currentTrend: paceRatio < 0.9 ? 'declining' : paceRatio > 1.1 ? 'growing' : 'stable',
          aovTrend: 'stable' // Using current AOV as baseline
        },
        confidence: {
          overall: overallConfidence,
          reasoning,
          warnings
        },
        regime: regimeInfo
      };
    },
    enabled: !!user && !dynamicDataLoading && !!dynamicData && !!historicalData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 60 * 1000
  });
};