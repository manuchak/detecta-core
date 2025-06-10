
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  CreateServicioMonitoreoCompleto, 
  MarcaGPS, 
  ModeloGPS, 
  TipoMonitoreo 
} from '@/types/serviciosMonitoreoCompleto';

export const useServiciosMonitoreoCompleto = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener tipos de monitoreo
  const { data: tiposMonitoreo } = useQuery({
    queryKey: ['tipos-monitoreo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_monitoreo')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data as TipoMonitoreo[];
    }
  });

  // Obtener marcas GPS
  const { data: marcasGPS } = useQuery({
    queryKey: ['marcas-gps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcas_gps')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data as MarcaGPS[];
    }
  });

  // Obtener modelos GPS por marca
  const getModelosPorMarca = (marcaId: string) => useQuery({
    queryKey: ['modelos-gps', marcaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modelos_gps')
        .select('*')
        .eq('marca_id', marcaId)
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data as ModeloGPS[];
    },
    enabled: !!marcaId
  });

  // Crear servicio completo
  const createServicioCompleto = useMutation({
    mutationFn: async (data: CreateServicioMonitoreoCompleto) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // 1. Crear el servicio principal
      const { data: servicio, error: servicioError } = await supabase
        .from('servicios_monitoreo')
        .insert([{
          nombre_cliente: data.nombre_cliente,
          empresa: data.empresa,
          telefono_contacto: data.telefono_contacto,
          email_contacto: data.email_contacto,
          direccion_cliente: data.direccion_cliente,
          tipo_servicio: data.tipo_servicio,
          prioridad: data.prioridad,
          cantidad_vehiculos: data.cantidad_vehiculos,
          modelo_vehiculo: data.modelo_vehiculo,
          tipo_vehiculo: data.tipo_vehiculo,
          horarios_operacion: data.horarios_operacion,
          rutas_habituales: data.rutas_habituales,
          zonas_riesgo_identificadas: data.zonas_riesgo_identificadas,
          detalles_zonas_riesgo: data.detalles_zonas_riesgo,
          cuenta_gps_instalado: data.cuenta_gps_instalado,
          detalles_gps_actual: data.detalles_gps_actual,
          cuenta_boton_panico: data.cuenta_boton_panico,
          tipo_gps_preferido: data.tipo_gps_preferido,
          marca_gps_preferida: data.marca_gps_preferida,
          modelo_gps_preferido: data.modelo_gps_preferido,
          requiere_paro_motor: data.requiere_paro_motor,
          condiciones_paro_motor: data.condiciones_paro_motor,
          ejecutivo_ventas_id: user.id,
          observaciones: data.observaciones
        }])
        .select()
        .single();

      if (servicioError) throw servicioError;

      // 2. Crear configuración de sensores
      const { error: sensoresError } = await supabase
        .from('configuracion_sensores')
        .insert([{
          servicio_id: servicio.id,
          ...data.configuracion_sensores
        }]);

      if (sensoresError) throw sensoresError;

      // 3. Crear contactos de emergencia
      if (data.contactos_emergencia.length > 0) {
        const contactosParaInsertar = data.contactos_emergencia.map(contacto => ({
          servicio_id: servicio.id,
          ...contacto
        }));

        const { error: contactosError } = await supabase
          .from('contactos_emergencia_servicio')
          .insert(contactosParaInsertar);

        if (contactosError) throw contactosError;
      }

      // 4. Crear configuración de reportes
      const { error: reportesError } = await supabase
        .from('configuracion_reportes')
        .insert([{
          servicio_id: servicio.id,
          ...data.configuracion_reportes
        }]);

      if (reportesError) throw reportesError;

      return servicio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "Servicio creado exitosamente",
        description: "El servicio de monitoreo ha sido registrado y está pendiente de evaluación.",
      });
    },
    onError: (error) => {
      console.error('Error creating service:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el servicio de monitoreo. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  });

  return {
    tiposMonitoreo,
    marcasGPS,
    getModelosPorMarca,
    createServicioCompleto
  };
};
