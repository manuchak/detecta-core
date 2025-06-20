
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProgramacionInstalacion, CreateProgramacionData } from '@/types/instaladores';

export const useProgramacionInstalaciones = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener programaciones de instalación
  const { data: programaciones, isLoading, error } = useQuery({
    queryKey: ['programacion-instalaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .select(`
          *,
          instalador:instaladores(
            id,
            nombre_completo,
            telefono,
            calificacion_promedio
          ),
          servicio:servicios_monitoreo(
            id,
            numero_servicio,
            nombre_cliente
          )
        `)
        .order('fecha_programada', { ascending: true });

      if (error) throw error;
      return data as ProgramacionInstalacion[];
    }
  });

  // Crear nueva programación
  const createProgramacion = useMutation({
    mutationFn: async (data: CreateProgramacionData) => {
      const { data: result, error } = await supabase
        .from('programacion_instalaciones')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      toast({
        title: "Instalación programada",
        description: "La instalación ha sido programada exitosamente.",
      });
    }
  });

  // Actualizar estado de instalación
  const updateEstadoInstalacion = useMutation({
    mutationFn: async ({ id, estado, observaciones }: { 
      id: string; 
      estado: string; 
      observaciones?: string; 
    }) => {
      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .update({ 
          estado, 
          observaciones_cliente: observaciones,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      
      const mensajes = {
        'confirmada': 'Instalación confirmada correctamente',
        'en_proceso': 'Instalación iniciada',
        'completada': 'Instalación completada exitosamente',
        'cancelada': 'Instalación cancelada'
      };
      
      toast({
        title: "Estado actualizado",
        description: mensajes[variables.estado as keyof typeof mensajes] || 'Estado actualizado',
      });
    }
  });

  // Asignar instalador
  const asignarInstalador = useMutation({
    mutationFn: async ({ id, instaladorId }: { id: string; instaladorId: string }) => {
      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .update({ 
          instalador_id: instaladorId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      toast({
        title: "Instalador asignado",
        description: "El instalador ha sido asignado correctamente.",
      });
    }
  });

  // Desasignar instalador
  const desasignarInstalador = useMutation({
    mutationFn: async (instalacionId: string) => {
      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .update({ 
          instalador_id: null,
          estado: 'programada',
          updated_at: new Date().toISOString()
        })
        .eq('id', instalacionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
    }
  });

  return {
    programaciones,
    isLoading,
    error,
    createProgramacion,
    updateEstadoInstalacion,
    asignarInstalador,
    desasignarInstalador
  };
};
