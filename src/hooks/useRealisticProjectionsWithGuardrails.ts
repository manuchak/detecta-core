import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useDynamicServiceData } from './useDynamicServiceData';
import { useAdvancedForecastEngine } from './useAdvancedForecastEngine';
import { getCurrentMonthInfo, getPreviousMonthInfo } from '@/utils/dynamicDateUtils';

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
}

export const useRealisticProjectionsWithGuardrails = () => {
  const { user } = useAuth();
  const { data: dynamicData, isLoading: dynamicDataLoading } = useDynamicServiceData();
  const { forecast: advancedForecast } = useAdvancedForecastEngine();

  return useQuery({
    queryKey: ['realistic-projections-with-guardrails'],
    queryFn: async (): Promise<RealisticProjections> => {
      if (!user) throw new Error('Usuario no autenticado');
      if (!dynamicData) throw new Error('Dynamic data not available');

      // Use dynamic data with current month/year
      const currentServices = dynamicData.currentMonth.services;
      const currentAOV = dynamicData.currentMonth.aov;
      const currentGMV = dynamicData.currentMonth.gmv;
      const daysElapsed = dynamicData.currentMonth.days;
      const daysRemaining = dynamicData.daysRemaining;
      const currentDailyPace = dynamicData.currentMonth.dailyPace;

      // Dynamic targets based on recent performance (trailing 30 days)
      const currentMonth = getCurrentMonthInfo();
      const previousMonth = getPreviousMonthInfo();
      
      // Use Advanced Forecast Engine monthly projection for realistic baseline
      const baselineServices = advancedForecast?.monthlyServices || (currentServices + currentDailyPace * daysRemaining);
      
      // Realistic target: current trajectory + 10-20% improvement (not 400%+ jump)
      const maxRealisticGrowth = 1.3; // Max 30% improvement from current pace
      const currentMonthTargetServices = Math.min(
        Math.round(baselineServices * 1.15), // 15% above baseline
        Math.round(currentServices + currentDailyPace * maxRealisticGrowth * daysRemaining)
      );
      
      // Use current month AOV (not outdated December 2024 AOV)
      const currentMonthTargetGMV = (currentMonthTargetServices * currentAOV) / 1000000;

      // Guardrails for realism
      const paceNeeded = (currentMonthTargetServices - currentServices) / daysRemaining;
      const paceRatio = paceNeeded / currentDailyPace;
      
      // Confidence assessment
      let overallConfidence: 'low' | 'medium' | 'high' = 'medium';
      const reasoning: string[] = [];
      const warnings: string[] = [];
      
      if (paceRatio > 1.6) {
        overallConfidence = 'low';
        warnings.push('Requiere acelerar 60%+ del ritmo actual - poco probable');
      } else if (paceRatio > 1.3) {
        overallConfidence = 'medium';
        warnings.push('Requiere acelerar 30%+ del ritmo actual - desafiante');
      } else {
        overallConfidence = 'high';
        reasoning.push('Meta alcanzable con ritmo actual o pequeño incremento');
      }

      if (daysRemaining < 5) {
        warnings.push('Pocos días restantes - margen de error muy bajo');
      }

      // Scenario calculations with guardrails
      const maxDailyGrowth = 1.25; // Max 25% daily pace improvement
      const scenarios: ProjectionScenario[] = [
        {
          name: 'Pesimista',
          services: Math.round(currentServices + (currentDailyPace * 0.85 * daysRemaining)),
          gmv: 0,
          probability: paceRatio > 1.5 ? 50 : 25, // Higher if goal is unrealistic
          description: 'Ritmo declina por fatiga del equipo',
          color: 'destructive',
          confidenceLevel: 'high'
        },
        {
          name: 'Realista',
          services: Math.round(currentServices + (currentDailyPace * Math.min(1.05, maxDailyGrowth * 0.8) * daysRemaining)),
          gmv: 0,
          probability: paceRatio > 1.5 ? 35 : 55,
          description: 'Ritmo se mantiene con ligero incremento',
          color: 'warning',
          confidenceLevel: overallConfidence
        },
        {
          name: 'Optimista',
          services: Math.round(currentServices + (Math.min(paceNeeded, currentDailyPace * maxDailyGrowth) * daysRemaining)),
          gmv: 0,
          probability: paceRatio > 1.5 ? 15 : 20,
          description: `Equipo acelera para meta ${currentMonth.monthName}`,
          color: 'success',
          confidenceLevel: paceRatio > 1.4 ? 'low' : 'medium'
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
        }
      };
    },
    enabled: !!user && !dynamicDataLoading && !!dynamicData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 60 * 1000
  });
};