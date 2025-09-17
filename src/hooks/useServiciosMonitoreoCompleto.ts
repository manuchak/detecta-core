// @ts-nocheck
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

  // Función para validar campos críticos antes del envío
  const validateCriticalFields = (data: CreateServicioMonitoreoCompleto) => {
    const errors: string[] = [];

    // Validaciones críticas de información del cliente
    if (!data.nombre_cliente?.trim()) {
      errors.push("Nombre del cliente es obligatorio");
    }
    if (!data.empresa?.trim()) {
      errors.push("Empresa es obligatoria para evaluación crediticia");
    }
    if (!data.telefono_contacto?.trim()) {
      errors.push("Teléfono principal es obligatorio para emergencias");
    }
    if (!data.email_contacto?.trim()) {
      errors.push("Email principal es obligatorio para reportes");
    }
    if (!data.direccion_cliente?.trim() || data.direccion_cliente.length < 20) {
      errors.push("Dirección completa es obligatoria para evaluación de zona de riesgo");
    }

    // Validaciones críticas de configuración del servicio
    if (!data.tipo_servicio) {
      errors.push("Tipo de servicio es obligatorio para asignación de equipamiento");
    }
    if (!data.prioridad) {
      errors.push("Prioridad es obligatoria para definir tiempo de respuesta");
    }
    if (!data.plan_rastreo_satelital) {
      errors.push("Plan de rastreo satelital es obligatorio para definir alcance del servicio");
    }
    if (!data.cantidad_vehiculos || data.cantidad_vehiculos < 1) {
      errors.push("Cantidad de vehículos debe ser mayor a 0");
    }

    // Validaciones de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email_contacto && !emailRegex.test(data.email_contacto)) {
      errors.push("Formato de email inválido");
    }

    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    if (data.telefono_contacto && !phoneRegex.test(data.telefono_contacto)) {
      errors.push("Formato de teléfono inválido");
    }

    // Validación de dirección detallada
    if (data.direccion_cliente && (!data.direccion_cliente.includes(',') || data.direccion_cliente.split(',').length < 3)) {
      errors.push("Dirección debe incluir: calle, colonia, ciudad, estado separados por comas");
    }

    return errors;
  };

  // Crear servicio completo con validaciones estrictas
  const createServicioCompleto = useMutation({
    mutationFn: async (data: CreateServicioMonitoreoCompleto) => {
      // Validación previa crítica
      const validationErrors = validateCriticalFields(data);
      if (validationErrors.length > 0) {
        throw new Error(`Campos críticos faltantes: ${validationErrors.join(', ')}`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // 1. Crear el servicio principal with validation status
      const { data: servicio, error: servicioError } = await supabase
        .from('servicios_monitoreo')
        .insert({
          nombre_cliente: data.nombre_cliente.trim(),
          empresa: data.empresa?.trim() || null,
          telefono_contacto: data.telefono_contacto.trim(),
          email_contacto: data.email_contacto.trim().toLowerCase(),
          direccion_cliente: data.direccion_cliente.trim(),
          tipo_servicio: data.tipo_servicio,
          prioridad: data.prioridad,
          plan_rastreo_satelital: data.plan_rastreo_satelital,
          cantidad_vehiculos: data.cantidad_vehiculos,
          modelo_vehiculo: data.modelo_vehiculo?.trim() || null,
          tipo_vehiculo: data.tipo_vehiculo?.trim() || null,
          horarios_operacion: data.horarios_operacion ? JSON.parse(JSON.stringify(data.horarios_operacion)) : null,
          rutas_habituales: data.rutas_habituales || null,
          zonas_riesgo_identificadas: data.zonas_riesgo_identificadas || false,
          detalles_zonas_riesgo: data.detalles_zonas_riesgo?.trim() || null,
          cuenta_gps_instalado: data.cuenta_gps_instalado || false,
          detalles_gps_actual: data.detalles_gps_actual?.trim() || null,
          cuenta_boton_panico: data.cuenta_boton_panico || false,
          tipo_gps_preferido: data.tipo_gps_preferido?.trim() || null,
          marca_gps_preferida: data.marca_gps_preferida?.trim() || null,
          modelo_gps_preferido: data.modelo_gps_preferido?.trim() || null,
          requiere_paro_motor: data.requiere_paro_motor || false,
          condiciones_paro_motor: data.condiciones_paro_motor?.trim() || null,
          ejecutivo_ventas_id: user.id,
          observaciones: data.observaciones?.trim() || null,
          estado_general: 'pendiente_evaluacion' // Set initial workflow state
        })
        .select()
        .single();

      if (servicioError) {
        console.error('Error creating service:', servicioError);
        throw new Error(`Error al crear servicio: ${servicioError.message}`);
      }

      // 2. Crear configuración de sensores con validación
      if (data.configuracion_sensores) {
        const { error: sensoresError } = await supabase
          .from('configuracion_sensores')
          .insert({
            servicio_id: servicio.id,
            ...data.configuracion_sensores
          });

        if (sensoresError) {
          console.error('Error creating sensor config:', sensoresError);
          throw new Error(`Error en configuración de sensores: ${sensoresError.message}`);
        }
      }

      // 3. Crear contactos de emergencia con validación
      if (data.contactos_emergencia && data.contactos_emergencia.length > 0) {
        // Validar que al menos hay un contacto principal
        const contactoPrincipal = data.contactos_emergencia.find(c => c.tipo_contacto === 'principal');
        if (!contactoPrincipal) {
          throw new Error('Debe incluir al menos un contacto principal de emergencia');
        }

        const contactosParaInsertar = data.contactos_emergencia.map(contacto => ({
          servicio_id: servicio.id,
          nombre: contacto.nombre.trim(),
          telefono: contacto.telefono.trim(),
          email: contacto.email?.trim() || null,
          tipo_contacto: contacto.tipo_contacto,
          orden_prioridad: contacto.orden_prioridad
        }));

        const { error: contactosError } = await supabase
          .from('contactos_emergencia_servicio')
          .insert(contactosParaInsertar);

        if (contactosError) {
          console.error('Error creating emergency contacts:', contactosError);
          throw new Error(`Error en contactos de emergencia: ${contactosError.message}`);
        }
      }

      // 4. Crear configuración de reportes con validación
      if (data.configuracion_reportes) {
        const { error: reportesError } = await supabase
          .from('configuracion_reportes')
          .insert({
            servicio_id: servicio.id,
            frecuencia_reportes: data.configuracion_reportes.frecuencia_reportes,
            limitantes_protocolos: data.configuracion_reportes.limitantes_protocolos?.trim() || null,
            medio_contacto_preferido: data.configuracion_reportes.medio_contacto_preferido,
            observaciones_adicionales: data.configuracion_reportes.observaciones_adicionales?.trim() || null
          });

        if (reportesError) {
          console.error('Error creating reports config:', reportesError);
          throw new Error(`Error en configuración de reportes: ${reportesError.message}`);
        }
      }

      return servicio;
    },
    onSuccess: (servicio) => {
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "✅ Servicio creado exitosamente",
        description: `Servicio ${servicio.numero_servicio || servicio.id} está listo para evaluación por el coordinador de operaciones. Toda la información crítica fue validada correctamente.`,
      });
    },
    onError: (error) => {
      console.error('Error creating service:', error);
      toast({
        title: "❌ Error al crear servicio",
        description: error instanceof Error ? error.message : "Error desconocido. Verifica que todos los campos críticos estén completos.",
        variant: "destructive",
      });
    }
  });

  return {
    tiposMonitoreo,
    marcasGPS,
    getModelosPorMarca,
    createServicioCompleto,
    validateCriticalFields
  };
};
