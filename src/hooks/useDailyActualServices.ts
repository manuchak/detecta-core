import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface DailyActualData {
  date: string;
  dayOfMonth: number;
  services: number;
  gmv: number;
}

export const useDailyActualServices = (year: number = 2025, month: number = 12) => {
  return useQuery({
    queryKey: ['daily-actual-services', year, month],
    queryFn: async (): Promise<DailyActualData[]> => {
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));
      
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita, cobro_cliente')
        .gte('fecha_hora_cita', format(startDate, 'yyyy-MM-dd'))
        .lt('fecha_hora_cita', format(new Date(year, month, 1), 'yyyy-MM-dd'))
        .neq('estado', 'Cancelado')
        .gt('cobro_cliente', 0);

      if (error) {
        console.error('Error fetching daily actual services:', error);
        throw error;
      }

      // Group by day
      const dailyMap = new Map<number, { services: number; gmv: number }>();
      
      // Initialize all days of month
      const daysInMonth = endDate.getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        dailyMap.set(day, { services: 0, gmv: 0 });
      }

      // Aggregate actual data
      data?.forEach(service => {
        const serviceDate = new Date(service.fecha_hora_cita);
        // Use UTC date to avoid timezone shifting services to wrong day
        const day = serviceDate.getUTCDate();
        const existing = dailyMap.get(day) || { services: 0, gmv: 0 };
        dailyMap.set(day, {
          services: existing.services + 1,
          gmv: existing.gmv + (service.cobro_cliente || 0)
        });
      });

      // Convert to array
      const result: DailyActualData[] = [];
      dailyMap.forEach((value, day) => {
        result.push({
          date: format(new Date(year, month - 1, day), 'yyyy-MM-dd'),
          dayOfMonth: day,
          services: value.services,
          gmv: value.gmv
        });
      });

      console.log('📊 Daily Actual Services:', {
        month: `${year}-${month}`,
        totalDays: result.length,
        totalServices: result.reduce((sum, d) => sum + d.services, 0),
        totalGMV: result.reduce((sum, d) => sum + d.gmv, 0)
      });

      return result.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000
  });
};
