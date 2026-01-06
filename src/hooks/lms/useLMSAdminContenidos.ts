import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TipoContenido } from "@/types/lms";

// =====================================================
// Hooks de Administración de Contenidos LMS
// =====================================================

// Obtener contenidos de un módulo
export const useLMSAdminContenidos = (moduloId: string | undefined) => {
  return useQuery({
    queryKey: ['lms-admin-contenidos', moduloId],
    queryFn: async () => {
      if (!moduloId) return [];

      const { data, error } = await supabase
        .from('lms_contenidos')
        .select('*')
        .eq('modulo_id', moduloId)
        .order('orden');

      if (error) {
        console.error('Error fetching contents:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!moduloId,
    staleTime: 30000,
  });
};

// Crear contenido
export const useLMSCrearContenido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      moduloId, 
      cursoId,
      data 
    }: { 
      moduloId: string; 
      cursoId: string;
      data: any;
    }) => {
      // Obtener máximo orden
      const { data: maxOrden } = await supabase
        .from('lms_contenidos')
        .select('orden')
        .eq('modulo_id', moduloId)
        .order('orden', { ascending: false })
        .limit(1)
        .single();

      const nuevoOrden = data.orden || (maxOrden?.orden ?? 0) + 1;

      const { data: contenido, error } = await supabase
        .from('lms_contenidos')
        .insert({
          modulo_id: moduloId,
          titulo: data.titulo,
          tipo: (data.tipo as TipoContenido) || 'texto_enriquecido',
          contenido: data.contenido || { html: '' },
          duracion_min: data.duracion_min || 10,
          es_obligatorio: data.es_obligatorio ?? true,
          orden: nuevoOrden,
          activo: data.activo ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return { contenido, cursoId };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-contenidos', variables.moduloId] });
      queryClient.invalidateQueries({ queryKey: ['lms-admin-curso-detalle', variables.cursoId] });
      toast.success('Contenido creado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error creating content:', error);
      toast.error(error.message || 'Error al crear el contenido');
    },
  });
};

// Actualizar contenido
export const useLMSActualizarContenido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      moduloId,
      cursoId, 
      data 
    }: { 
      id: string; 
      moduloId: string;
      cursoId: string; 
      data: any;
    }) => {
      const { data: contenido, error } = await supabase
        .from('lms_contenidos')
        .update({
          titulo: data.titulo,
          tipo: data.tipo,
          contenido: data.contenido,
          duracion_min: data.duracion_min,
          es_obligatorio: data.es_obligatorio,
          orden: data.orden,
          activo: data.activo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { contenido, moduloId, cursoId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-contenidos', result.moduloId] });
      queryClient.invalidateQueries({ queryKey: ['lms-admin-curso-detalle', result.cursoId] });
      toast.success('Contenido actualizado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error updating content:', error);
      toast.error(error.message || 'Error al actualizar el contenido');
    },
  });
};

// Eliminar contenido
export const useLMSEliminarContenido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      contenidoId, 
      moduloId, 
      cursoId 
    }: { 
      contenidoId: string; 
      moduloId: string; 
      cursoId: string 
    }) => {
      // Verificar si hay progreso en este contenido
      const { data: progresos } = await supabase
        .from('lms_progreso')
        .select('id')
        .eq('contenido_id', contenidoId)
        .limit(1);

      if (progresos && progresos.length > 0) {
        // Soft delete
        await supabase
          .from('lms_contenidos')
          .update({ activo: false })
          .eq('id', contenidoId);

        return { contenidoId, moduloId, cursoId, softDeleted: true };
      }

      // Hard delete
      const { error } = await supabase
        .from('lms_contenidos')
        .delete()
        .eq('id', contenidoId);

      if (error) throw error;
      return { contenidoId, moduloId, cursoId, softDeleted: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-contenidos', result.moduloId] });
      queryClient.invalidateQueries({ queryKey: ['lms-admin-curso-detalle', result.cursoId] });
      toast.success(result.softDeleted ? 'Contenido desactivado' : 'Contenido eliminado');
    },
    onError: (error: any) => {
      console.error('Error deleting content:', error);
      toast.error(error.message || 'Error al eliminar el contenido');
    },
  });
};

// Reordenar contenidos
export const useLMSReordenarContenidos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      moduloId,
      cursoId, 
      contenidos 
    }: { 
      moduloId: string;
      cursoId: string; 
      contenidos: { id: string; orden: number }[] 
    }) => {
      const updates = contenidos.map(({ id, orden }) =>
        supabase.from('lms_contenidos').update({ orden }).eq('id', id)
      );
      await Promise.all(updates);
      return { moduloId, cursoId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-contenidos', result.moduloId] });
      queryClient.invalidateQueries({ queryKey: ['lms-admin-curso-detalle', result.cursoId] });
    },
  });
};

// Mover contenido a otro módulo
export const useLMSMoverContenido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      contenidoId, 
      moduloOrigenId,
      moduloDestinoId,
      cursoId 
    }: { 
      contenidoId: string; 
      moduloOrigenId: string;
      moduloDestinoId: string;
      cursoId: string 
    }) => {
      // Obtener máximo orden en módulo destino
      const { data: maxOrden } = await supabase
        .from('lms_contenidos')
        .select('orden')
        .eq('modulo_id', moduloDestinoId)
        .order('orden', { ascending: false })
        .limit(1)
        .single();

      const nuevoOrden = (maxOrden?.orden ?? 0) + 1;

      const { error } = await supabase
        .from('lms_contenidos')
        .update({ 
          modulo_id: moduloDestinoId, 
          orden: nuevoOrden 
        })
        .eq('id', contenidoId);

      if (error) throw error;
      return { moduloOrigenId, moduloDestinoId, cursoId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-contenidos', result.moduloOrigenId] });
      queryClient.invalidateQueries({ queryKey: ['lms-admin-contenidos', result.moduloDestinoId] });
      queryClient.invalidateQueries({ queryKey: ['lms-admin-curso-detalle', result.cursoId] });
      toast.success('Contenido movido exitosamente');
    },
    onError: (error: any) => {
      console.error('Error moving content:', error);
      toast.error(error.message || 'Error al mover el contenido');
    },
  });
};
