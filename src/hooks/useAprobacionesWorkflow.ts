
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AprobacionCoordinador, AnalisisRiesgoSeguridad } from '@/types/serviciosMonitoreoCompleto';

export const useAprobacionesWorkflow = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener servicios pendientes de aprobación por coordinador
  const { data: serviciosPendientesCoordinador, isLoading: loadingCoordinador } = useQuery({
    queryKey: ['servicios-pendientes-coordinador'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .select(`
          *,
          ejecutivo:profiles!ejecutivo_ventas_id(display_name),
          aprobacion_coordinador(*)
        `)
        .eq('estado_general', 'pendiente_evaluacion')
        .order('created_at', { ascending: false });

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
        .select(`
          *,
          ejecutivo:profiles!ejecutivo_ventas_id(display_name),
          analisis_riesgo_seguridad(*)
        `)
        .eq('estado_general', 'pendiente_analisis_riesgo')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Crear aprobación de coordinador
  const crearAprobacionCoordinador = useMutation({
    mutationFn: async (data: Partial<AprobacionCoordinador> & { estado_aprobacion: 'aprobado' | 'rechazado' | 'requiere_aclaracion'; servicio_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const insertData = {
        servicio_id: data.servicio_id,
        coordinador_id: user.id,
        estado_aprobacion: data.estado_aprobacion,
        fecha_respuesta: new Date().toISOString(),
        modelo_vehiculo_compatible: data.modelo_vehiculo_compatible || null,
        cobertura_celular_verificada: data.cobertura_celular_verificada || null,
        requiere_instalacion_fisica: data.requiere_instalacion_fisica || null,
        acceso_instalacion_disponible: data.acceso_instalacion_disponible || null,
        restricciones_tecnicas_sla: data.restricciones_tecnicas_sla || null,
        contactos_emergencia_validados: data.contactos_emergencia_validados || null,
        elementos_aclarar_cliente: data.elementos_aclarar_cliente || null,
        observaciones: data.observaciones || null
      };

      const { data: result, error } = await supabase
        .from('aprobacion_coordinador')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios-pendientes-coordinador'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "Aprobación registrada",
        description: "La respuesta del coordinador ha sido registrada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar la aprobación del coordinador.",
        variant: "destructive",
      });
      console.error('Error creating coordinator approval:', error);
    }
  });

  // Crear análisis de riesgo
  const crearAnalisisRiesgo = useMutation({
    mutationFn: async (data: Partial<AnalisisRiesgoSeguridad> & { estado_analisis: 'completado'; servicio_id: string; aprobado_seguridad: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

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

      const { data: result, error } = await supabase
        .from('analisis_riesgo_seguridad')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios-pendientes-riesgo'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "Análisis de riesgo registrado",
        description: "El análisis de riesgo ha sido completado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el análisis de riesgo.",
        variant: "destructive",
      });
      console.error('Error creating risk analysis:', error);
    }
  });

  // Obtener detalle completo de un servicio
  const obtenerDetalleServicio = (servicioId: string) => useQuery({
    queryKey: ['servicio-detalle', servicioId],
    queryFn: async () => {
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

      if (error) throw error;
      return data;
    },
    enabled: !!servicioId
  });

  return {
    serviciosPendientesCoordinador,
    serviciosPendientesRiesgo,
    loadingCoordinador,
    loadingRiesgo,
    crearAprobacionCoordinador,
    crearAnalisisRiesgo,
    obtenerDetalleServicio
  };
};
