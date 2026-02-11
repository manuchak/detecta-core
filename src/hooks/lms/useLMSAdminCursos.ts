import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LMSCurso, CursoFormData, TipoContenido } from "@/types/lms";

// =====================================================
// Types for complete course creation
// =====================================================

interface ContentOutlineData {
  id: string;
  titulo: string;
  tipo: 'video' | 'documento' | 'texto_enriquecido' | 'quiz' | 'interactivo';
  duracion_min: number;
  orden: number;
  contenido?: any;
}

interface ModuleOutlineData {
  id: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  contenidos: ContentOutlineData[];
}

interface AssessmentConfig {
  puntuacion_minima: number;
  intentos_permitidos: number;
  aleatorizar: boolean;
  mostrar_respuestas_correctas: boolean;
}

interface CursoCompletoData {
  curso: CursoFormData;
  modulos: ModuleOutlineData[];
  assessmentConfig?: AssessmentConfig;
}

// =====================================================
// Hooks de Administración de Cursos LMS
// =====================================================

// Obtener todos los cursos (admin) - con opción de incluir archivados
export const useLMSAdminCursos = (includeArchived = false) => {
  return useQuery({
    queryKey: ['lms-admin-cursos', { includeArchived }],
    queryFn: async (): Promise<LMSCurso[]> => {
      let query = supabase
        .from('lms_cursos')
        .select('*');

      if (!includeArchived) {
        query = query.is('archived_at', null);
      }

      const { data, error } = await query
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

// Crear curso (legacy - solo curso sin módulos)
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

// Crear curso completo con módulos y contenidos
export const useLMSCrearCursoCompleto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ curso, modulos, assessmentConfig }: CursoCompletoData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // 1. Obtener el máximo orden actual
      const { data: maxOrden } = await supabase
        .from('lms_cursos')
        .select('orden')
        .order('orden', { ascending: false })
        .limit(1)
        .single();

      const nuevoOrden = (maxOrden?.orden ?? 0) + 1;

      // 2. Crear el curso
      const { data: nuevoCurso, error: cursoError } = await supabase
        .from('lms_cursos')
        .insert({
          ...curso,
          orden: nuevoOrden,
          created_by: user.id,
        })
        .select()
        .single();

      if (cursoError) throw cursoError;

      // 3. Crear módulos y contenidos
      for (const modulo of modulos) {
        const { data: nuevoModulo, error: moduloError } = await supabase
          .from('lms_modulos')
          .insert({
            curso_id: nuevoCurso.id,
            titulo: modulo.titulo,
            descripcion: modulo.descripcion,
            orden: modulo.orden,
            activo: true,
          })
          .select()
          .single();

        if (moduloError) {
          console.error('Error creating module:', moduloError);
          continue;
        }

        // 4. Crear contenidos del módulo
        for (const contenido of modulo.contenidos) {
          const contenidoData = contenido.contenido 
            ? mergeContenidoWithAssessment(contenido.tipo, contenido.contenido, assessmentConfig)
            : getDefaultContenidoData(contenido.tipo, assessmentConfig);
          const { error: contenidoError } = await supabase
            .from('lms_contenidos')
            .insert({
              modulo_id: nuevoModulo.id,
              tipo: contenido.tipo as TipoContenido,
              titulo: contenido.titulo,
              contenido: contenidoData,
              duracion_min: contenido.duracion_min,
              es_obligatorio: true,
              orden: contenido.orden,
              activo: true,
            });

          if (contenidoError) {
            console.error('Error creating content:', contenidoError);
          }
        }
      }

      return nuevoCurso;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-cursos'] });
      toast.success('Curso creado exitosamente con su estructura');
    },
    onError: (error: any) => {
      console.error('Error creating complete course:', error);
      toast.error(error.message || 'Error al crear el curso');
    },
  });
};

// Helper to get default content data based on type
function getDefaultContenidoData(tipo: string, assessmentConfig?: AssessmentConfig): any {
  switch (tipo) {
    case 'video':
      return { url: '', provider: 'youtube' };
    case 'documento':
      return { url: '', tipo: 'pdf' };
    case 'texto_enriquecido':
      return { html: '<p>Contenido pendiente de editar</p>' };
    case 'quiz':
      return { 
        preguntas_ids: [], 
        puntuacion_minima: assessmentConfig?.puntuacion_minima ?? 70, 
        intentos_permitidos: assessmentConfig?.intentos_permitidos ?? 3, 
        mostrar_respuestas_correctas: assessmentConfig?.mostrar_respuestas_correctas ?? true,
        aleatorizar: assessmentConfig?.aleatorizar ?? false,
      };
    case 'interactivo':
      return { tipo: 'flashcards', data: { cards: [] } };
    default:
      return { html: '' };
  }
}

// Merge existing content data with assessment config for quiz types
function mergeContenidoWithAssessment(tipo: string, contenido: any, assessmentConfig?: AssessmentConfig): any {
  if (tipo === 'quiz' && assessmentConfig) {
    return {
      ...contenido,
      puntuacion_minima: assessmentConfig.puntuacion_minima,
      intentos_permitidos: assessmentConfig.intentos_permitidos,
      mostrar_respuestas_correctas: assessmentConfig.mostrar_respuestas_correctas,
      aleatorizar: assessmentConfig.aleatorizar,
    };
  }
  return contenido;
}

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

// Eliminar curso (usando RPC seguro)
export const useLMSEliminarCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cursoId: string) => {
      const { data, error } = await supabase.rpc('lms_delete_curso_secure', {
        p_curso_id: cursoId
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; inscripciones?: number };
      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar el curso');
      }
      
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

// Archivar curso (para cursos con inscripciones)
export const useLMSArchivarCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cursoId, reason }: { cursoId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('lms_archive_curso_secure', {
        p_curso_id: cursoId,
        p_reason: reason || null
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; inscripciones_preservadas?: number };
      if (!result.success) {
        throw new Error(result.error || 'Error al archivar el curso');
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-cursos'] });
      queryClient.invalidateQueries({ queryKey: ['lms-cursos-disponibles'] });
      toast.success(`Curso archivado. ${data.inscripciones_preservadas || 0} inscripciones preservadas.`);
    },
    onError: (error: any) => {
      console.error('Error archiving course:', error);
      toast.error(error.message || 'Error al archivar el curso');
    },
  });
};

// Reactivar curso archivado
export const useLMSReactivarCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cursoId: string) => {
      const { data, error } = await supabase.rpc('lms_reactivate_curso_secure', {
        p_curso_id: cursoId
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Error al reactivar el curso');
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-cursos'] });
      queryClient.invalidateQueries({ queryKey: ['lms-cursos-disponibles'] });
      toast.success(data.message || 'Curso reactivado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error reactivating course:', error);
      toast.error(error.message || 'Error al reactivar el curso');
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
