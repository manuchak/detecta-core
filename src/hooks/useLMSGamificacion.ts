import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GamificacionPerfil {
  puntos_totales: number;
  nivel: number;
  racha_actual: number;
  racha_maxima: number;
  cursos_completados: number;
  quizzes_perfectos: number;
}

export interface Badge {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  categoria: string;
  fecha_obtencion?: string;
}

export interface GamificacionData {
  perfil: GamificacionPerfil;
  badges: Badge[];
}

// Hook para obtener perfil de gamificación del usuario
export const useLMSGamificacion = () => {
  return useQuery({
    queryKey: ['lms-gamificacion'],
    queryFn: async (): Promise<GamificacionData | null> => {
      const { data, error } = await supabase.rpc('lms_get_gamificacion_perfil');
      
      if (error) {
        console.error('Error fetching gamification:', error);
        throw error;
      }
      
      if (data?.error) {
        return null;
      }
      
      return data as GamificacionData;
    },
    staleTime: 30000,
  });
};

// Hook para obtener todos los badges disponibles
export const useLMSBadgesDisponibles = () => {
  return useQuery({
    queryKey: ['lms-badges-disponibles'],
    queryFn: async (): Promise<Badge[]> => {
      const { data, error } = await supabase
        .from('lms_badges')
        .select('*')
        .eq('activo', true)
        .order('orden');
      
      if (error) throw error;
      return (data || []) as Badge[];
    },
    staleTime: 60000,
  });
};

// Hook para obtener historial de puntos
export const useLMSPuntosHistorial = () => {
  return useQuery({
    queryKey: ['lms-puntos-historial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lms_puntos_historial')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });
};

// Helper function to award points (used by other hooks)
export const otorgarPuntosHelper = async (
  accion: string, 
  referenciaId?: string, 
  referenciaTipo?: string
) => {
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
    console.error('Error in otorgarPuntosHelper:', err);
    return null;
  }
};

// Hook para otorgar puntos (usado internamente)
export const useLMSOtorgarPuntos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      accion, 
      referenciaId, 
      referenciaTipo 
    }: { 
      accion: string; 
      referenciaId?: string; 
      referenciaTipo?: string;
    }) => {
      const result = await otorgarPuntosHelper(accion, referenciaId, referenciaTipo);
      if (!result) throw new Error('Error al otorgar puntos');
      return result;
    },
    onSuccess: (data: any) => {
      if (data?.success && data?.puntos_otorgados > 0) {
        toast.success(`¡+${data.puntos_otorgados} puntos!`, {
          description: `Total: ${data.puntos_totales} puntos`
        });
      }
      queryClient.invalidateQueries({ queryKey: ['lms-gamificacion'] });
      queryClient.invalidateQueries({ queryKey: ['lms-puntos-historial'] });
    },
  });
};

// Calcular nivel basado en puntos
export const calcularNivel = (puntos: number): number => {
  if (puntos < 100) return 1;
  if (puntos < 300) return 2;
  if (puntos < 600) return 3;
  if (puntos < 1000) return 4;
  if (puntos < 1500) return 5;
  if (puntos < 2500) return 6;
  if (puntos < 4000) return 7;
  if (puntos < 6000) return 8;
  if (puntos < 9000) return 9;
  return 10;
};

// Puntos necesarios para el siguiente nivel
export const puntosParaSiguienteNivel = (nivelActual: number): number => {
  const niveles = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, Infinity];
  return niveles[nivelActual] || Infinity;
};
