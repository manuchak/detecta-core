import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  return useQuery({
    queryKey: ['year-over-year-comparison'],
    queryFn: async (): Promise<YearOverYearData> => {
      if (!user) throw new Error('Usuario no autenticado');

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentDay = currentDate.getDate();

      // Using fallback data based on the confirmed analysis
      // TODO: Replace with actual table queries when correct schema is available
      const ytdServices2025 = 6041;
      const ytdGmv2025 = 39900000;
      
      const ytdServices2024 = 7714;
      const ytdGmv2024 = 47600000;

      const current2025 = {
        ytdServices: ytdServices2025,
        ytdGmv: ytdGmv2025 / 1000000
      };

      const same2024 = {
        ytdServices: ytdServices2024,
        ytdGmv: ytdGmv2024 / 1000000
      };

      const servicesGrowth = ((current2025.ytdServices - same2024.ytdServices) / same2024.ytdServices) * 100;
      const gmvGrowth = ((current2025.ytdGmv - same2024.ytdGmv) / same2024.ytdGmv) * 100;

      // Calculate annual projection
      const daysElapsed = Math.floor((currentDate.getTime() - new Date(2025, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
      const daysInYear = 365;
      const projected2025 = Math.round((current2025.ytdServices / daysElapsed) * daysInYear);
      
      const full2024Services = 10714;
      const vs2024Percent = ((projected2025 - full2024Services) / full2024Services) * 100;

      return {
        current2025,
        same2024,
        growth: {
          servicesPercent: Math.round(servicesGrowth * 10) / 10,
          gmvPercent: Math.round(gmvGrowth * 10) / 10,
          servicesGap: current2025.ytdServices - same2024.ytdServices,
          gmvGap: Math.round((current2025.ytdGmv - same2024.ytdGmv) * 10) / 10
        },
        annualProjection: {
          projected2025,
          vs2024Percent: Math.round(vs2024Percent * 10) / 10
        }
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  });
};