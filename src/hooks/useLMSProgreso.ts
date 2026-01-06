import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LMSProgreso, ProgresoCalculado } from "@/types/lms";

// Helper function to award points (called internally)
const otorgarPuntos = async (accion: string, referenciaId?: string, referenciaTipo?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('lms_otorgar_puntos', {
      p_usuario_id: user.id,
      p_accion: accion,
      p_referencia_id: referenciaId || null,
      p_referencia_tipo: referenciaTipo || null
    });

    if (error) {
      console.error('Error awarding points:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error in otorgarPuntos:', err);
    return null;
  }
};

// Hook para obtener progreso del usuario en un curso
export const useLMSProgresoContenidos = (inscripcionId: string | undefined) => {
  return useQuery({
    queryKey: ['lms-progreso', inscripcionId],
    queryFn: async (): Promise<LMSProgreso[]> => {
      if (!inscripcionId) return [];

      const { data, error } = await supabase
        .from('lms_progreso')
        .select('*')
        .eq('inscripcion_id', inscripcionId);

      if (error) throw error;
      return (data || []) as LMSProgreso[];
    },
    enabled: !!inscripcionId,
    staleTime: 10000,
  });
};

// Hook para marcar contenido como completado
export const useLMSMarcarCompletado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      contenidoId, 
      datosExtra 
    }: { 
      contenidoId: string; 
      datosExtra?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc('lms_marcar_contenido_completado', {
        p_contenido_id: contenidoId,
        p_datos_extra: datosExtra || {}
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      // Award points for completing content
      const result = await otorgarPuntos('completar_contenido', variables.contenidoId, 'contenido');
      if (result?.puntos_otorgados > 0) {
        toast.success(`¡+${result.puntos_otorgados} puntos!`, {
          description: `Total: ${result.puntos_totales} puntos`
        });
      }
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['lms-progreso'] });
      queryClient.invalidateQueries({ queryKey: ['lms-inscripcion'] });
      queryClient.invalidateQueries({ queryKey: ['lms-cursos-disponibles'] });
      queryClient.invalidateQueries({ queryKey: ['lms-gamificacion'] });
    },
    onError: (error) => {
      console.error('Error marking content complete:', error);
      toast.error('Error al guardar progreso');
    },
  });
};

// Hook para actualizar posición de video
export const useLMSActualizarVideoProgreso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inscripcionId,
      contenidoId,
      posicionSeg,
      porcentajeVisto
    }: {
      inscripcionId: string;
      contenidoId: string;
      posicionSeg: number;
      porcentajeVisto: number;
    }) => {
      const { data, error } = await supabase
        .from('lms_progreso')
        .upsert({
          inscripcion_id: inscripcionId,
          contenido_id: contenidoId,
          iniciado: true,
          video_posicion_seg: posicionSeg,
          video_porcentaje_visto: porcentajeVisto,
          fecha_inicio: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'inscripcion_id,contenido_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-progreso'] });
    },
  });
};

// Hook para calcular y obtener progreso actual
export const useLMSCalcularProgreso = () => {
  return useMutation({
    mutationFn: async (inscripcionId: string): Promise<ProgresoCalculado> => {
      const { data, error } = await supabase.rpc('lms_calcular_progreso', {
        p_inscripcion_id: inscripcionId
      });

      if (error) throw error;
      return data as ProgresoCalculado;
    },
  });
};

// Helper para verificar si un contenido está completado
export const useContenidoCompletado = (
  progresos: LMSProgreso[] | undefined,
  contenidoId: string
): boolean => {
  if (!progresos) return false;
  const progreso = progresos.find(p => p.contenido_id === contenidoId);
  return progreso?.completado || false;
};
