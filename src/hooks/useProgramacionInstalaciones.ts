
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProgramacionInstalacion, CreateProgramacionData } from '@/types/instaladores';

export const useProgramacionInstalaciones = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener todas las programaciones
  const { data: programaciones, isLoading } = useQuery({
    queryKey: ['programacion-instalaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .select(`
          *,
          instalador:instaladores(*),
          servicio:servicios_monitoreo(numero_servicio, nombre_cliente),
          activo:activos_monitoreo(*)
        `)
        .order('fecha_programada', { ascending: true });

      if (error) throw error;
      return data as ProgramacionInstalacion[];
    }
  });

  // Obtener programaciones por estado
  const getProgramacionesPorEstado = (estado: string) => {
    return useQuery({
      queryKey: ['programacion-instalaciones', estado],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('programacion_instalaciones')
          .select(`
            *,
            instalador:instaladores(*),
            servicio:servicios_monitoreo(numero_servicio, nombre_cliente),
            activo:activos_monitoreo(*)
          `)
          .eq('estado', estado)
          .order('fecha_programada', { ascending: true });

        if (error) throw error;
        return data as ProgramacionInstalacion[];
      }
    });
  };

  // Crear nueva programación
  const createProgramacion = useMutation({
    mutationFn: async (data: CreateProgramacionData) => {
      const { data: result, error } = await supabase
        .from('programacion_instalaciones')
        .insert([data])
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
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo programar la instalación.",
        variant: "destructive",
      });
      console.error('Error creating installation schedule:', error);
    }
  });

  // Asignar instalador
  const asignarInstalador = useMutation({
    mutationFn: async ({ id, instaladorId }: { id: string; instaladorId: string }) => {
      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .update({ 
          instalador_id: instaladorId,
          estado: 'confirmada'
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
        description: "El instalador ha sido asignado exitosamente.",
      });
    }
  });

  // Actualizar estado de instalación
  const updateEstadoInstalacion = useMutation({
    mutationFn: async ({ id, estado, observaciones }: { id: string; estado: string; observaciones?: string }) => {
      const updateData: any = { estado };
      if (observaciones) updateData.observaciones_cliente = observaciones;

      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la instalación ha sido actualizado.",
      });
    }
  });

  return {
    programaciones,
    isLoading,
    createProgramacion,
    asignarInstalador,
    updateEstadoInstalacion,
    getProgramacionesPorEstado
  };
};
