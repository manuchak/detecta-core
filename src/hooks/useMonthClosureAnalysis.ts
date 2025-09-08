import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { getPaceStatus } from '@/utils/paceStatus';
import { useDynamicServiceData } from './useDynamicServiceData';

interface MonthClosureData {
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
  insights: {
    paceNeeded: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  status: 'En riesgo' | 'En meta' | 'Superando';
  daysRemaining: number;
  requiredPace: number;
  currentPace: number;
  paceStatus: ReturnType<typeof getPaceStatus>;
}

export const useMonthClosureAnalysis = () => {
  const { data: dynamicData, isLoading: dynamicDataLoading } = useDynamicServiceData();

  return useAuthenticatedQuery(
    ['month-closure-analysis', dynamicData ? 'ready' : 'waiting'],
    async (): Promise<MonthClosureData> => {
      if (!dynamicData) throw new Error('Dynamic data not available');

      // Use dynamic data for consistency across all components
      const currentServices = dynamicData.currentMonth.services;
      const avgAOV = dynamicData.currentMonth.aov;
      const daysElapsed = dynamicData.currentMonth.days;
      const daysRemaining = dynamicData.daysRemaining;
      
      // September targets (should match useRealisticProjections)
      const septemberTargetServices = 890;
      const septemberTargetGMV = 7.0;

      const current = {
        services: currentServices,
        gmv: dynamicData.currentMonth.gmv,
        days: daysElapsed,
        aov: avgAOV,
        dailyPace: dynamicData.currentMonth.dailyPace
      };

      const target = {
        services: septemberTargetServices,
        gmv: septemberTargetGMV
      };

      const currentPace = current.services / daysElapsed;
      const requiredPace = (target.services - current.services) / daysRemaining;
      const paceNeeded = Math.ceil(requiredPace);
      
      // Status using same logic as other components
      const paceStatus = getPaceStatus(currentPace, requiredPace);
      
      let status: 'En riesgo' | 'En meta' | 'Superando';
      if (paceStatus.status === 'behind') status = 'En riesgo';
      else if (paceStatus.status === 'exceeding') status = 'Superando';
      else status = 'En meta';

      return {
        current,
        target,
        insights: {
          paceNeeded,
          trend: 'stable' as const
        },
        status,
        daysRemaining,
        requiredPace: Math.round(requiredPace * 10) / 10,
        currentPace: Math.round(currentPace * 10) / 10,
        paceStatus
      };
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true
    }
  );
};