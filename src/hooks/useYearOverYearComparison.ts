import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { calculateExactYTDComparison, getYTDPeriodLabel } from '@/utils/exactDateYTDCalculations';

interface YearOverYearData {
  currentYear: number;
  previousYear: number;
  currentYTD: {
    services: number;
    gmv: number;
  };
  previousYTD: {
    services: number;
    gmv: number;
  };
  previousYearTotal: number;
  growth: {
    servicesPercent: number;
    gmvPercent: number;
    servicesGap: number;
    gmvGap: number;
  };
  annualProjection: {
    projected: number;
    vsPreviousPercent: number;
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
      
      // Años dinámicos desde los datos
      const currentYear = exactYTDData.currentYear;
      const previousYear = exactYTDData.previousYear;
      const previousYearTotal = exactYTDData.previousYearTotal;
      
      // Use exact YTD data from calculations
      const currentYTD = {
        services: exactYTDData.currentServices,
        gmv: Math.round((exactYTDData.currentGMV / 1000000) * 100) / 100 // Convert to millions
      };

      const previousYTD = {
        services: exactYTDData.previousServices,
        gmv: Math.round((exactYTDData.previousGMV / 1000000) * 100) / 100 // Convert to millions
      };

      // Use exact growth calculations
      const servicesGrowthPercentage = Math.round(exactYTDData.servicesGrowthPercentage * 100) / 100;
      const gmvGrowthPercentage = Math.round(exactYTDData.gmvGrowthPercentage * 100) / 100;
      const servicesGrowth = exactYTDData.servicesGrowth;
      const gmvGrowth = Math.round((exactYTDData.gmvGrowth / 1000000) * 100) / 100; // Convert to millions

      // Calculate annual projection based on exact YTD progress (dynamic year)
      const currentDate = new Date();
      const adjustedDate = new Date(currentDate);
      adjustedDate.setDate(adjustedDate.getDate() - 1); // Account for data lag
      
      const daysElapsed = Math.floor((adjustedDate.getTime() - new Date(currentYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysInYear = 365;
      const projected = Math.round((currentYTD.services / Math.max(daysElapsed, 1)) * daysInYear);
      
      const vsPreviousPercent = previousYearTotal > 0 
        ? ((projected - previousYearTotal) / previousYearTotal) * 100 
        : 0;

      return {
        currentYear,
        previousYear,
        currentYTD,
        previousYTD,
        previousYearTotal,
        growth: {
          servicesPercent: servicesGrowthPercentage,
          gmvPercent: gmvGrowthPercentage,
          servicesGap: servicesGrowth,
          gmvGap: gmvGrowth
        },
        annualProjection: {
          projected,
          vsPreviousPercent: Math.round(vsPreviousPercent * 100) / 100
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