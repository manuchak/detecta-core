import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { calculateExactYTDComparison, getYTDPeriodLabel } from '@/utils/exactDateYTDCalculations';

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
  ytdPeriodLabel: {
    current: string;
    previous: string;
    comparison: string;
  };
}

export const useDynamicServiceData = () => {
  return useAuthenticatedQuery(
    ['dynamic-service-data'],
    async (): Promise<DynamicServiceData> => {
      
      // Get current date info - Use actual current month/year dynamically
      const now = new Date();
      const currentYear = now.getFullYear(); // 2025 for current year
      const currentMonth = now.getMonth() + 1; // September = 9 (RPC uses 1-12)
      const currentDay = now.getDate();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate(); // Dynamic days in month
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

      // Calculate YTD using exact dates for fair comparison
      const exactYTDData = await calculateExactYTDComparison();
      const ytdPeriodLabel = getYTDPeriodLabel();

      if (!exactYTDData) {
        throw new Error('No se pudo obtener datos YTD exactos');
      }

      // Use exact YTD data for calculations
      const ytdCurrent = {
        services: exactYTDData.currentServices,
        gmv: exactYTDData.currentGMV
      };

      const ytdPrevious = {
        services: exactYTDData.previousServices,
        gmv: exactYTDData.previousGMV
      };

      // Current month metrics
      const currentServices = currentMonthData?.services || 0;
      const currentGMV = (currentMonthData?.gmv || 0) / 1000000; // Convert to millions
      const currentAOV = currentServices > 0 ? (currentMonthData?.gmv || 0) / currentServices : 0;
      const dailyPace = currentServices / currentDay;

      // YTD Growth calculations (using exact data)
      const servicesGrowth = exactYTDData.servicesGrowth;
      const gmvGrowth = exactYTDData.gmvGrowth / 1000000; // Convert to millions
      const servicesGrowthPercentage = exactYTDData.servicesGrowthPercentage;
      const gmvGrowthPercentage = exactYTDData.gmvGrowthPercentage;

      return {
        currentMonth: {
          services: currentServices,
          gmv: Math.round(currentGMV * 100) / 100,
          aov: Math.round(currentAOV),
          days: currentDay,
          dailyPace: Math.round(dailyPace * 100) / 100
        },
        daysRemaining,
        yearToDate: {
          current: {
          services: ytdCurrent.services,
          gmv: Math.round((ytdCurrent.gmv / 1000000) * 100) / 100
        },
        previous: {
          services: ytdPrevious.services,
          gmv: Math.round((ytdPrevious.gmv / 1000000) * 100) / 100
        },
        growth: {
          services: servicesGrowth,
          gmv: Math.round(gmvGrowth * 100) / 100,
          servicesPercentage: Math.round(servicesGrowthPercentage * 100) / 100,
          gmvPercentage: Math.round(gmvGrowthPercentage * 100) / 100
          }
        },
        ytdPeriodLabel
      };
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnWindowFocus: true,
      refetchInterval: 60 * 60 * 1000 // Refetch every hour
    }
  );
};