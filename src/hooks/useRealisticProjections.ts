import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useDynamicServiceData } from './useDynamicServiceData';
import { getCurrentMonthInfo, getPreviousMonthInfo } from '@/utils/dynamicDateUtils';
import { analyzeWeekdaySeasonality, calculateWeekdayAdjustedProjection } from '@/utils/weekdaySeasonalityAnalysis';

interface ProjectionScenario {
  name: 'Pesimista' | 'Realista' | 'Optimista';
  services: number;
  gmv: number;
  probability: number;
  description: string;
  color: 'destructive' | 'warning' | 'success';
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
}

export const useRealisticProjections = () => {
  const { user } = useAuth();
  const { data: dynamicData, isLoading: dynamicDataLoading } = useDynamicServiceData();

  return useQuery({
    queryKey: ['realistic-projections'],
    queryFn: async (): Promise<RealisticProjections> => {
      if (!user) throw new Error('Usuario no autenticado');
      if (!dynamicData) throw new Error('Dynamic data not available');

      console.log('🎯 PROYECCIONES REALISTAS CON ESTACIONALIDAD - Iniciando análisis...');

      // Use dynamic data instead of hardcoded values (corrected for data lag)
      const currentServices = dynamicData.currentMonth.services;
      const currentAOV = dynamicData.currentMonth.aov;
      const currentGMV = dynamicData.currentMonth.gmv;
      const daysElapsed = dynamicData.currentMonth.days;
      const daysRemaining = dynamicData.daysRemaining;
      const currentDailyPace = dynamicData.currentMonth.dailyPace;

      // Get weekday seasonality analysis
      const weekdayPattern = await analyzeWeekdaySeasonality();
      const seasonalProjection = await calculateWeekdayAdjustedProjection(weekdayPattern);

      console.log('📊 Proyección estacional vs simple:', {
        seasonalProjection: `$${(seasonalProjection.totalProjectedGMV/1000000).toFixed(2)}M`,
        simpleLinearProjection: `$${(currentGMV * 30 / daysElapsed).toFixed(2)}M`,
        confidence: seasonalProjection.confidence
      });

      // Dynamic targets based on current month performance
      const currentMonth = getCurrentMonthInfo();
      const previousMonth = getPreviousMonthInfo();
      
      // Use seasonal projection as base for more accurate targeting
      const seasonalProjectedServices = Math.round(seasonalProjection.totalProjectedGMV / currentAOV);
      const baseTarget = Math.max(seasonalProjectedServices, currentDailyPace * (daysElapsed + daysRemaining));
      const currentMonthTargetServices = Math.round(baseTarget * 1.10); // 10% growth target (more realistic)
      const currentMonthTargetGMV = seasonalProjection.totalProjectedGMV / 1000000; // Use seasonal projection

      // Calculate realistic scenarios based on seasonal analysis
      const remainingServices = currentMonthTargetServices - currentServices;
      const paceNeeded = remainingServices / daysRemaining;

      // Enhanced scenario calculations using weekday patterns
      const weekdayAvgGMV = (weekdayPattern.monday.gmv + weekdayPattern.tuesday.gmv + 
        weekdayPattern.wednesday.gmv + weekdayPattern.thursday.gmv + weekdayPattern.friday.gmv) / 5;
      const weekendAvgGMV = (weekdayPattern.saturday.gmv + weekdayPattern.sunday.gmv) / 2;

      const scenarios: ProjectionScenario[] = [
        {
          name: 'Pesimista',
          services: Math.round(currentServices + (currentDailyPace * 0.90 * daysRemaining)), // 10% decline
          gmv: seasonalProjection.totalProjectedGMV * 0.92 / 1000000, // 8% below seasonal projection
          probability: 25,
          description: 'Ritmo declina, fines de semana débiles',
          color: 'destructive'
        },
        {
          name: 'Realista',
          services: Math.round(seasonalProjection.totalProjectedGMV / currentAOV),
          gmv: seasonalProjection.totalProjectedGMV / 1000000,
          probability: 60,
          description: 'Sigue patrones estacionales históricos',
          color: 'warning'
        },
        {
          name: 'Optimista',
          services: Math.round(seasonalProjection.totalProjectedGMV * 1.08 / currentAOV), // 8% above seasonal
          gmv: seasonalProjection.totalProjectedGMV * 1.08 / 1000000,
          probability: 15,
          description: 'Supera patrones, fuerte momentum weekdays',
          color: 'success'
        }
      ];

      // Find most likely scenario (highest probability)
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
        daysRemaining: daysRemaining || 0, // Add defensive programming
        mostLikely,
        insights: {
          paceNeeded: Math.round(paceNeeded * 100) / 100,
          currentTrend: currentDailyPace >= weekdayAvgGMV / currentAOV ? 'growing' : 
                       currentDailyPace >= weekdayAvgGMV * 0.9 / currentAOV ? 'stable' : 'declining',
          aovTrend: currentAOV > 6500 ? 'growing' : currentAOV > 6300 ? 'stable' : 'declining'
        }
      };
    },
    enabled: !!user && !dynamicDataLoading && !!dynamicData,
    staleTime: 5 * 60 * 1000, // 5 minutes for real-time accuracy
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 60 * 1000 // Refetch every hour
  });
};