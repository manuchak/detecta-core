import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PendingFolioStats {
  pendientes: number;
  total: number;
  porcentajePendiente: number;
}

export const usePendingFolioCount = () => {
  return useQuery({
    queryKey: ['pending-folio-count'],
    queryFn: async (): Promise<PendingFolioStats> => {
      // Contar servicios con folio temporal (UUID = 36 caracteres)
      // vs folio de Saphiro (cualquier otro formato)
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id_servicio')
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
