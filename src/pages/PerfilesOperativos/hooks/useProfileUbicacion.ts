import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileUbicacion {
  direccion: string | null;
  estadoId: string | null;
  estadoNombre: string | null;
  ciudad: string | null;
  zonaBase: string | null;
}

/**
 * Hook para obtener la ubicación de un custodio operativo
 * Consulta los datos desde custodio_liberacion vinculado via pc_custodio_id
 * @param pcCustodioId - ID del pc_custodio vinculado al custodio operativo
 */
export function useProfileUbicacion(pcCustodioId: string | undefined) {
  return useQuery({
    queryKey: ['profile-ubicacion', pcCustodioId],
    queryFn: async (): Promise<ProfileUbicacion | null> => {
      if (!pcCustodioId) return null;

      // Buscar el registro de liberación por pc_custodio_id
      const { data: liberacion, error } = await supabase
        .from('custodio_liberacion')
        .select(`
          direccion_residencia,
          estado_residencia_id,
          ciudad_residencia,
          estado_residencia:estados(id, nombre)
        `)
        .eq('pc_custodio_id', pcCustodioId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile ubicacion:', error);
        return null;
      }

      if (!liberacion) return null;

      // Manejar el tipo de estado_residencia (puede ser objeto o array)
      const estadoData = Array.isArray(liberacion.estado_residencia) 
        ? liberacion.estado_residencia[0] 
        : liberacion.estado_residencia;

      return {
        direccion: liberacion.direccion_residencia,
        estadoId: liberacion.estado_residencia_id,
        estadoNombre: estadoData?.nombre || null,
        ciudad: liberacion.ciudad_residencia,
        zonaBase: estadoData?.nombre || null,
      };
    },
    enabled: !!pcCustodioId,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
}
