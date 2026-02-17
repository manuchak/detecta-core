import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getQuarter, getYear, startOfYear, endOfYear, format } from 'date-fns';
import { getCDMXYear, getCDMXMonth } from '@/utils/cdmxDateUtils';

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
      
      // Get services for last 2 years (current vs previous)
      const { data: services, error: servicesError } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita, cobro_cliente')
        .gte('fecha_hora_cita', format(startOfYear(new Date(years[years.length - 1], 0, 1)), 'yyyy-MM-dd'))
        .lte('fecha_hora_cita', format(endOfYear(new Date(years[0], 0, 1)), 'yyyy-MM-dd'))
        .not('estado', 'eq', 'Cancelado');

      if (servicesError) throw servicesError;

      // Aggregate by quarter and year
      const quarterlyData: Record<string, { servicios: number; gmv: number }> = {};
      
      // Aggregate by quarter and year - usando CDMX timezone
      (services || []).forEach(s => {
        if (!s.fecha_hora_cita) return;
        // Usar CDMX timezone para correcta atribución de trimestre
        const year = getCDMXYear(s.fecha_hora_cita);
        const month = getCDMXMonth(s.fecha_hora_cita); // 0-11
        const quarter = Math.floor(month / 3) + 1;
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
