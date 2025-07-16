import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GpsRecomendacion {
  gps_id: string;
  marca: string;
  modelo: string;
  numero_serie: string;
  score_compatibilidad: number;
  requiere_microsd: boolean;
  tipo_sim_recomendado: string;
}

export interface SimDisponible {
  sim_id: string;
  numero_sim: string;
  operador: string;
  tipo_plan: string;
  costo_mensual: number;
  datos_incluidos_mb: number;
}

export interface MicroSDDisponible {
  microsd_id: string;
  numero_serie: string;
  marca: string;
  modelo: string;
  capacidad_gb: number;
  clase_velocidad: string;
}

export interface KitInstalacion {
  id: string;
  programacion_id: string;
  fecha_programada: string;
  tipo_instalacion: string;
  contacto_cliente: string;
  direccion_instalacion: string;
  gps_marca: string;
  gps_modelo: string;
  gps_serie: string;
  tipo_dispositivo: string;
  numero_sim: string | null;
  sim_operador: string | null;
  sim_plan: string | null;
  microsd_marca: string | null;
  microsd_modelo: string | null;
  capacidad_gb: number | null;
  estado_kit: string;
  fecha_preparacion: string;
  fecha_envio: string | null;
  fecha_instalacion: string | null;
  fecha_validacion: string | null;
  numero_tracking: string | null;
  preparado_por_email: string | null;
  instalador_nombre: string | null;
  validado_por_email: string | null;
}

export const useKitsInstalacion = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener GPS recomendados para una instalación
  const recomendarGPS = async (tipoVehiculo: string, sensoresRequeridos: string[]): Promise<GpsRecomendacion[]> => {
    const { data, error } = await supabase.rpc('recomendar_gps_para_instalacion', {
      p_tipo_vehiculo: tipoVehiculo,
      p_sensores_requeridos: sensoresRequeridos
    });

    if (error) throw error;
    return data || [];
  };

  // Obtener SIM disponibles
  const obtenerSimDisponibles = async (tipoPlan?: string): Promise<SimDisponible[]> => {
    const { data, error } = await supabase.rpc('obtener_sim_disponibles', {
      p_tipo_plan: tipoPlan
    });

    if (error) throw error;
    return data || [];
  };

  // Obtener microSD disponibles
  const obtenerMicroSDDisponibles = async (capacidadMinima?: number): Promise<MicroSDDisponible[]> => {
    const { data, error } = await supabase.rpc('obtener_microsd_disponibles', {
      p_capacidad_minima_gb: capacidadMinima
    });

    if (error) throw error;
    return data || [];
  };

  // Obtener kits de instalación
  const { data: kits, isLoading: isLoadingKits, error: errorKits } = useQuery({
    queryKey: ['kits-instalacion'],
    queryFn: async (): Promise<KitInstalacion[]> => {
      const { data, error } = await supabase
        .from('vista_kits_instalacion')
        .select('*')
        .order('fecha_programada', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Crear kit de instalación
  const createKitMutation = useMutation({
    mutationFn: async ({
      programacionId,
      gpsId,
      simId,
      microsdId
    }: {
      programacionId: string;
      gpsId: string;
      simId?: string;
      microsdId?: string;
    }) => {
      const { data, error } = await supabase.rpc('crear_kit_instalacion', {
        p_programacion_id: programacionId,
        p_gps_id: gpsId,
        p_sim_id: simId || null,
        p_microsd_id: microsdId || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kits-instalacion'] });
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      toast({
        title: "Kit creado exitosamente",
        description: "El kit de instalación ha sido preparado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear kit",
        description: error.message || "No se pudo crear el kit de instalación",
        variant: "destructive",
      });
    },
  });

  // Actualizar estado del kit
  const updateEstadoKitMutation = useMutation({
    mutationFn: async ({
      kitId,
      nuevoEstado,
      observaciones,
      numeroTracking
    }: {
      kitId: string;
      nuevoEstado: string;
      observaciones?: string;
      numeroTracking?: string;
    }) => {
      const updateData: any = {
        estado_kit: nuevoEstado,
        updated_at: new Date().toISOString()
      };

      if (nuevoEstado === 'enviado') {
        updateData.fecha_envio = new Date().toISOString();
        if (numeroTracking) updateData.numero_tracking = numeroTracking;
      } else if (nuevoEstado === 'instalado') {
        updateData.fecha_instalacion = new Date().toISOString();
        if (observaciones) updateData.observaciones_instalacion = observaciones;
      }

      const { data, error } = await supabase
        .from('kits_instalacion')
        .update(updateData)
        .eq('id', kitId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kits-instalacion'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del kit ha sido actualizado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message || "No se pudo actualizar el estado del kit",
        variant: "destructive",
      });
    },
  });

  // Validar instalación completada
  const validarInstalacionMutation = useMutation({
    mutationFn: async ({
      kitId,
      observaciones
    }: {
      kitId: string;
      observaciones?: string;
    }) => {
      const { data, error } = await supabase.rpc('validar_instalacion_completada', {
        p_kit_id: kitId,
        p_observaciones: observaciones
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kits-instalacion'] });
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      toast({
        title: "Instalación validada",
        description: "La instalación ha sido validada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al validar instalación",
        description: error.message || "No se pudo validar la instalación",
        variant: "destructive",
      });
    },
  });

  return {
    // Datos
    kits,
    isLoadingKits,
    errorKits,

    // Funciones de consulta
    recomendarGPS,
    obtenerSimDisponibles,
    obtenerMicroSDDisponibles,

    // Mutaciones
    createKit: createKitMutation.mutate,
    isCreatingKit: createKitMutation.isPending,
    updateEstadoKit: updateEstadoKitMutation.mutate,
    isUpdatingEstado: updateEstadoKitMutation.isPending,
    validarInstalacion: validarInstalacionMutation.mutate,
    isValidating: validarInstalacionMutation.isPending,
  };
};