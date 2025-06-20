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
      console.log('Fetching programaciones...');
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

      if (error) {
        console.error('Error fetching programaciones:', error);
        throw error;
      }
      console.log('Programaciones fetched:', data);
      return data as ProgramacionInstalacion[];
    }
  });

  // Crear nueva programación
  const createProgramacion = useMutation({
    mutationFn: async (data: CreateProgramacionData) => {
      console.log('Creating programacion with data:', data);
      
      // Validate required fields
      if (!data.servicio_id) {
        throw new Error('ID del servicio es requerido');
      }
      if (!data.tipo_instalacion) {
        throw new Error('Tipo de instalación es requerido');
      }
      if (!data.fecha_programada) {
        throw new Error('Fecha programada es requerida');
      }
      if (!data.direccion_instalacion) {
        throw new Error('Dirección de instalación es requerida');
      }
      if (!data.contacto_cliente) {
        throw new Error('Contacto del cliente es requerido');
      }
      if (!data.telefono_contacto) {
        throw new Error('Teléfono de contacto es requerido');
      }

      const insertData = {
        servicio_id: data.servicio_id,
        tipo_instalacion: data.tipo_instalacion,
        fecha_programada: data.fecha_programada,
        direccion_instalacion: data.direccion_instalacion,
        contacto_cliente: data.contacto_cliente,
        telefono_contacto: data.telefono_contacto,
        prioridad: data.prioridad || 'normal',
        tiempo_estimado: data.tiempo_estimado || 120,
        observaciones_cliente: data.observaciones_cliente || '',
        instrucciones_especiales: data.instrucciones_especiales || '',
        requiere_vehiculo_elevado: data.requiere_vehiculo_elevado || false,
        acceso_restringido: data.acceso_restringido || false,
        herramientas_especiales: data.herramientas_especiales || [],
        estado: 'programada'
      };

      console.log('Insert data:', insertData);

      const { data: result, error } = await supabase
        .from('programacion_instalaciones')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Error al crear la programación: ${error.message}`);
      }

      console.log('Programacion created successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Programacion creation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      toast({
        title: "Instalación programada",
        description: "La instalación ha sido programada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Programacion creation error:', error);
      toast({
        title: "Error al programar instalación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
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
