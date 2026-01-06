import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LMSCurso, CursoFormData } from "@/types/lms";

// =====================================================
// Hooks de Administración de Cursos LMS
// =====================================================

// Obtener todos los cursos (admin)
export const useLMSAdminCursos = () => {
  return useQuery({
    queryKey: ['lms-admin-cursos'],
    queryFn: async (): Promise<LMSCurso[]> => {
      const { data, error } = await supabase
        .from('lms_cursos')
        .select('*')
        .order('orden', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin courses:', error);
        throw error;
      }
      return (data || []) as LMSCurso[];
    },
    staleTime: 30000,
  });
};

// Obtener un curso por ID con módulos y contenidos
export const useLMSAdminCursoDetalle = (cursoId: string | undefined) => {
  return useQuery({
    queryKey: ['lms-admin-curso-detalle', cursoId],
    queryFn: async () => {
      if (!cursoId) return null;

      const { data: curso, error: cursoError } = await supabase
        .from('lms_cursos')
        .select('*')
        .eq('id', cursoId)
        .single();

      if (cursoError) throw cursoError;

      const { data: modulos, error: modulosError } = await supabase
        .from('lms_modulos')
        .select(`
          *,
          contenidos:lms_contenidos(*)
        `)
        .eq('curso_id', cursoId)
        .order('orden');

      if (modulosError) throw modulosError;

      const modulosOrdenados = (modulos || []).map(modulo => ({
        ...modulo,
        contenidos: (modulo.contenidos || []).sort((a: any, b: any) => a.orden - b.orden)
      }));

      return { ...curso, modulos: modulosOrdenados };
    },
    enabled: !!cursoId,
    staleTime: 30000,
  });
};

// Crear curso
export const useLMSCrearCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CursoFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Obtener el máximo orden actual
      const { data: maxOrden } = await supabase
        .from('lms_cursos')
        .select('orden')
        .order('orden', { ascending: false })
        .limit(1)
        .single();

      const nuevoOrden = (maxOrden?.orden ?? 0) + 1;

      const { data: curso, error } = await supabase
        .from('lms_cursos')
        .insert({
          ...data,
          orden: nuevoOrden,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return curso;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-cursos'] });
      toast.success('Curso creado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error creating course:', error);
      toast.error(error.message || 'Error al crear el curso');
    },
  });
};

// Actualizar curso
export const useLMSActualizarCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CursoFormData> }) => {
      const { data: curso, error } = await supabase
        .from('lms_cursos')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return curso;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-cursos'] });
      queryClient.invalidateQueries({ queryKey: ['lms-admin-curso-detalle', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['lms-cursos-disponibles'] });
      toast.success('Curso actualizado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error updating course:', error);
      toast.error(error.message || 'Error al actualizar el curso');
    },
  });
};

// Eliminar curso (soft delete - desactiva)
export const useLMSEliminarCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cursoId: string) => {
      // Verificar si hay inscripciones activas
      const { data: inscripciones } = await supabase
        .from('lms_inscripciones')
        .select('id')
        .eq('curso_id', cursoId)
        .not('estado', 'eq', 'completado')
        .limit(1);

      if (inscripciones && inscripciones.length > 0) {
        throw new Error('No se puede eliminar: hay inscripciones activas en este curso');
      }

      const { error } = await supabase
        .from('lms_cursos')
        .update({ activo: false, publicado: false })
        .eq('id', cursoId);

      if (error) throw error;
      return cursoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-cursos'] });
      queryClient.invalidateQueries({ queryKey: ['lms-cursos-disponibles'] });
      toast.success('Curso eliminado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error deleting course:', error);
      toast.error(error.message || 'Error al eliminar el curso');
    },
  });
};

// Duplicar curso
export const useLMSDuplicarCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cursoId: string) => {
      // 1. Obtener curso original con módulos y contenidos
      const { data: original, error: fetchError } = await supabase
        .from('lms_cursos')
        .select(`
          *,
          modulos:lms_modulos(
            *,
            contenidos:lms_contenidos(*)
          )
        `)
        .eq('id', cursoId)
        .single();

      if (fetchError) throw fetchError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // 2. Crear nuevo curso
      const { id: _, modulos: originalModulos, created_at, updated_at, ...cursoData } = original;
      
      const { data: nuevoCurso, error: cursoError } = await supabase
        .from('lms_cursos')
        .insert({
          ...cursoData,
          codigo: `${cursoData.codigo}-COPIA`,
          titulo: `${cursoData.titulo} (Copia)`,
          publicado: false,
          created_by: user.id,
        })
        .select()
        .single();

      if (cursoError) throw cursoError;

      // 3. Duplicar módulos y contenidos
      for (const modulo of originalModulos || []) {
        const { id: moduloId, contenidos: originalContenidos, created_at: mc, updated_at: mu, ...moduloData } = modulo;
        
        const { data: nuevoModulo, error: moduloError } = await supabase
          .from('lms_modulos')
          .insert({
            ...moduloData,
            curso_id: nuevoCurso.id,
          })
          .select()
          .single();

        if (moduloError) throw moduloError;

        // Duplicar contenidos del módulo
        for (const contenido of originalContenidos || []) {
          const { id: contenidoId, created_at: cc, updated_at: cu, ...contenidoData } = contenido;
          
          await supabase
            .from('lms_contenidos')
            .insert({
              ...contenidoData,
              modulo_id: nuevoModulo.id,
            });
        }
      }

      return nuevoCurso;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-cursos'] });
      toast.success('Curso duplicado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error duplicating course:', error);
      toast.error(error.message || 'Error al duplicar el curso');
    },
  });
};

// Reordenar cursos
export const useLMSReordenarCursos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cursos: { id: string; orden: number }[]) => {
      const updates = cursos.map(({ id, orden }) =>
        supabase.from('lms_cursos').update({ orden }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-cursos'] });
    },
  });
};

// Toggle publicación
export const useLMSTogglePublicacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cursoId, publicado }: { cursoId: string; publicado: boolean }) => {
      const { error } = await supabase
        .from('lms_cursos')
        .update({ publicado, updated_at: new Date().toISOString() })
        .eq('id', cursoId);

      if (error) throw error;
      return { cursoId, publicado };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-cursos'] });
      queryClient.invalidateQueries({ queryKey: ['lms-cursos-disponibles'] });
      toast.success(data.publicado ? 'Curso publicado' : 'Curso despublicado');
    },
    onError: (error: any) => {
      console.error('Error toggling publication:', error);
      toast.error(error.message || 'Error al cambiar estado de publicación');
    },
  });
};
