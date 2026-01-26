import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UbicacionCandidato {
  direccion: string | null;
  estadoId: string | null;
  estadoNombre: string | null;
  ciudadId: string | null;
  ciudadNombre: string | null;
  zonaBaseCalculada: string;
  isLoading: boolean;
}

interface LeadUbicacionData {
  ubicacion?: {
    direccion?: string;
    estado_id?: string;
    ciudad_id?: string;
  };
}

/**
 * Hook para obtener la ubicación de un candidato desde los datos de entrevista en leads
 * @param candidatoId - ID del candidato en candidatos_custodios
 */
export function useCandidatoUbicacion(candidatoId: string | undefined) {
  return useQuery({
    queryKey: ['candidato-ubicacion', candidatoId],
    queryFn: async (): Promise<UbicacionCandidato> => {
      if (!candidatoId) {
        return {
          direccion: null,
          estadoId: null,
          estadoNombre: null,
          ciudadId: null,
          ciudadNombre: null,
          zonaBaseCalculada: 'Por asignar',
          isLoading: false
        };
      }

      // 1. Buscar lead vinculado al candidato
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('last_interview_data')
        .eq('candidato_custodio_id', candidatoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (leadError) {
        console.error('Error fetching lead ubicacion:', leadError);
        throw leadError;
      }

      // Si no hay lead o no tiene datos de ubicación
      if (!leadData?.last_interview_data) {
        return {
          direccion: null,
          estadoId: null,
          estadoNombre: null,
          ciudadId: null,
          ciudadNombre: null,
          zonaBaseCalculada: 'Por asignar',
          isLoading: false
        };
      }

      const interviewData = leadData.last_interview_data as LeadUbicacionData;
      const ubicacion = interviewData.ubicacion;

      if (!ubicacion) {
        return {
          direccion: null,
          estadoId: null,
          estadoNombre: null,
          ciudadId: null,
          ciudadNombre: null,
          zonaBaseCalculada: 'Por asignar',
          isLoading: false
        };
      }

      // 2. Resolver nombre del estado si existe estado_id
      let estadoNombre: string | null = null;
      if (ubicacion.estado_id) {
        const { data: estadoData } = await supabase
          .from('estados')
          .select('nombre')
          .eq('id', ubicacion.estado_id)
          .single();
        
        estadoNombre = estadoData?.nombre || null;
      }

      // 3. Resolver nombre de la ciudad si existe ciudad_id
      let ciudadNombre: string | null = null;
      if (ubicacion.ciudad_id) {
        const { data: ciudadData } = await supabase
          .from('ciudades')
          .select('nombre')
          .eq('id', ubicacion.ciudad_id)
          .single();
        
        ciudadNombre = ciudadData?.nombre || null;
      }

      return {
        direccion: ubicacion.direccion || null,
        estadoId: ubicacion.estado_id || null,
        estadoNombre,
        ciudadId: ubicacion.ciudad_id || null,
        ciudadNombre,
        zonaBaseCalculada: estadoNombre || 'Por asignar',
        isLoading: false
      };
    },
    enabled: !!candidatoId,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });
}
