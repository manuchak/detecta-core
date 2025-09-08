import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MonthClosureData {
  current: {
    services: number;
    gmv: number;
    days: number;
    aov: number;
  };
  target: {
    services: number;
    gmv: number;
  };
  projection: {
    services: number;
    gmv: number;
    probability: number;
  };
  status: 'En riesgo' | 'En meta' | 'Superando';
  daysRemaining: number;
  requiredPace: number;
  currentPace: number;
}

export const useMonthClosureAnalysis = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['month-closure-analysis'],
    queryFn: async (): Promise<MonthClosureData> => {
      if (!user) throw new Error('Usuario no autenticado');

      // Using fallback data based on the analysis provided
      // TODO: Replace with actual table queries when servicios_monitoreo schema is confirmed
      const currentDate = new Date();
      const daysInSeptember = 30;
      const daysElapsed = currentDate.getDate();
      const daysRemaining = daysInSeptember - daysElapsed;
      
      const septemberServices = 240;
      const septemberGmv = 1750000;
      const septemberAov = 7272;

      const augustServices = 889;
      const augustGmv = 7030000;

      const current = {
        services: septemberServices,
        gmv: septemberGmv / 1000000, // Convert to millions
        days: daysElapsed,
        aov: septemberAov
      };

      const target = {
        services: augustServices,
        gmv: augustGmv / 1000000, // Convert to millions
      };

      const currentPace = current.services / daysElapsed;
      const requiredPace = (target.services - current.services) / daysRemaining;
      
      // Project month end based on current pace
      const projectedServices = Math.round(current.services + (currentPace * daysRemaining));
      const projectedGmv = (projectedServices * current.aov) / 1000000;
      
      // Calculate probability based on pace comparison
      const paceRatio = currentPace / requiredPace;
      const probability = Math.min(Math.max(paceRatio * 75, 25), 95);

      let status: 'En riesgo' | 'En meta' | 'Superando';
      if (projectedServices < target.services * 0.95) status = 'En riesgo';
      else if (projectedServices > target.services * 1.05) status = 'Superando';
      else status = 'En meta';

      return {
        current,
        target,
        projection: {
          services: projectedServices,
          gmv: projectedGmv,
          probability: Math.round(probability)
        },
        status,
        daysRemaining,
        requiredPace: Math.round(requiredPace * 10) / 10,
        currentPace: Math.round(currentPace * 10) / 10
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  });
};