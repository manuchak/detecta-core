import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LMSModulo, ModuloFormData } from "@/types/lms";

// =====================================================
// Hooks de Administración de Módulos LMS
// =====================================================

// Obtener módulos de un curso
export const useLMSAdminModulos = (cursoId: string | undefined) => {
  return useQuery({
    queryKey: ['lms-admin-modulos', cursoId],
    queryFn: async (): Promise<LMSModulo[]> => {
      if (!cursoId) return [];

      const { data, error } = await supabase
        .from('lms_modulos')
        .select('*')
        .eq('curso_id', cursoId)
        .order('orden');

      if (error) {
        console.error('Error fetching modules:', error);
        throw error;
      }
      return (data || []) as LMSModulo[];
    },
    enabled: !!cursoId,
    staleTime: 30000,
  });
};

// Crear módulo
export const useLMSCrearModulo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cursoId, data }: { cursoId: string; data: ModuloFormData }) => {
      // Obtener máximo orden
      const { data: maxOrden } = await supabase
        .from('lms_modulos')
        .select('orden')
        .eq('curso_id', cursoId)
        .order('orden', { ascending: false })
        .limit(1)
        .single();

      const nuevoOrden = data.orden || (maxOrden?.orden ?? 0) + 1;

      const { data: modulo, error } = await supabase
        .from('lms_modulos')
        .insert({
          curso_id: cursoId,
          titulo: data.titulo,
          descripcion: data.descripcion,
          orden: nuevoOrden,
          activo: true,
        })
        .select()
        .single();

      if (error) throw error;
      return modulo;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-modulos', variables.cursoId] });
      queryClient.invalidateQueries({ queryKey: ['lms-admin-curso-detalle', variables.cursoId] });
      toast.success('Módulo creado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error creating module:', error);
      toast.error(error.message || 'Error al crear el módulo');
    },
  });
};

// Actualizar módulo
export const useLMSActualizarModulo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      cursoId, 
      data 
    }: { 
      id: string; 
      cursoId: string; 
      data: Partial<ModuloFormData> 
    }) => {
      const { data: modulo, error } = await supabase
        .from('lms_modulos')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { modulo, cursoId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-modulos', result.cursoId] });
      queryClient.invalidateQueries({ queryKey: ['lms-admin-curso-detalle', result.cursoId] });
      toast.success('Módulo actualizado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error updating module:', error);
      toast.error(error.message || 'Error al actualizar el módulo');
    },
  });
};

// Eliminar módulo (soft delete)
export const useLMSEliminarModulo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduloId, cursoId }: { moduloId: string; cursoId: string }) => {
      // Verificar si hay progreso en contenidos de este módulo
      const { data: contenidos } = await supabase
        .from('lms_contenidos')
        .select('id')
        .eq('modulo_id', moduloId);

      if (contenidos && contenidos.length > 0) {
        const contenidoIds = contenidos.map(c => c.id);
        
        const { data: progresos } = await supabase
          .from('lms_progreso')
          .select('id')
          .in('contenido_id', contenidoIds)
          .limit(1);

        if (progresos && progresos.length > 0) {
          // Soft delete - desactivar módulo y contenidos
          await supabase
            .from('lms_modulos')
            .update({ activo: false })
            .eq('id', moduloId);
          
          await supabase
            .from('lms_contenidos')
            .update({ activo: false })
            .eq('modulo_id', moduloId);

          return { moduloId, cursoId, softDeleted: true };
        }
      }

      // Hard delete si no hay progreso
      await supabase.from('lms_contenidos').delete().eq('modulo_id', moduloId);
      
      const { error } = await supabase
        .from('lms_modulos')
        .delete()
        .eq('id', moduloId);

      if (error) throw error;
      return { moduloId, cursoId, softDeleted: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-modulos', result.cursoId] });
      queryClient.invalidateQueries({ queryKey: ['lms-admin-curso-detalle', result.cursoId] });
      toast.success(result.softDeleted ? 'Módulo desactivado' : 'Módulo eliminado');
    },
    onError: (error: any) => {
      console.error('Error deleting module:', error);
      toast.error(error.message || 'Error al eliminar el módulo');
    },
  });
};

// Reordenar módulos
export const useLMSReordenarModulos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      cursoId, 
      modulos 
    }: { 
      cursoId: string; 
      modulos: { id: string; orden: number }[] 
    }) => {
      const updates = modulos.map(({ id, orden }) =>
        supabase.from('lms_modulos').update({ orden }).eq('id', id)
      );
      await Promise.all(updates);
      return cursoId;
    },
    onSuccess: (cursoId) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-modulos', cursoId] });
      queryClient.invalidateQueries({ queryKey: ['lms-admin-curso-detalle', cursoId] });
    },
  });
};
