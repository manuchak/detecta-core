import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { getPaceStatus } from '@/utils/paceStatus';
import { useDynamicServiceData } from './useDynamicServiceData';
import { calculateMTDComparison, type MTDComparisonData } from '@/utils/mtdComparison';
import { supabase } from '@/integrations/supabase/client';
import { useRealisticProjectionsWithGuardrails } from './useRealisticProjectionsWithGuardrails';

interface MonthClosureData {
  current: {
    services: number;
    gmv: number;
    days: number;
    aov: number;
    dailyPace: number;
    monthName: string;
    year: number;
  };
  target: {
    services: number;
    gmv: number;
  };
  previousMonth: {
    services: number;
    gmv: number;
    aov: number;
    monthName: string;
  };
  monthOverMonth: {
    servicesChange: number;
    servicesPercent: number;
    gmvChange: number;
    gmvPercent: number;
    aovChange: number;
    aovPercent: number;
  };
  projection: {
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
  mtdComparison: MTDComparisonData;
}

const getMonthName = (month: number): string => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month - 1];
};

export const useMonthClosureAnalysis = () => {
  const { data: dynamicData, isLoading: dynamicDataLoading } = useDynamicServiceData();
  const { data: realisticProjections, isLoading: projectionsLoading } = useRealisticProjectionsWithGuardrails();

  return useAuthenticatedQuery(
    ['month-closure-analysis', dynamicData ? 'ready' : 'waiting', realisticProjections ? 'projections-ready' : 'waiting'],
    async (): Promise<MonthClosureData> => {
      if (!dynamicData) throw new Error('Dynamic data not available');
      if (!realisticProjections) throw new Error('Realistic projections not available');

      // Get MTD comparison data
      const mtdComparison = await calculateMTDComparison();

      // Get current date info
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentDay = Math.max(1, now.getDate() - 1); // Account for data lag
      
      // Use dynamic data for current month
      const currentServices = dynamicData.currentMonth.services;
      const currentGMV = dynamicData.currentMonth.gmv;
      const avgAOV = dynamicData.currentMonth.aov;
      const daysElapsed = dynamicData.currentMonth.days;
      const daysRemaining = dynamicData.daysRemaining;

      // Get previous month data for MoM comparison
      const { data: historicalData } = await supabase.rpc('get_historical_monthly_data');
      
      let previousMonth = currentMonth - 1;
      let previousYear = currentYear;
      if (previousMonth === 0) {
        previousMonth = 12;
        previousYear = currentYear - 1;
      }

      const previousMonthData = historicalData?.find((row: any) => 
        row.year === previousYear && row.month === previousMonth
      );

      const prevServices = previousMonthData?.services || 0;
      const prevGMV = (previousMonthData?.gmv || 0) / 1000000;
      const prevAOV = prevServices > 0 ? (previousMonthData?.gmv || 0) / prevServices : 0;

      // Calculate MoM changes
      const servicesChange = currentServices - prevServices;
      const servicesPercent = prevServices > 0 ? (servicesChange / prevServices) * 100 : 0;
      const gmvChange = currentGMV - prevGMV;
      const gmvPercent = prevGMV > 0 ? (gmvChange / prevGMV) * 100 : 0;
      const aovChange = avgAOV - prevAOV;
      const aovPercent = prevAOV > 0 ? (aovChange / prevAOV) * 100 : 0;

      // Calculate projection for current month
      const currentPace = currentServices / daysElapsed;
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      
      // Use realistic projection scenario as target (no artificial 5% inflation)
      const realistaScenario = realisticProjections.scenarios.find(s => s.name === 'Realista');
      const targetServices = realistaScenario?.services || Math.round(currentPace * daysInMonth);
      const targetGMV = realistaScenario?.gmv || (targetServices * avgAOV / 1000000);
      
      // Most likely projection (can differ from target)
      const projectedServices = realisticProjections.mostLikely.services;
      const projectedGMV = realisticProjections.mostLikely.gmv;

      console.log('🎯 TARGET CALCULATION:', {
        source: 'useRealisticProjections - Escenario Realista',
        targetServices,
        targetGMV: `$${targetGMV.toFixed(2)}M`,
        projectionServices: projectedServices,
        projectionGMV: `$${projectedGMV.toFixed(2)}M`,
        currentPace: currentPace.toFixed(2),
        requiredPace: ((targetServices - currentServices) / daysRemaining).toFixed(2),
        status: currentPace >= ((targetServices - currentServices) / daysRemaining) ? '✅ En meta' : '⚠️ En riesgo'
      });

      const current = {
        services: currentServices,
        gmv: currentGMV,
        days: daysElapsed,
        aov: avgAOV,
        dailyPace: dynamicData.currentMonth.dailyPace,
        monthName: getMonthName(currentMonth),
        year: currentYear
      };

      const target = {
        services: targetServices,
        gmv: targetGMV
      };

      const previousMonth_data = {
        services: prevServices,
        gmv: Math.round(prevGMV * 100) / 100,
        aov: Math.round(prevAOV),
        monthName: getMonthName(previousMonth)
      };

      const monthOverMonth = {
        servicesChange: Math.round(servicesChange),
        servicesPercent: Math.round(servicesPercent * 100) / 100,
        gmvChange: Math.round(gmvChange * 100) / 100,
        gmvPercent: Math.round(gmvPercent * 100) / 100,
        aovChange: Math.round(aovChange),
        aovPercent: Math.round(aovPercent * 100) / 100
      };

      const projection = {
        services: projectedServices,
        gmv: Math.round(projectedGMV * 100) / 100
      };

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
        previousMonth: previousMonth_data,
        monthOverMonth,
        projection,
        insights: {
          paceNeeded,
          trend: servicesPercent > 0 ? 'improving' : servicesPercent < 0 ? 'declining' : 'stable'
        },
        status,
        daysRemaining,
        requiredPace: Math.round(requiredPace * 100) / 100,
        currentPace: Math.round(currentPace * 100) / 100,
        paceStatus,
        mtdComparison
      };
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true
    }
  );
};