import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface PendingFolioStats {
  pendientes: number;
  total: number;
  porcentajePendiente: number;
}

export const usePendingFolioCount = () => {
  return useQuery({
    queryKey: ['pending-folio-count'],
    queryFn: async (): Promise<PendingFolioStats> => {
      // Usar format() de date-fns para evitar bug de timezone donde toISOString() convierte a UTC
      const hoy = format(new Date(), 'yyyy-MM-dd');
      
      // Contar servicios con folio temporal (UUID = 36 caracteres)
      // vs folio de Saphiro (cualquier otro formato)
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id_servicio')
        .gte('fecha_hora_cita', `${hoy}T00:00:00`)
        .lt('fecha_hora_cita', `${hoy}T23:59:59`)
        .not('estado_planeacion', 'in', '(cancelado,completado)');
      
      if (error) throw error;
      
      const servicios = data || [];
      const pendientes = servicios.filter(s => 
        s.id_servicio && s.id_servicio.length === 36
      ).length;
      
      return {
        pendientes,
        total: servicios.length,
        porcentajePendiente: servicios.length > 0 
          ? Math.round((pendientes / servicios.length) * 100) 
          : 0
      };
    },
    staleTime: 60000, // 1 minuto de cache
    refetchInterval: 60000, // Actualizar cada minuto
  });
};
