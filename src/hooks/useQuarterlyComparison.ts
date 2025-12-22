import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getQuarter, getYear, startOfYear, endOfYear, format } from 'date-fns';

export interface QuarterData {
  quarter: string;
  year: number;
  servicios: number;
  gmv: number;
}

export interface QuarterlyComparisonData {
  quarters: QuarterData[];
  years: number[];
}

export function useQuarterlyComparison() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quarterly-comparison'],
    queryFn: async () => {
      const now = new Date();
      const currentYear = getYear(now);
      const years = [currentYear, currentYear - 1, currentYear - 2];
      
      // Get services for last 3 years
      const { data: services, error: servicesError } = await supabase
        .from('servicios_custodia')
        .select('fecha_servicio, cobro_cliente')
        .gte('fecha_servicio', format(startOfYear(new Date(years[2], 0, 1)), 'yyyy-MM-dd'))
        .lte('fecha_servicio', format(endOfYear(new Date(years[0], 0, 1)), 'yyyy-MM-dd'))
        .not('estado', 'eq', 'cancelado');

      if (servicesError) throw servicesError;

      // Aggregate by quarter and year
      const quarterlyData: Record<string, { servicios: number; gmv: number }> = {};
      
      (services || []).forEach(s => {
        if (!s.fecha_servicio) return;
        const date = new Date(s.fecha_servicio);
        const year = getYear(date);
        const quarter = getQuarter(date);
        const key = `Q${quarter}-${year}`;
        
        if (!quarterlyData[key]) {
          quarterlyData[key] = { servicios: 0, gmv: 0 };
        }
        quarterlyData[key].servicios += 1;
        quarterlyData[key].gmv += parseFloat(String(s.cobro_cliente || 0));
      });

      // Build structured result
      const quarters: QuarterData[] = [];
      years.forEach(year => {
        [1, 2, 3, 4].forEach(q => {
          const key = `Q${q}-${year}`;
          quarters.push({
            quarter: `Q${q}`,
            year,
            servicios: quarterlyData[key]?.servicios || 0,
            gmv: quarterlyData[key]?.gmv || 0
          });
        });
      });

      return { quarters, years };
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    quarters: data?.quarters || [],
    years: data?.years || [],
    loading: isLoading,
    error
  };
}
