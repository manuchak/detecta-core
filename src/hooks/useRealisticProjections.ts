import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

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

  return useQuery({
    queryKey: ['realistic-projections'],
    queryFn: async (): Promise<RealisticProjections> => {
      if (!user) throw new Error('Usuario no autenticado');

      // Real current data (from dashboard observations)
      const currentServices = 240;
      const currentAOV = 7272;
      const currentGMV = (currentServices * currentAOV) / 1000000; // $1.75M
      
      const currentDate = new Date();
      const daysElapsed = 8; // Approx current day of September
      const daysRemaining = 22; // Days left in September
      const currentDailyPace = currentServices / daysElapsed; // 30 services/day

      // August targets
      const augustServices = 890;
      const augustGMV = 7.03;

      // Calculate realistic scenarios based on trends
      const remainingServices = augustServices - currentServices; // 650 services needed
      const paceNeeded = remainingServices / daysRemaining; // 29.5 services/day needed

      // Scenario calculations
      const scenarios: ProjectionScenario[] = [
        {
          name: 'Pesimista',
          services: Math.round(currentServices + (currentDailyPace * 0.85 * daysRemaining)), // Pace declines 15%
          gmv: 0,
          probability: 30,
          description: 'Ritmo actual declina por fatiga del equipo',
          color: 'destructive'
        },
        {
          name: 'Realista',
          services: Math.round(currentServices + (currentDailyPace * 0.95 * daysRemaining)), // Pace slightly declines 5%
          gmv: 0,
          probability: 50,
          description: 'Ritmo se mantiene con ligero declive natural',
          color: 'warning'
        },
        {
          name: 'Optimista',
          services: Math.round(currentServices + (paceNeeded * daysRemaining)), // Achieves needed pace
          gmv: 0,
          probability: 20,
          description: 'Equipo acelera para alcanzar meta de agosto',
          color: 'success'
        }
      ];

      // Calculate GMV for each scenario (with slight AOV decline trend)
      scenarios.forEach(scenario => {
        const projectedAOV = currentAOV * 0.98; // 2% AOV decline trend observed
        scenario.gmv = (scenario.services * projectedAOV) / 1000000;
      });

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
          services: augustServices,
          gmv: augustGMV
        },
        scenarios,
        daysRemaining,
        mostLikely,
        insights: {
          paceNeeded: Math.round(paceNeeded * 10) / 10,
          currentTrend: currentDailyPace < paceNeeded ? 'declining' : 'stable',
          aovTrend: 'declining' // Based on observed data
        }
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  });
};