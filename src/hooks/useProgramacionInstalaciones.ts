
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProgramacionInstalacion, CreateProgramacionData } from '@/types/instaladores';

export const useProgramacionInstalaciones = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener programaciones de instalación (versión simplificada)
  const { data: programaciones, isLoading, error } = useQuery({
    queryKey: ['programacion-instalaciones'],
    queryFn: async () => {
      console.log('Fetching programaciones...');
      
      try {
        // Consulta con JOIN para incluir información del instalador
        const { data: programacionesData, error: programacionesError } = await supabase
          .from('programacion_instalaciones')
          .select(`
            id,
            servicio_id,
            tipo_instalacion,
            fecha_programada,
            estado,
            contacto_cliente,
            telefono_contacto,
            direccion_instalacion,
            tiempo_estimado,
            observaciones_cliente,
            prioridad,
            herramientas_especiales,
            requiere_vehiculo_elevado,
            acceso_restringido,
            instalador_id,
            created_at,
            updated_at,
            instaladores (
              id,
              nombre_completo,
              telefono,
              calificacion_promedio,
              especialidades
            )
          `)
          .order('fecha_programada', { ascending: true });

        if (programacionesError) {
          console.error('Error fetching programaciones:', programacionesError);
          throw programacionesError;
        }

        console.log('Programaciones fetched successfully:', programacionesData?.length || 0);
        
        // Mapear los datos incluyendo la información del instalador
        return (programacionesData || []).map(programacion => ({
          id: programacion.id,
          servicio_id: programacion.servicio_id,
          tipo_instalacion: programacion.tipo_instalacion,
          fecha_programada: programacion.fecha_programada,
          estado: programacion.estado,
          contacto_cliente: programacion.contacto_cliente,
          telefono_contacto: programacion.telefono_contacto,
          direccion_instalacion: programacion.direccion_instalacion,
          tiempo_estimado: programacion.tiempo_estimado,
          observaciones_cliente: programacion.observaciones_cliente,
          prioridad: programacion.prioridad || 'normal',
          herramientas_especiales: programacion.herramientas_especiales || [],
          requiere_vehiculo_elevado: programacion.requiere_vehiculo_elevado || false,
          acceso_restringido: programacion.acceso_restringido || false,
          instalador_id: programacion.instalador_id,
          created_at: programacion.created_at,
          updated_at: programacion.updated_at,
          servicio: null, // Temporalmente null
          instalador: programacion.instaladores ? {
            id: programacion.instaladores.id,
            nombre_completo: programacion.instaladores.nombre_completo,
            telefono: programacion.instaladores.telefono,
            calificacion_promedio: programacion.instaladores.calificacion_promedio,
            especialidades: programacion.instaladores.especialidades
          } : null
        })) as ProgramacionInstalacion[];
        
      } catch (error) {
        console.error('Error in programaciones queryFn:', error);
        // En caso de error, retornar un array vacío
        return [] as ProgramacionInstalacion[];
      }
    },
    // Configuración más agresiva para debugging
    retry: 0, // No reintentar por ahora
    staleTime: 0, // Siempre fresh
    refetchOnWindowFocus: true
  });

  // Mapeo de estados de instalación a estados de servicio
  const getServicioEstadoFromInstalacion = (estadoInstalacion: string) => {
    const estadoMap = {
      'programada': 'instalacion_programada',
      'confirmada': 'instalacion_programada', 
      'en_proceso': 'instalacion_en_proceso',
      'completada': 'instalacion_completada',
      'cancelada': 'programacion_instalacion' // Vuelve a programación si se cancela
    };
    return estadoMap[estadoInstalacion as keyof typeof estadoMap] || 'programacion_instalacion';
  };

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

      // Crear la programación con manejo específico de errores
      const { data: result, error } = await supabase
        .from('programacion_instalaciones')
        .insert(insertData)
        .select('id, servicio_id, tipo_instalacion, fecha_programada, estado, contacto_cliente, telefono_contacto, direccion_instalacion')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Error al crear la programación: ${error.message}`);
      }

      // Actualizar el estado del servicio a 'instalacion_programada'
      const { error: servicioError } = await supabase
        .from('servicios_monitoreo')
        .update({ estado_general: 'instalacion_programada' })
        .eq('id', data.servicio_id);

      if (servicioError) {
        console.error('Error updating service status:', servicioError);
        // No lanzamos error aquí para no fallar la creación de la programación
      }

      console.log('Programacion created successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Programacion creation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
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

  // Actualizar estado de instalación y servicio automáticamente
  const updateEstadoInstalacion = useMutation({
    mutationFn: async ({ id, estado, observaciones }: { 
      id: string; 
      estado: string; 
      observaciones?: string; 
    }) => {
      console.log(`Updating installation ${id} to state: ${estado}`);
      
      // Primero obtener la programación para conocer el servicio_id
      const { data: programacion, error: fetchError } = await supabase
        .from('programacion_instalaciones')
        .select('servicio_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching programacion:', fetchError);
        throw fetchError;
      }

      // Actualizar el estado de la instalación
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

      if (error) {
        console.error('Error updating installation:', error);
        throw error;
      }

      // Actualizar automáticamente el estado del servicio
      const nuevoEstadoServicio = getServicioEstadoFromInstalacion(estado);
      console.log(`Updating service ${programacion.servicio_id} to state: ${nuevoEstadoServicio}`);
      
      const { error: servicioError } = await supabase
        .from('servicios_monitoreo')
        .update({ 
          estado_general: nuevoEstadoServicio,
          updated_at: new Date().toISOString()
        })
        .eq('id', programacion.servicio_id);

      if (servicioError) {
        console.error('Error updating service status:', servicioError);
        // No lanzamos error para no fallar la actualización de la instalación
      } else {
        console.log(`Service ${programacion.servicio_id} updated to ${nuevoEstadoServicio}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      
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
    },
    onError: (error) => {
      console.error('Error updating installation status:', error);
      toast({
        title: "Error al actualizar estado",
        description: "No se pudo actualizar el estado de la instalación",
        variant: "destructive",
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
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
    }
  });

  // Actualizar programación completa
  const updateProgramacion = useMutation({
    mutationFn: async (data: any) => {
      const updateData: any = {
        direccion_instalacion: data.direccion_instalacion,
        contacto_cliente: data.contacto_cliente,
        telefono_contacto: data.telefono_contacto,
        observaciones_cliente: data.observaciones_cliente,
        tiempo_estimado: data.tiempo_estimado,
        updated_at: new Date().toISOString()
      };

      // Solo agregar campos si están presentes
      if (data.fecha_programada) {
        updateData.fecha_programada = data.fecha_programada;
      }
      if (data.instalador_id) {
        updateData.instalador_id = data.instalador_id;
      }

      const { data: result, error } = await supabase
        .from('programacion_instalaciones')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      toast({
        title: "Programación actualizada",
        description: "Los datos de la instalación han sido actualizados correctamente.",
      });
    }
  });

  return {
    programaciones,
    isLoading,
    error,
    createProgramacion,
    updateEstadoInstalacion,
    updateProgramacion,
    asignarInstalador,
    desasignarInstalador
  };
};
