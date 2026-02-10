import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { buildCDMXTimestamp } from '@/utils/cdmxTimezone';

export interface DatosAyer {
  total: number;
  sinAsignar: number;
  asignados: number;
}

export const useServiciosAyer = () => {
  return useQuery({
    queryKey: ['servicios-ayer'],
    queryFn: async (): Promise<DatosAyer> => {
      const ayer = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const inicio = buildCDMXTimestamp(ayer, '00:00');
      const fin = buildCDMXTimestamp(ayer, '23:59');
      
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id, custodio_asignado')
        .gte('fecha_hora_cita', inicio)
        .lt('fecha_hora_cita', fin)
        .not('estado_planeacion', 'in', '(cancelado,completado)');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const sinAsignar = data?.filter(s => !s.custodio_asignado).length || 0;
      const asignados = total - sinAsignar;
      
      return { total, sinAsignar, asignados };
    },
    staleTime: 300000, // 5 min cache - datos históricos
  });
};
