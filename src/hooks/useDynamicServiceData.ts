import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';

interface DynamicServiceData {
  currentMonth: {
    services: number;
    gmv: number;
    aov: number;
    days: number;
    dailyPace: number;
  };
  daysRemaining: number;
  yearToDate: {
    current: {
      services: number;
      gmv: number;
    };
    previous: {
      services: number;
      gmv: number;
    };
    growth: {
      services: number;
      gmv: number;
      servicesPercentage: number;
      gmvPercentage: number;
    };
  };
}

export const useDynamicServiceData = () => {
  return useAuthenticatedQuery(
    ['dynamic-service-data'],
    async (): Promise<DynamicServiceData> => {
      
      // Get current date info
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // September = 9
      const currentDay = now.getDate();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const daysRemaining = daysInMonth - currentDay;

      // Get historical monthly data for calculations
      const { data: historicalData, error: historicalError } = await supabase
        .rpc('get_historical_monthly_data');

      if (historicalError) {
        console.error('Error fetching historical data:', historicalError);
        throw historicalError;
      }

      // Filter current month data (September 2025)
      const currentMonthData = historicalData?.find((row: any) => 
        row.year === currentYear && row.month === currentMonth
      );

      // Calculate YTD for current year (2025) - Jan to current month
      const ytdCurrent = historicalData
        ?.filter((row: any) => row.year === currentYear && row.month <= currentMonth)
        ?.reduce((acc: any, row: any) => ({
          services: acc.services + (row.services || 0),
          gmv: acc.gmv + (row.gmv || 0)
        }), { services: 0, gmv: 0 });

      // Calculate YTD for previous year (2024) - Jan to same month
      const ytdPrevious = historicalData
        ?.filter((row: any) => row.year === (currentYear - 1) && row.month <= currentMonth)
        ?.reduce((acc: any, row: any) => ({
          services: acc.services + (row.services || 0),
          gmv: acc.gmv + (row.gmv || 0)
        }), { services: 0, gmv: 0 });

      // Current month metrics
      const currentServices = currentMonthData?.services || 0;
      const currentGMV = (currentMonthData?.gmv || 0) / 1000000; // Convert to millions
      const currentAOV = currentServices > 0 ? (currentMonthData?.gmv || 0) / currentServices : 0;
      const dailyPace = currentServices / currentDay;

      // YTD Growth calculations
      const servicesGrowth = (ytdCurrent?.services || 0) - (ytdPrevious?.services || 0);
      const gmvGrowth = ((ytdCurrent?.gmv || 0) - (ytdPrevious?.gmv || 0)) / 1000000;
      const servicesGrowthPercentage = ytdPrevious?.services > 0 
        ? ((servicesGrowth / ytdPrevious.services) * 100) 
        : 0;
      const gmvGrowthPercentage = ytdPrevious?.gmv > 0 
        ? ((((ytdCurrent?.gmv || 0) - (ytdPrevious?.gmv || 0)) / ytdPrevious.gmv) * 100) 
        : 0;

      return {
        currentMonth: {
          services: currentServices,
          gmv: currentGMV,
          aov: Math.round(currentAOV),
          days: currentDay,
          dailyPace: Math.round(dailyPace * 10) / 10
        },
        daysRemaining,
        yearToDate: {
          current: {
            services: ytdCurrent?.services || 0,
            gmv: (ytdCurrent?.gmv || 0) / 1000000
          },
          previous: {
            services: ytdPrevious?.services || 0,
            gmv: (ytdPrevious?.gmv || 0) / 1000000
          },
          growth: {
            services: servicesGrowth,
            gmv: gmvGrowth,
            servicesPercentage: Math.round(servicesGrowthPercentage * 10) / 10,
            gmvPercentage: Math.round(gmvGrowthPercentage * 10) / 10
          }
        }
      };
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnWindowFocus: true,
      refetchInterval: 60 * 60 * 1000 // Refetch every hour
    }
  );
};