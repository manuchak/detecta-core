import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AprobacionCoordinador, AnalisisRiesgoSeguridad } from '@/types/serviciosMonitoreoCompleto';

export const useAprobacionesWorkflow = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Verificar autenticación del usuario
  const checkAuth = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('Usuario no autenticado. Por favor, inicie sesión nuevamente.');
    }
    return user;
  };

  // Verificar rol del usuario
  const checkUserRole = async () => {
    try {
      const user = await checkAuth();
      console.log('Usuario actual:', user.id, user.email);
      
      // Verificar rol usando la función segura
      const { data: hasRole, error } = await supabase.rpc('is_coordinator_or_admin');
      
      if (error) {
        console.error('Error verificando rol:', error);
        throw new Error('Error verificando permisos del usuario');
      }
      
      console.log('¿Usuario tiene permisos de coordinador/admin?:', hasRole);
      
      if (!hasRole) {
        throw new Error('Usuario no tiene permisos de coordinador u administrador');
      }
      
      return true;
    } catch (error) {
      console.error('Error en checkUserRole:', error);
      throw error;
    }
  };

  // Obtener servicios pendientes de aprobación por coordinador
  const { data: serviciosPendientesCoordinador, isLoading: loadingCoordinador, error: errorCoordinador } = useQuery({
    queryKey: ['servicios-pendientes-coordinador'],
    queryFn: async () => {
      try {
        await checkAuth();
        
        const { data, error } = await supabase
          .from('servicios_monitoreo')
          .select(`
            *,
            ejecutivo:profiles!ejecutivo_ventas_id(display_name),
            aprobacion_coordinador(*)
          `)
          .eq('estado_general', 'pendiente_evaluacion')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching coordinator services:', error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error('Error in servicios-pendientes-coordinador query:', error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // No reintentar si es un error de autenticación
      if (error?.message?.includes('autenticado')) return false;
      return failureCount < 2;
    }
  });

  // Obtener servicios pendientes de análisis de riesgo
  const { data: serviciosPendientesRiesgo, isLoading: loadingRiesgo, error: errorRiesgo } = useQuery({
    queryKey: ['servicios-pendientes-riesgo'],
    queryFn: async () => {
      try {
        await checkAuth();
        
        const { data, error } = await supabase
          .from('servicios_monitoreo')
          .select(`
            *,
            ejecutivo:profiles!ejecutivo_ventas_id(display_name),
            analisis_riesgo_seguridad(*)
          `)
          .eq('estado_general', 'pendiente_analisis_riesgo')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching risk analysis services:', error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error('Error in servicios-pendientes-riesgo query:', error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (error?.message?.includes('autenticado')) return false;
      return failureCount < 2;
    }
  });

  // Crear aprobación de coordinador
  const crearAprobacionCoordinador = useMutation({
    mutationFn: async (data: Partial<AprobacionCoordinador> & { estado_aprobacion: 'aprobado' | 'rechazado' | 'requiere_aclaracion'; servicio_id: string }) => {
      try {
        // Verificar autenticación y permisos
        const user = await checkAuth();
        await checkUserRole();

        // Validar datos requeridos
        if (!data.servicio_id || !data.estado_aprobacion) {
          throw new Error('Datos incompletos para crear la aprobación');
        }

        const insertData = {
          servicio_id: data.servicio_id,
          coordinador_id: user.id,
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
        };

        console.log('Enviando datos de aprobación:', insertData);

        // Verificar que el servicio existe antes de insertar
        const { data: servicioExiste, error: servicioError } = await supabase
          .from('servicios_monitoreo')
          .select('id, estado_general')
          .eq('id', data.servicio_id)
          .single();

        if (servicioError || !servicioExiste) {
          console.error('Error verificando servicio:', servicioError);
          throw new Error('El servicio especificado no existe');
        }

        console.log('Servicio encontrado:', servicioExiste);

        // Insert approval record
        const { data: result, error } = await supabase
          .from('aprobacion_coordinador')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting approval:', error);
          throw error;
        }

        console.log('Aprobación creada exitosamente:', result);

        // Update service status based on approval result using valid states
        let nuevoEstado = 'pendiente_evaluacion';
        if (data.estado_aprobacion === 'aprobado') {
          nuevoEstado = 'pendiente_analisis_riesgo';
        } else if (data.estado_aprobacion === 'rechazado') {
          nuevoEstado = 'rechazado';
        } else if (data.estado_aprobacion === 'requiere_aclaracion') {
          nuevoEstado = 'requiere_aclaracion';
        }

        console.log('Actualizando estado del servicio a:', nuevoEstado);

        const { error: updateError } = await supabase
          .from('servicios_monitoreo')
          .update({ estado_general: nuevoEstado })
          .eq('id', data.servicio_id);

        if (updateError) {
          console.error('Error updating service status:', updateError);
          throw updateError;
        }

        return result;
      } catch (error) {
        console.error('Error in crearAprobacionCoordinador:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['servicios-pendientes-coordinador'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-pendientes-riesgo'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      
      const mensaje = variables.estado_aprobacion === 'aprobado' 
        ? "Servicio aprobado y enviado a análisis de riesgo"
        : variables.estado_aprobacion === 'rechazado'
        ? "Servicio rechazado"
        : "Servicio marcado como requiere aclaración";

      toast({
        title: "Evaluación registrada",
        description: mensaje,
      });
    },
    onError: (error: any) => {
      console.error('Error creating coordinator approval:', error);
      
      let errorMessage = "No se pudo registrar la evaluación del coordinador.";
      
      if (error?.message?.includes('autenticado')) {
        errorMessage = "Sesión expirada. Por favor, inicie sesión nuevamente.";
      } else if (error?.message?.includes('incompletos')) {
        errorMessage = "Datos incompletos. Verifique que todos los campos estén correctos.";
      } else if (error?.message?.includes('permisos')) {
        errorMessage = "No tiene permisos para realizar esta acción. Contacte al administrador.";
      } else if (error?.code === '23505') {
        errorMessage = "Ya existe una evaluación para este servicio.";
      } else if (error?.message?.includes('check constraint')) {
        errorMessage = "Error en validación de estado del servicio. Por favor, contacte al administrador.";
      } else if (error?.message?.includes('row-level security')) {
        errorMessage = "Error de permisos de base de datos. Verifique que tiene el rol adecuado.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Crear análisis de riesgo
  const crearAnalisisRiesgo = useMutation({
    mutationFn: async (data: Partial<AnalisisRiesgoSeguridad> & { estado_analisis: 'completado'; servicio_id: string; aprobado_seguridad: boolean }) => {
      try {
        const user = await checkAuth();

        if (!data.servicio_id || data.aprobado_seguridad === undefined) {
          throw new Error('Datos incompletos para crear el análisis');
        }

        const insertData = {
          servicio_id: data.servicio_id,
          analista_id: user.id,
          estado_analisis: data.estado_analisis,
          aprobado_seguridad: data.aprobado_seguridad,
          tipo_monitoreo_requerido: data.tipo_monitoreo_requerido || null,
          tipo_activo_proteger: data.tipo_activo_proteger || null,
          perfil_usuario: data.perfil_usuario || null,
          zonas_operacion: data.zonas_operacion || null,
          historial_incidentes: data.historial_incidentes || null,
          frecuencia_uso_rutas: data.frecuencia_uso_rutas || null,
          tipo_riesgo_principal: data.tipo_riesgo_principal || null,
          nivel_exposicion: data.nivel_exposicion || null,
          controles_actuales_existentes: data.controles_actuales_existentes || null,
          dispositivos_seguridad_requeridos: data.dispositivos_seguridad_requeridos || null,
          medios_comunicacion_cliente: data.medios_comunicacion_cliente || null,
          puntos_criticos_identificados: data.puntos_criticos_identificados || null,
          apoyo_externo_autoridades: data.apoyo_externo_autoridades || null,
          calificacion_riesgo: data.calificacion_riesgo || null,
          recomendaciones: data.recomendaciones || null,
          equipamiento_recomendado: data.equipamiento_recomendado || null,
          observaciones: data.observaciones || null
        };

        // Insert risk analysis record
        const { data: result, error } = await supabase
          .from('analisis_riesgo_seguridad')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting risk analysis:', error);
          throw error;
        }

        // Update service status based on security approval using valid states
        const nuevoEstado = data.aprobado_seguridad ? 'aprobado' : 'rechazado';

        const { error: updateError } = await supabase
          .from('servicios_monitoreo')
          .update({ estado_general: nuevoEstado })
          .eq('id', data.servicio_id);

        if (updateError) {
          console.error('Error updating service status:', updateError);
          throw updateError;
        }

        return result;
      } catch (error) {
        console.error('Error in crearAnalisisRiesgo:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['servicios-pendientes-riesgo'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      
      const mensaje = variables.aprobado_seguridad 
        ? "Servicio aprobado por seguridad y listo para instalación"
        : "Servicio rechazado por análisis de riesgo";

      toast({
        title: "Análisis completado",
        description: mensaje,
      });
    },
    onError: (error: any) => {
      console.error('Error creating risk analysis:', error);
      
      let errorMessage = "No se pudo registrar el análisis de riesgo.";
      
      if (error?.message?.includes('autenticado')) {
        errorMessage = "Sesión expirada. Por favor, inicie sesión nuevamente.";
      } else if (error?.message?.includes('incompletos')) {
        errorMessage = "Datos incompletos. Verifique que todos los campos estén correctos.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Obtener detalle completo de un servicio
  const obtenerDetalleServicio = (servicioId: string) => useQuery({
    queryKey: ['servicio-detalle', servicioId],
    queryFn: async () => {
      try {
        await checkAuth();
        
        const { data, error } = await supabase
          .from('servicios_monitoreo')
          .select(`
            *,
            ejecutivo:profiles!ejecutivo_ventas_id(display_name, email),
            coordinador:profiles!coordinador_operaciones_id(display_name, email),
            configuracion_sensores(*),
            contactos_emergencia_servicio(*),
            configuracion_reportes(*),
            aprobacion_coordinador(*),
            analisis_riesgo_seguridad(*)
          `)
          .eq('id', servicioId)
          .single();

        if (error) {
          console.error('Error fetching service detail:', error);
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error('Error in obtenerDetalleServicio:', error);
        throw error;
      }
    },
    enabled: !!servicioId,
    retry: (failureCount, error) => {
      if (error?.message?.includes('autenticado')) return false;
      return failureCount < 2;
    }
  });

  return {
    serviciosPendientesCoordinador,
    serviciosPendientesRiesgo,
    loadingCoordinador,
    loadingRiesgo,
    errorCoordinador,
    errorRiesgo,
    crearAprobacionCoordinador,
    crearAnalisisRiesgo,
    obtenerDetalleServicio
  };
};
