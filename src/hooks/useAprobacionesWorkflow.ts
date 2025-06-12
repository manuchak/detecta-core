
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
    mutationFn: async (data: Partial<AprobacionCoordinador>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: result, error } = await supabase
        .from('aprobacion_coordinador')
        .insert({
          ...data,
          coordinador_id: user.id,
          fecha_respuesta: new Date().toISOString()
        })
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
    mutationFn: async (data: Partial<AnalisisRiesgoSeguridad>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: result, error } = await supabase
        .from('analisis_riesgo_seguridad')
        .insert({
          ...data,
          analista_id: user.id
        })
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
