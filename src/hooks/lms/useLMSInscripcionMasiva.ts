import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InscripcionMasivaParams {
  cursoId: string;
  roles: string[];
  tipoInscripcion?: string;
  plazoDias?: number;
}

interface InscripcionMasivaResult {
  success: boolean;
  inscritos: number;
  ya_inscritos: number;
  total_procesados: number;
  error?: string;
}

interface ConteoUsuariosResult {
  total_usuarios: number;
  ya_inscritos: number;
  pendientes_inscribir: number;
}

// Hook para inscripción masiva por roles
export const useLMSInscripcionMasiva = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      cursoId, 
      roles, 
      tipoInscripcion = 'asignada',
      plazoDias 
    }: InscripcionMasivaParams): Promise<InscripcionMasivaResult> => {
      const { data, error } = await supabase.rpc(
        'lms_inscribir_usuarios_por_rol',
        { 
          p_curso_id: cursoId, 
          p_roles: roles,
          p_tipo_inscripcion: tipoInscripcion,
          p_plazo_dias: plazoDias || null
        }
      );
      
      if (error) throw error;
      return data as InscripcionMasivaResult;
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['lms-inscripciones'] });
        queryClient.invalidateQueries({ queryKey: ['lms-admin-inscripciones'] });
        toast.success(`${data.inscritos} usuario(s) inscrito(s) exitosamente`);
      } else {
        toast.error(data.error || 'Error al inscribir usuarios');
      }
    },
    onError: (error) => {
      console.error('Error en inscripción masiva:', error);
      toast.error('Error al realizar la inscripción masiva');
    },
  });
};

// Hook para contar usuarios antes de inscribir (preview)
export const useLMSContarUsuariosPorRol = (cursoId: string | undefined, roles: string[]) => {
  return useQuery({
    queryKey: ['lms-contar-usuarios', cursoId, roles],
    queryFn: async (): Promise<ConteoUsuariosResult> => {
      if (!cursoId || roles.length === 0) {
        return { total_usuarios: 0, ya_inscritos: 0, pendientes_inscribir: 0 };
      }
      
      const { data, error } = await supabase.rpc(
        'lms_contar_usuarios_por_rol',
        { 
          p_curso_id: cursoId, 
          p_roles: roles 
        }
      );
      
      if (error) throw error;
      return data as ConteoUsuariosResult;
    },
    enabled: !!cursoId && roles.length > 0,
    staleTime: 10000, // Cache for 10 seconds
  });
};

// Hook para obtener estado de onboarding del usuario actual
export const useLMSOnboardingStatus = () => {
  return useQuery({
    queryKey: ['lms-onboarding-status'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('lms_get_onboarding_status');
      
      if (error) throw error;
      return data as {
        total_obligatorios: number;
        completados: number;
        en_progreso: number;
        pendientes: number;
        vencidos: number;
        porcentaje_completado: number;
        cursos: Array<{
          inscripcion_id: string;
          curso_id: string;
          titulo: string;
          nivel: string;
          duracion_estimada_min: number;
          estado: string;
          progreso_porcentaje: number;
          fecha_inscripcion: string;
          fecha_limite: string | null;
          dias_restantes: number | null;
        }>;
      };
    },
    staleTime: 30000,
  });
};
