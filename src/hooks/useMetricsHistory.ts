import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

interface DailyMetric {
  fecha: string;
  total: number;
  sinAsignar: number;
}

interface MetricsHistory {
  servicios: number[];
  sinAsignar: number[];
  dias: string[];
}

export function useMetricsHistory(days: number = 7) {
  return useQuery({
    queryKey: ['metrics-history', days],
    queryFn: async (): Promise<MetricsHistory> => {
      const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('fecha_hora_cita, custodio_asignado')
        .gte('fecha_hora_cita', `${startDate}T00:00:00`)
        .not('estado_planeacion', 'in', '(cancelado)');
      
      if (error) throw error;
      
      // Agrupar por día
      const dailyMap = new Map<string, DailyMetric>();
      
      // Inicializar todos los días con 0
      for (let i = days - 1; i >= 0; i--) {
        const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyMap.set(dateStr, { fecha: dateStr, total: 0, sinAsignar: 0 });
      }
      
      // Contar servicios por día
      (data || []).forEach(servicio => {
        if (!servicio.fecha_hora_cita) return;
        const dateStr = format(new Date(servicio.fecha_hora_cita), 'yyyy-MM-dd');
        const entry = dailyMap.get(dateStr);
        if (entry) {
          entry.total++;
          if (!servicio.custodio_asignado) {
            entry.sinAsignar++;
          }
        }
      });
      
      // Convertir a arrays ordenados
      const sortedEntries = Array.from(dailyMap.values())
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
      
      return {
        servicios: sortedEntries.map(e => e.total),
        sinAsignar: sortedEntries.map(e => e.sinAsignar),
        dias: sortedEntries.map(e => format(new Date(e.fecha), 'EEE'))
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000,
  });
}
