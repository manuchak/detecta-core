import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAprobacionesWorkflow = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener servicios pendientes por etapa
  const { data: serviciosPorEtapa, isLoading } = useQuery({
    queryKey: ['servicios-workflow'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .select(`
          *,
          analisis_riesgo(*),
          documentacion_requerida(*),
          aprobacion_coordinador(*),
          programacion_instalaciones(*)
        `)
        .order('fecha_solicitud', { ascending: false });

      if (error) throw error;

      // Agrupar por estado
      const etapas = {
        pendiente_evaluacion: data?.filter(s => s.estado_general === 'pendiente_evaluacion') || [],
        pendiente_analisis_riesgo: data?.filter(s => s.estado_general === 'pendiente_analisis_riesgo') || [],
        en_evaluacion_riesgo: data?.filter(s => s.estado_general === 'en_evaluacion_riesgo') || [],
        evaluacion_completada: data?.filter(s => s.estado_general === 'evaluacion_completada') || [],
        pendiente_aprobacion: data?.filter(s => s.estado_general === 'pendiente_aprobacion') || [],
        aprobado: data?.filter(s => s.estado_general === 'aprobado') || [],
        programacion_instalacion: data?.filter(s => s.estado_general === 'programacion_instalacion') || [],
        instalacion_programada: data?.filter(s => s.estado_general === 'instalacion_programada') || [],
        en_instalacion: data?.filter(s => s.estado_general === 'en_instalacion') || [],
        instalacion_completada: data?.filter(s => s.estado_general === 'instalacion_completada') || [],
        servicio_activo: data?.filter(s => s.estado_general === 'servicio_activo') || [],
        rechazado: data?.filter(s => s.estado_general === 'rechazado') || [],
        cancelado: data?.filter(s => s.estado_general === 'cancelado') || [],
        suspendido: data?.filter(s => s.estado_general === 'suspendido') || []
      };

      return etapas;
    }
  });

  // Obtener servicios pendientes por coordinador
  const { data: serviciosPendientesCoordinador, isLoading: loadingCoordinador } = useQuery({
    queryKey: ['servicios-pendientes-coordinador'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .select('*')
        .eq('estado_general', 'pendiente_evaluacion')
        .order('fecha_solicitud', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  // Obtener servicios pendientes de análisis de riesgo
  const { data: serviciosPendientesRiesgo, isLoading: loadingRiesgo } = useQuery({
    queryKey: ['servicios-pendientes-riesgo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .select('*')
        .eq('estado_general', 'pendiente_analisis_riesgo')
        .order('fecha_solicitud', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  // Obtener detalle de servicio específico
  const obtenerDetalleServicio = (servicioId: string) => {
    return useQuery({
      queryKey: ['detalle-servicio', servicioId],
      queryFn: async () => {
        console.log('Obteniendo detalle del servicio:', servicioId);
        
        try {
          const { data, error } = await supabase
            .from('servicios_monitoreo')
            .select(`
              *,
              analisis_riesgo_seguridad(*),
              aprobacion_coordinador(*),
              contactos_emergencia_servicio(*)
            `)
            .eq('id', servicioId)
            .single();

          if (error) {
            console.error('Error al obtener detalle del servicio:', error);
            throw error;
          }

          console.log('Detalle del servicio obtenido:', data);
          return data;
        } catch (error) {
          console.error('Error en obtenerDetalleServicio:', error);
          throw error;
        }
      },
      enabled: !!servicioId,
      retry: 3,
      retryDelay: 1000
    });
  };

  // Crear aprobación de coordinador
  const crearAprobacionCoordinador = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creando aprobación de coordinador:', data);
      
      // Obtener el usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que el servicio existe y obtener datos
      const { data: servicio, error: servicioError } = await supabase
        .from('servicios_monitoreo')
        .select('*')
        .eq('id', data.servicio_id)
        .single();

      if (servicioError || !servicio) {
        throw new Error('Servicio no encontrado');
      }

      // Crear la aprobación directamente
      const { data: aprobacion, error: aprobacionError } = await supabase
        .from('aprobacion_coordinador')
        .insert({
          servicio_id: data.servicio_id,
          coordinador_id: userData.user.id,
          estado_aprobacion: data.estado_aprobacion,
          fecha_respuesta: new Date().toISOString(),
          modelo_vehiculo_compatible: data.modelo_vehiculo_compatible || false,
          cobertura_celular_verificada: data.cobertura_celular_verificada || false,
          requiere_instalacion_fisica: data.requiere_instalacion_fisica || false,
          acceso_instalacion_disponible: data.acceso_instalacion_disponible || false,
          restricciones_tecnicas_sla: data.restricciones_tecnicas_sla || false,
          contactos_emergencia_validados: data.contactos_emergencia_validados || false,
          elementos_aclarar_cliente: data.elementos_aclarar_cliente || null,
          observaciones: data.observaciones || null
        })
        .select()
        .single();

      if (aprobacionError) {
        console.error('Error al crear aprobación:', aprobacionError);
        throw aprobacionError;
      }

      // Determinar el nuevo estado del servicio
      let nuevoEstado = 'pendiente_evaluacion'; // Default
      switch (data.estado_aprobacion) {
        case 'aprobado':
          nuevoEstado = 'pendiente_analisis_riesgo';
          break;
        case 'rechazado':
          nuevoEstado = 'rechazado';
          break;
        case 'requiere_aclaracion':
          nuevoEstado = 'requiere_aclaracion';
          break;
      }

      // Actualizar el estado del servicio
      const { error: updateError } = await supabase
        .from('servicios_monitoreo')
        .update({ estado_general: nuevoEstado })
        .eq('id', data.servicio_id);

      if (updateError) {
        console.error('Error al actualizar estado del servicio:', updateError);
        throw updateError;
      }

      console.log('Aprobación creada exitosamente:', aprobacion);
      
      // Registrar el seguimiento del cambio de estado
      let descripcionEvento = '';
      switch (data.estado_aprobacion) {
        case 'aprobado':
          descripcionEvento = 'Servicio aprobado por coordinador - pasando a análisis de riesgo';
          break;
        case 'rechazado':
          descripcionEvento = 'Servicio rechazado por coordinador';
          break;
        case 'requiere_aclaracion':
          descripcionEvento = 'Servicio requiere aclaración con el cliente';
          break;
      }

      const { error: seguimientoError } = await supabase
        .from('seguimiento_servicio')
        .insert({
          servicio_id: data.servicio_id,
          tipo_evento: 'aprobacion_coordinador',
          descripcion: descripcionEvento,
          usuario_id: userData.user.id,
          datos_adicionales: {
            estado_aprobacion: data.estado_aprobacion,
            criterios_validados: {
              modelo_vehiculo_compatible: data.modelo_vehiculo_compatible,
              cobertura_celular_verificada: data.cobertura_celular_verificada,
              requiere_instalacion_fisica: data.requiere_instalacion_fisica,
              acceso_instalacion_disponible: data.acceso_instalacion_disponible,
              restricciones_tecnicas_sla: data.restricciones_tecnicas_sla,
              contactos_emergencia_validados: data.contactos_emergencia_validados
            }
          }
        });

      if (seguimientoError) {
        console.warn('Error al registrar seguimiento:', seguimientoError);
      }

      return aprobacion;
    },
    onSuccess: (data, variables) => {
      // Invalidar todas las consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['servicios-workflow'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-pendientes-coordinador'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-pendientes-riesgo'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      
      let mensaje = '';
      switch (variables.estado_aprobacion) {
        case 'aprobado':
          mensaje = "Servicio aprobado exitosamente. Ahora pasará a análisis de riesgo de seguridad.";
          break;
        case 'rechazado':
          mensaje = "Servicio rechazado por el coordinador de operaciones.";
          break;
        case 'requiere_aclaracion':
          mensaje = "Servicio marcado como requiere aclaración con el cliente.";
          break;
      }
      
      toast({
        title: "Evaluación completada",
        description: mensaje,
      });
    },
    onError: (error) => {
      console.error('Error en mutation crearAprobacionCoordinador:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la evaluación del coordinador. Verifique los datos e intente nuevamente.",
        variant: "destructive",
      });
    }
  });

  // Crear análisis de riesgo
  const crearAnalisisRiesgo = useMutation({
    mutationFn: async (data: any) => {
      console.log('Mutation: Creando análisis de riesgo con datos:', data);
      
      // Obtener el usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Usuario no autenticado');
      }

      // Preparar los datos del análisis incluyendo el analista_id
      const analisisData = {
        ...data,
        analista_id: userData.user.id
      };

      const { data: result, error } = await supabase
        .from('analisis_riesgo_seguridad')
        .insert([analisisData])
        .select()
        .single();

      if (error) {
        console.error('Error al insertar análisis de riesgo:', error);
        throw error;
      }

      console.log('Análisis de riesgo creado:', result);

      // Actualizar estado del servicio según el análisis
      let nuevoEstado = 'programacion_instalacion'; // Aprobado -> va a programación de instalación GPS
      if (!data.aprobado_seguridad) {
        nuevoEstado = 'rechazado_seguridad';
      }

      console.log('Actualizando estado del servicio a:', nuevoEstado);

      const { error: updateError } = await supabase
        .from('servicios_monitoreo')
        .update({ estado_general: nuevoEstado })
        .eq('id', data.servicio_id);

      if (updateError) {
        console.error('Error al actualizar estado del servicio:', updateError);
        throw updateError;
      }

      // Registrar el seguimiento del cambio de estado
      const { error: seguimientoError } = await supabase
        .from('seguimiento_servicio')
        .insert({
          servicio_id: data.servicio_id,
          tipo_evento: 'analisis_riesgo_completado',
          descripcion: `Análisis de riesgo completado. Estado: ${data.aprobado_seguridad ? 'Aprobado' : 'Rechazado'}`,
          estado_nuevo: nuevoEstado,
          usuario_id: userData.user.id,
          datos_adicionales: {
            calificacion_riesgo: data.calificacion_riesgo,
            aprobado_seguridad: data.aprobado_seguridad,
            recomendaciones: data.recomendaciones
          }
        });

      if (seguimientoError) {
        console.warn('Error al registrar seguimiento:', seguimientoError);
      }

      console.log('Análisis de riesgo completado exitosamente');
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['servicios-workflow'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-pendientes-riesgo'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      
      const mensaje = variables.aprobado_seguridad 
        ? "El análisis de riesgo ha sido aprobado. El servicio pasará a programación de instalación GPS."
        : "El análisis de riesgo ha sido rechazado por seguridad.";
        
      toast({
        title: "Análisis completado",
        description: mensaje,
      });
    },
    onError: (error) => {
      console.error('Error en mutation crearAnalisisRiesgo:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el análisis de riesgo. Verifique los datos e intente nuevamente.",
        variant: "destructive",
      });
    }
  });

  // Aprobar servicio (mover a siguiente etapa)
  const aprobarServicio = useMutation({
    mutationFn: async ({ servicioId, nuevoEstado, observaciones }: { 
      servicioId: string; 
      nuevoEstado: string; 
      observaciones?: string 
    }) => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .update({ 
          estado_general: nuevoEstado,
          ...(observaciones && { observaciones: observaciones })
        })
        .eq('id', servicioId)
        .select()
        .single();

      if (error) throw error;

      // Registrar el seguimiento
      await supabase
        .from('seguimiento_servicio')
        .insert({
          servicio_id: servicioId,
          tipo_evento: 'cambio_estado',
          descripcion: `Servicio aprobado y movido a: ${nuevoEstado}`,
          estado_nuevo: nuevoEstado,
          usuario_id: (await supabase.auth.getUser()).data.user?.id,
          datos_adicionales: observaciones ? { observaciones } : null
        });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['servicios-workflow'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "Servicio aprobado",
        description: `El servicio ha sido movido a: ${variables.nuevoEstado}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo aprobar el servicio.",
        variant: "destructive",
      });
      console.error('Error approving service:', error);
    }
  });

  // Rechazar servicio
  const rechazarServicio = useMutation({
    mutationFn: async ({ servicioId, motivo }: { servicioId: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .update({ 
          estado_general: 'rechazado',
          observaciones: motivo
        })
        .eq('id', servicioId)
        .select()
        .single();

      if (error) throw error;

      // Registrar el seguimiento
      await supabase
        .from('seguimiento_servicio')
        .insert({
          servicio_id: servicioId,
          tipo_evento: 'rechazo',
          descripcion: `Servicio rechazado: ${motivo}`,
          estado_nuevo: 'rechazado',
          usuario_id: (await supabase.auth.getUser()).data.user?.id,
          datos_adicionales: { motivo }
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios-workflow'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "Servicio rechazado",
        description: "El servicio ha sido rechazado.",
      });
    }
  });

  // Programar instalación (cuando se aprueba y va a instalación)
  const programarInstalacion = useMutation({
    mutationFn: async ({ servicioId }: { servicioId: string }) => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .update({ 
          estado_general: 'programacion_instalacion'
        })
        .eq('id', servicioId)
        .select()
        .single();

      if (error) throw error;

      // Registrar el seguimiento
      await supabase
        .from('seguimiento_servicio')
        .insert({
          servicio_id: servicioId,
          tipo_evento: 'aprobacion_final',
          descripcion: 'Servicio aprobado, listo para programar instalación',
          estado_nuevo: 'programacion_instalacion',
          usuario_id: (await supabase.auth.getUser()).data.user?.id
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios-workflow'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "Listo para instalación",
        description: "El servicio está listo para programar instalación.",
      });
    }
  });

  return {
    serviciosPorEtapa,
    isLoading,
    serviciosPendientesCoordinador,
    loadingCoordinador,
    serviciosPendientesRiesgo,
    loadingRiesgo,
    obtenerDetalleServicio,
    crearAprobacionCoordinador,
    crearAnalisisRiesgo,
    aprobarServicio,
    rechazarServicio,
    programarInstalacion
  };
};
