import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { calculateExactYTDComparison, getYTDPeriodLabel } from '@/utils/exactDateYTDCalculations';

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
  periodLabel: {
    current: string;
    previous: string;
    comparison: string;
  };
}

export const useYearOverYearComparison = () => {
  return useAuthenticatedQuery(
    ['year-over-year-comparison-exact'],
    async (): Promise<YearOverYearData> => {
      // Use exact YTD comparison for fair calculation
      const exactYTDData = await calculateExactYTDComparison();
      const periodLabel = getYTDPeriodLabel();

      if (!exactYTDData) {
        throw new Error('No se pudo obtener datos YTD exactos');
      }
      
      // Use exact YTD data from calculations
      const ytdServices2025 = exactYTDData.currentServices;
      const ytdGMV2025 = Math.round((exactYTDData.currentGMV / 1000000) * 100) / 100; // Convert to millions
      
      const ytdServices2024 = exactYTDData.previousServices;
      const ytdGMV2024 = Math.round((exactYTDData.previousGMV / 1000000) * 100) / 100; // Convert to millions

      const current2025 = {
        ytdServices: ytdServices2025,
        ytdGmv: ytdGMV2025
      };

      const same2024 = {
        ytdServices: ytdServices2024,
        ytdGmv: ytdGMV2024
      };

      // Use exact growth calculations
      const servicesGrowthPercentage = Math.round(exactYTDData.servicesGrowthPercentage * 100) / 100;
      const gmvGrowthPercentage = Math.round(exactYTDData.gmvGrowthPercentage * 100) / 100;
      const servicesGrowth = exactYTDData.servicesGrowth;
      const gmvGrowth = Math.round((exactYTDData.gmvGrowth / 1000000) * 100) / 100; // Convert to millions

      // Calculate annual projection based on exact YTD progress
      const currentDate = new Date();
      const adjustedDate = new Date(currentDate);
      adjustedDate.setDate(adjustedDate.getDate() - 1); // Account for data lag
      
      const daysElapsed = Math.floor((adjustedDate.getTime() - new Date(2025, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
          vs2024Percent: Math.round(vs2024Percent * 100) / 100
        },
        periodLabel
      };
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true
    }
  );
};