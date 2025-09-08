import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useDynamicServiceData } from './useDynamicServiceData';

interface YearOverYearData {
  current2025: {
    ytdServices: number;
    ytdGmv: number;
  };
  same2024: {
    ytdServices: number;
    ytdGmv: number;
  };
  growth: {
    servicesPercent: number;
    gmvPercent: number;
    servicesGap: number;
    gmvGap: number;
  };
  annualProjection: {
    projected2025: number;
    vs2024Percent: number;
  };
}

export const useYearOverYearComparison = () => {
  const { data: dynamicData, isLoading: dynamicDataLoading } = useDynamicServiceData();

  return useAuthenticatedQuery(
    ['year-over-year-comparison', dynamicData ? 'ready' : 'waiting'],
    async (): Promise<YearOverYearData> => {
      if (!dynamicData) throw new Error('Dynamic data not available');
      
      // Use real YTD data from dynamic service data
      const ytdServices2025 = dynamicData.yearToDate.current.services;
      const ytdGMV2025 = dynamicData.yearToDate.current.gmv;
      
      const ytdServices2024 = dynamicData.yearToDate.previous.services;
      const ytdGMV2024 = dynamicData.yearToDate.previous.gmv;

      const current2025 = {
        ytdServices: ytdServices2025,
        ytdGmv: ytdGMV2025
      };

      const same2024 = {
        ytdServices: ytdServices2024,
        ytdGmv: ytdGMV2024
      };

      // Use real growth calculations from dynamic data
      const servicesGrowthPercentage = dynamicData.yearToDate.growth.servicesPercentage;
      const gmvGrowthPercentage = dynamicData.yearToDate.growth.gmvPercentage;
      const servicesGrowth = dynamicData.yearToDate.growth.services;
      const gmvGrowth = dynamicData.yearToDate.growth.gmv;

      // Calculate annual projection based on current pace
      const currentDate = new Date();
      const daysElapsed = Math.floor((currentDate.getTime() - new Date(2025, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
      const daysInYear = 365;
      const projected2025 = Math.round((current2025.ytdServices / daysElapsed) * daysInYear);
      
      const full2024Services = 10714; // Total services in 2024
      const vs2024Percent = ((projected2025 - full2024Services) / full2024Services) * 100;

      return {
        current2025,
        same2024,
        growth: {
          servicesPercent: servicesGrowthPercentage,
          gmvPercent: gmvGrowthPercentage,
          servicesGap: servicesGrowth,
          gmvGap: gmvGrowth
        },
        annualProjection: {
          projected2025,
          vs2024Percent: Math.round(vs2024Percent * 10) / 10
        }
      };
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true
    }
  );
};