import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EstadoInscripcion } from "@/types/lms";

// =====================================================
// Hooks de Administración de Inscripciones LMS
// =====================================================

export interface InscripcionConUsuario {
  id: string;
  usuario_id: string;
  curso_id: string;
  tipo_inscripcion: string;
  estado: EstadoInscripcion;
  progreso_porcentaje: number;
  fecha_inscripcion: string;
  fecha_limite?: string;
  calificacion_final?: number;
  usuario?: {
    id: string;
    email: string;
    display_name?: string;
  };
  curso?: {
    id: string;
    titulo: string;
    codigo: string;
  };
}

// Obtener todas las inscripciones (con filtros opcionales)
export const useLMSAdminInscripciones = (filtros?: {
  cursoId?: string;
  estado?: EstadoInscripcion;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['lms-admin-inscripciones', filtros],
    queryFn: async (): Promise<InscripcionConUsuario[]> => {
      let query = supabase
        .from('lms_inscripciones')
        .select(`
          *,
          curso:lms_cursos(id, titulo, codigo)
        `)
        .order('fecha_inscripcion', { ascending: false });

      if (filtros?.cursoId) {
        query = query.eq('curso_id', filtros.cursoId);
      }
      if (filtros?.estado) {
        query = query.eq('estado', filtros.estado);
      }
      if (filtros?.limit) {
        query = query.limit(filtros.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching inscripciones:', error);
        throw error;
      }

      // Obtener datos de usuarios
      const usuarioIds = [...new Set((data || []).map(i => i.usuario_id))];
      
      if (usuarioIds.length > 0) {
        const { data: usuarios } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .in('id', usuarioIds);

        const usuariosMap = new Map((usuarios || []).map(u => [u.id, u]));

        return (data || []).map(inscripcion => ({
          ...inscripcion,
          usuario: usuariosMap.get(inscripcion.usuario_id),
        })) as InscripcionConUsuario[];
      }

      return (data || []) as InscripcionConUsuario[];
    },
    staleTime: 30000,
  });
};

// Inscribir usuarios a un curso
export const useLMSInscribirUsuarios = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      cursoId, 
      usuarioIds, 
      tipoInscripcion = 'asignada',
      fechaLimite 
    }: { 
      cursoId: string; 
      usuarioIds: string[];
      tipoInscripcion?: 'obligatoria' | 'voluntaria' | 'asignada';
      fechaLimite?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const inscripciones = usuarioIds.map(usuarioId => ({
        curso_id: cursoId,
        usuario_id: usuarioId,
        tipo_inscripcion: tipoInscripcion,
        asignado_por: user.id,
        fecha_limite: fechaLimite,
        estado: 'inscrito' as const,
        progreso_porcentaje: 0,
        certificado_generado: false,
      }));

      const { data, error } = await supabase
        .from('lms_inscripciones')
        .upsert(inscripciones, { 
          onConflict: 'usuario_id,curso_id',
          ignoreDuplicates: true 
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-inscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['lms-cursos-disponibles'] });
      toast.success(`${data?.length || 0} usuario(s) inscrito(s) exitosamente`);
    },
    onError: (error: any) => {
      console.error('Error enrolling users:', error);
      toast.error(error.message || 'Error al inscribir usuarios');
    },
  });
};

// Actualizar estado de inscripción
export const useLMSActualizarInscripcion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      inscripcionId, 
      data 
    }: { 
      inscripcionId: string; 
      data: {
        estado?: EstadoInscripcion;
        fecha_limite?: string;
        calificacion_final?: number;
      }
    }) => {
      const { data: inscripcion, error } = await supabase
        .from('lms_inscripciones')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inscripcionId)
        .select()
        .single();

      if (error) throw error;
      return inscripcion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-inscripciones'] });
      toast.success('Inscripción actualizada');
    },
    onError: (error: any) => {
      console.error('Error updating inscription:', error);
      toast.error(error.message || 'Error al actualizar inscripción');
    },
  });
};

// Eliminar inscripción
export const useLMSEliminarInscripcion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inscripcionId: string) => {
      // Primero eliminar progreso asociado
      await supabase
        .from('lms_progreso')
        .delete()
        .eq('inscripcion_id', inscripcionId);

      const { error } = await supabase
        .from('lms_inscripciones')
        .delete()
        .eq('id', inscripcionId);

      if (error) throw error;
      return inscripcionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-inscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['lms-cursos-disponibles'] });
      toast.success('Inscripción eliminada');
    },
    onError: (error: any) => {
      console.error('Error deleting inscription:', error);
      toast.error(error.message || 'Error al eliminar inscripción');
    },
  });
};

// Obtener usuarios disponibles para inscribir (no inscritos en el curso)
export const useLMSUsuariosDisponibles = (cursoId: string | undefined) => {
  return useQuery({
    queryKey: ['lms-usuarios-disponibles', cursoId],
    queryFn: async () => {
      if (!cursoId) return [];

      // Obtener usuarios ya inscritos
      const { data: inscripcionesExistentes } = await supabase
        .from('lms_inscripciones')
        .select('usuario_id')
        .eq('curso_id', cursoId);

      const usuariosInscritos = new Set((inscripcionesExistentes || []).map(i => i.usuario_id));

      // Obtener todos los usuarios activos
      const { data: usuarios, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, role')
        .order('display_name');

      if (error) throw error;

      // Filtrar usuarios no inscritos
      return (usuarios || []).filter(u => !usuariosInscritos.has(u.id));
    },
    enabled: !!cursoId,
    staleTime: 30000,
  });
};

// Estadísticas de inscripciones por curso
export const useLMSEstadisticasCurso = (cursoId: string | undefined) => {
  return useQuery({
    queryKey: ['lms-estadisticas-curso', cursoId],
    queryFn: async () => {
      if (!cursoId) return null;

      const { data: inscripciones, error } = await supabase
        .from('lms_inscripciones')
        .select('estado, progreso_porcentaje, calificacion_final')
        .eq('curso_id', cursoId);

      if (error) throw error;

      const total = inscripciones?.length || 0;
      const porEstado = inscripciones?.reduce((acc, i) => {
        acc[i.estado] = (acc[i.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const progresoPromedio = total > 0
        ? Math.round(inscripciones!.reduce((sum, i) => sum + (i.progreso_porcentaje || 0), 0) / total)
        : 0;

      const calificacionPromedio = inscripciones?.filter(i => i.calificacion_final != null).length || 0 > 0
        ? Math.round(
            inscripciones!
              .filter(i => i.calificacion_final != null)
              .reduce((sum, i) => sum + (i.calificacion_final || 0), 0) /
            inscripciones!.filter(i => i.calificacion_final != null).length
          )
        : 0;

      return {
        total,
        porEstado,
        progresoPromedio,
        calificacionPromedio,
        completados: porEstado['completado'] || 0,
        enProgreso: porEstado['en_progreso'] || 0,
        inscritos: porEstado['inscrito'] || 0,
        vencidos: porEstado['vencido'] || 0,
      };
    },
    enabled: !!cursoId,
    staleTime: 60000,
  });
};
