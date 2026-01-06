import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CursoDisponible, LMSCurso, LMSModulo, LMSContenido, ResultadoInscripcion } from "@/types/lms";

// Hook para obtener cursos disponibles del usuario
export const useLMSCursosDisponibles = () => {
  return useQuery({
    queryKey: ['lms-cursos-disponibles'],
    queryFn: async (): Promise<CursoDisponible[]> => {
      const { data, error } = await supabase.rpc('lms_get_cursos_disponibles');
      
      if (error) {
        console.error('Error fetching LMS courses:', error);
        throw error;
      }
      
      return (data || []) as CursoDisponible[];
    },
    staleTime: 30000,
  });
};

// Hook para obtener detalle de un curso con módulos y contenidos
export const useLMSCursoDetalle = (cursoId: string | undefined) => {
  return useQuery({
    queryKey: ['lms-curso-detalle', cursoId],
    queryFn: async () => {
      if (!cursoId) return null;

      // Obtener curso
      const { data: curso, error: cursoError } = await supabase
        .from('lms_cursos')
        .select('*')
        .eq('id', cursoId)
        .single();

      if (cursoError) throw cursoError;

      // Obtener módulos con contenidos
      const { data: modulos, error: modulosError } = await supabase
        .from('lms_modulos')
        .select(`
          *,
          contenidos:lms_contenidos(*)
        `)
        .eq('curso_id', cursoId)
        .eq('activo', true)
        .order('orden');

      if (modulosError) throw modulosError;

      // Ordenar contenidos dentro de cada módulo
      const modulosOrdenados = (modulos || []).map(modulo => ({
        ...modulo,
        contenidos: (modulo.contenidos || [])
          .filter((c: any) => c.activo)
          .sort((a: any, b: any) => a.orden - b.orden)
      }));

      return {
        ...curso,
        modulos: modulosOrdenados
      } as LMSCurso & { modulos: (LMSModulo & { contenidos: LMSContenido[] })[] };
    },
    enabled: !!cursoId,
    staleTime: 60000,
  });
};

// Hook para inscribirse a un curso
export const useLMSInscribirse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cursoId: string): Promise<ResultadoInscripcion> => {
      const { data, error } = await supabase.rpc('lms_inscribirse_curso', {
        p_curso_id: cursoId
      });

      if (error) throw error;
      return data as ResultadoInscripcion;
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['lms-cursos-disponibles'] });
        queryClient.invalidateQueries({ queryKey: ['lms-inscripciones'] });
        toast.success('¡Te has inscrito al curso exitosamente!');
      } else {
        toast.error(data.error || 'Error al inscribirse');
      }
    },
    onError: (error) => {
      console.error('Error enrolling:', error);
      toast.error('Error al inscribirse al curso');
    },
  });
};

// Hook para obtener inscripción del usuario en un curso específico
export const useLMSInscripcion = (cursoId: string | undefined) => {
  return useQuery({
    queryKey: ['lms-inscripcion', cursoId],
    queryFn: async () => {
      if (!cursoId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('lms_inscripciones')
        .select('*')
        .eq('curso_id', cursoId)
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!cursoId,
  });
};

// Hook para admin: obtener todos los cursos (incluye no publicados)
export const useLMSCursosAdmin = () => {
  return useQuery({
    queryKey: ['lms-cursos-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lms_cursos')
        .select('*')
        .order('orden')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LMSCurso[];
    },
    staleTime: 30000,
  });
};
