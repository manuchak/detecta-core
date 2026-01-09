import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServiceQueryResult {
  // Datos básicos del servicio
  id: string;
  id_servicio: string;
  nombre_cliente: string;
  empresa_cliente?: string;
  email_cliente?: string;
  telefono_cliente?: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  tipo_servicio: string;
  estado: string;
  
  // Cronología y Tiempos
  created_at?: string;
  fecha_hora_asignacion?: string;
  fecha_asignacion?: string;
  fecha_comunicacion?: string;
  fecha_respuesta?: string;
  fecha_hora_comunicacion?: string;
  fecha_hora_respuesta?: string;
  hora_inicio_custodia?: string;
  hora_finalizacion?: string;
  fecha_hora_inicio?: string;
  fecha_hora_fin?: string;
  tiempo_respuesta?: string;
  duracion_servicio?: string;
  tiempo_punto_origen?: string;
  tiempo_punto_destino?: string;
  hora_salida_origen?: string;
  hora_llegada_destino?: string;
  
  // Asignaciones
  nombre_custodio?: string;
  id_custodio?: string;
  telefono_custodio?: string;
  armado_nombre?: string;
  armado_asignado?: boolean;
  incluye_armado?: boolean;
  
  // Información del servicio ejecutado
  km_recorridos?: number;
  cobro_cliente?: number;
  costo_custodio?: number;
  costo_armado?: number;
  auto?: string;
  placa?: string;
  observaciones?: string;
  
  // Contactos y Emergencia
  nombre_operador?: string;
  telefono_operador?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  
  // Datos de planificación y ejecución
  estado_planeacion?: string;
  custodio_asignado?: string;
  custodio_id?: string;
  duracion_estimada?: number;
  km_teoricos?: number;
  
  // Proveedores (para armados externos)
  proveedor_armado?: string;
  tarifa_proveedor_armado?: number;
  
  // Metadata
  fuente_tabla: 'servicios_custodia' | 'servicios_planificados';
  updated_at?: string;
}

interface UseServiceQueryOptions {
  autoSearch?: boolean;
}

export function useServiceQuery(options: UseServiceQueryOptions = {}) {
  const [results, setResults] = useState<ServiceQueryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByServiceId = useCallback(async (serviceId: string) => {
    if (!serviceId.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Normalize search input: trim whitespace, convert to uppercase for case-insensitive matching
    const normalizedId = serviceId.trim().toUpperCase();

    try {
      // Buscar en servicios_custodia - search in multiple fields
      const { data: custodiaData, error: custodiaError } = await supabase
        .from('servicios_custodia')
        .select('*')
        .ilike('id_servicio', `%${normalizedId}%`)
        .order('fecha_hora_cita', { ascending: false });

      if (custodiaError) throw custodiaError;

      // Buscar en servicios_planificados - search in multiple fields
      const { data: planificadosData, error: planificadosError } = await supabase
        .from('servicios_planificados')
        .select('*')
        .or(`id_servicio.ilike.%${normalizedId}%,id_interno_cliente.ilike.%${normalizedId}%`)
        .order('fecha_hora_cita', { ascending: false });

      if (planificadosError) throw planificadosError;

      // Combinar y mapear resultados
      const custodiaResults: ServiceQueryResult[] = (custodiaData || []).map(service => ({
        id: service.id,
        id_servicio: service.id_servicio || service.id,
        nombre_cliente: service.nombre_cliente || 'Cliente sin nombre',
        empresa_cliente: service.empresa_cliente,
        email_cliente: service.email_cliente,
        telefono_cliente: service.telefono_cliente,
        origen: service.origen || 'No especificado',
        destino: service.destino || 'No especificado',
        fecha_hora_cita: service.fecha_hora_cita,
        tipo_servicio: service.tipo_servicio || 'custodia',
        estado: service.estado || 'pendiente',
        
        // Cronología con fallbacks
        created_at: service.created_at || service.updated_time || service.fecha_hora_cita,
        fecha_hora_asignacion: service.fecha_hora_asignacion,
        fecha_comunicacion: service.fecha_comunicacion,
        fecha_respuesta: service.fecha_respuesta,
        hora_inicio_custodia: service.hora_inicio_custodia || service.hora_presentacion || service.presentacion,
        hora_finalizacion: service.hora_finalizacion,
        tiempo_respuesta: service.tiempo_respuesta,
        duracion_servicio: service.duracion_servicio,
        tiempo_punto_origen: service.tiempo_punto_origen,
        tiempo_punto_destino: service.tiempo_punto_destino,
        hora_salida_origen: service.hora_salida_origen,
        hora_llegada_destino: service.hora_llegada_destino || service.hora_arribo,
        
        // Asignaciones con fallbacks
        nombre_custodio: service.nombre_custodio,
        id_custodio: service.id_custodio,
        telefono_custodio: service.telefono_custodio || service.telefono,
        incluye_armado: service.armado?.toUpperCase() === 'TRUE',
        
        // Ejecución
        km_recorridos: service.km_recorridos,
        cobro_cliente: service.cobro_cliente,
        costo_custodio: service.costo_custodio,
        costo_armado: service.costo_armado,
        auto: service.auto,
        placa: service.placa,
        observaciones: service.observaciones,
        
        // Contactos
        nombre_operador: service.nombre_operador,
        telefono_operador: service.telefono_operador,
        contacto_emergencia_nombre: service.contacto_emergencia_nombre,
        contacto_emergencia_telefono: service.contacto_emergencia_telefono,
        
        updated_at: service.updated_at,
        fuente_tabla: 'servicios_custodia'
      }));

      const planificadosResults: ServiceQueryResult[] = (planificadosData || []).map(service => ({
        id: service.id,
        id_servicio: service.id_servicio || service.id,
        nombre_cliente: service.nombre_cliente || 'Cliente sin nombre',
        empresa_cliente: service.empresa_cliente,
        email_cliente: service.email_cliente,
        telefono_cliente: service.telefono_cliente,
        origen: service.origen || 'No especificado',
        destino: service.destino || 'No especificado',
        fecha_hora_cita: service.fecha_hora_cita,
        tipo_servicio: service.tipo_servicio || 'custodia',
        estado: service.estado_planeacion || 'planificado',
        
        // Cronología
        created_at: service.created_at,
        fecha_asignacion: service.fecha_asignacion,
        
        // Asignaciones
        nombre_custodio: service.custodio_asignado,
        custodio_id: service.custodio_id,
        armado_asignado: service.armado_asignado,
        incluye_armado: service.requiere_armado,
        
        // Planificación
        estado_planeacion: service.estado_planeacion,
        duracion_estimada: service.duracion_estimada,
        km_teoricos: service.km_teoricos,
        observaciones: service.observaciones,
        
        // Contactos
        nombre_operador: service.nombre_operador,
        telefono_operador: service.telefono_operador,
        contacto_emergencia_nombre: service.contacto_emergencia_nombre,
        contacto_emergencia_telefono: service.contacto_emergencia_telefono,
        
        updated_at: service.updated_at,
        fuente_tabla: 'servicios_planificados'
      }));

      const allResults = [...custodiaResults, ...planificadosResults];
      setResults(allResults);

      if (allResults.length === 0) {
        toast.info('No se encontraron servicios con ese ID');
      }

    } catch (err) {
      console.error('Error searching services:', err);
      
      // Mensajes de error específicos basados en el tipo de error
      let errorMessage = 'Error al buscar servicios';
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes('unaccent') || msg.includes('does not exist')) {
          errorMessage = 'Error de configuración del servidor. Contacta al administrador.';
          console.error('[ServiceQuery] RPC function error - unaccent not found:', err.message);
        } else if (msg.includes('structure of query') || msg.includes('result type')) {
          errorMessage = 'Error técnico en la consulta. Intenta de nuevo.';
          console.error('[ServiceQuery] RPC structure mismatch:', err.message);
        } else if (msg.includes('network') || msg.includes('fetch')) {
          errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
        } else if (msg.includes('timeout')) {
          errorMessage = 'La búsqueda tardó demasiado. Intenta con términos más específicos.';
        } else if (msg.includes('permission') || msg.includes('rls')) {
          errorMessage = 'No tienes permisos para realizar esta búsqueda.';
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByClientAndDate = useCallback(async (
    clientName: string,
    startDate?: Date,
    endDate?: Date
  ) => {
    if (!clientName.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query para servicios_custodia
      let custodiaQuery = supabase
        .from('servicios_custodia')
        .select('*')
        .ilike('nombre_cliente', `%${clientName}%`);

      if (startDate) {
        custodiaQuery = custodiaQuery.gte('fecha_hora_cita', startDate.toISOString());
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        custodiaQuery = custodiaQuery.lte('fecha_hora_cita', endDateTime.toISOString());
      }

      const { data: custodiaData, error: custodiaError } = await custodiaQuery
        .order('fecha_hora_cita', { ascending: false });

      if (custodiaError) throw custodiaError;

      // Query para servicios_planificados
      let planificadosQuery = supabase
        .from('servicios_planificados')
        .select('*')
        .ilike('nombre_cliente', `%${clientName}%`);

      if (startDate) {
        planificadosQuery = planificadosQuery.gte('fecha_hora_cita', startDate.toISOString());
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        planificadosQuery = planificadosQuery.lte('fecha_hora_cita', endDateTime.toISOString());
      }

      const { data: planificadosData, error: planificadosError } = await planificadosQuery
        .order('fecha_hora_cita', { ascending: false });

      if (planificadosError) throw planificadosError;

      // Mapear resultados igual que antes
      const custodiaResults: ServiceQueryResult[] = (custodiaData || []).map(service => ({
        id: service.id,
        id_servicio: service.id_servicio || service.id,
        nombre_cliente: service.nombre_cliente || 'Cliente sin nombre',
        empresa_cliente: service.empresa_cliente,
        email_cliente: service.email_cliente,
        telefono_cliente: service.telefono_cliente,
        origen: service.origen || 'No especificado',
        destino: service.destino || 'No especificado',
        fecha_hora_cita: service.fecha_hora_cita,
        tipo_servicio: service.tipo_servicio || 'custodia',
        estado: service.estado || 'pendiente',
        
        // Cronología con fallbacks
        created_at: service.created_at || service.updated_time || service.fecha_hora_cita,
        fecha_hora_asignacion: service.fecha_hora_asignacion,
        fecha_comunicacion: service.fecha_comunicacion,
        fecha_respuesta: service.fecha_respuesta,
        hora_inicio_custodia: service.hora_inicio_custodia || service.hora_presentacion || service.presentacion,
        hora_finalizacion: service.hora_finalizacion,
        tiempo_respuesta: service.tiempo_respuesta,
        duracion_servicio: service.duracion_servicio,
        tiempo_punto_origen: service.tiempo_punto_origen,
        tiempo_punto_destino: service.tiempo_punto_destino,
        hora_salida_origen: service.hora_salida_origen,
        hora_llegada_destino: service.hora_llegada_destino || service.hora_arribo,
        
        // Asignaciones con fallbacks
        nombre_custodio: service.nombre_custodio,
        id_custodio: service.id_custodio,
        telefono_custodio: service.telefono_custodio || service.telefono,
        incluye_armado: service.armado?.toUpperCase() === 'TRUE',
        
        // Ejecución
        km_recorridos: service.km_recorridos,
        cobro_cliente: service.cobro_cliente,
        costo_custodio: service.costo_custodio,
        costo_armado: service.costo_armado,
        auto: service.auto,
        placa: service.placa,
        observaciones: service.observaciones,
        
        // Contactos
        nombre_operador: service.nombre_operador,
        telefono_operador: service.telefono_operador,
        contacto_emergencia_nombre: service.contacto_emergencia_nombre,
        contacto_emergencia_telefono: service.contacto_emergencia_telefono,
        
        updated_at: service.updated_at,
        fuente_tabla: 'servicios_custodia'
      }));

      const planificadosResults: ServiceQueryResult[] = (planificadosData || []).map(service => ({
        id: service.id,
        id_servicio: service.id_servicio || service.id,
        nombre_cliente: service.nombre_cliente || 'Cliente sin nombre',
        empresa_cliente: service.empresa_cliente,
        email_cliente: service.email_cliente,
        telefono_cliente: service.telefono_cliente,
        origen: service.origen || 'No especificado',
        destino: service.destino || 'No especificado',
        fecha_hora_cita: service.fecha_hora_cita,
        tipo_servicio: service.tipo_servicio || 'custodia',
        estado: service.estado_planeacion || 'planificado',
        
        // Cronología
        created_at: service.created_at,
        fecha_hora_asignacion: service.fecha_hora_asignacion,
        fecha_asignacion: service.fecha_asignacion,
        
        // Asignaciones
        nombre_custodio: service.custodio_asignado,
        custodio_id: service.custodio_id,
        armado_asignado: service.armado_asignado,
        incluye_armado: service.requiere_armado,
        
        // Planificación
        estado_planeacion: service.estado_planeacion,
        duracion_estimada: service.duracion_estimada,
        km_teoricos: service.km_teoricos,
        observaciones: service.observaciones,
        
        // Contactos
        nombre_operador: service.nombre_operador,
        telefono_operador: service.telefono_operador,
        contacto_emergencia_nombre: service.contacto_emergencia_nombre,
        contacto_emergencia_telefono: service.contacto_emergencia_telefono,
        
        updated_at: service.updated_at,
        fuente_tabla: 'servicios_planificados'
      }));

      const allResults = [...custodiaResults, ...planificadosResults];
      setResults(allResults);

      if (allResults.length === 0) {
        toast.info('No se encontraron servicios para ese cliente');
      }

    } catch (err) {
      console.error('Error searching services:', err);
      
      // Mensajes de error específicos basados en el tipo de error
      let errorMessage = 'Error al buscar servicios';
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes('unaccent') || msg.includes('does not exist')) {
          errorMessage = 'Error de configuración del servidor. Contacta al administrador.';
          console.error('[ServiceQuery] RPC function error - unaccent not found:', err.message);
        } else if (msg.includes('structure of query') || msg.includes('result type')) {
          errorMessage = 'Error técnico en la consulta. Intenta de nuevo.';
          console.error('[ServiceQuery] RPC structure mismatch:', err.message);
        } else if (msg.includes('network') || msg.includes('fetch')) {
          errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
        } else if (msg.includes('timeout')) {
          errorMessage = 'La búsqueda tardó demasiado. Intenta con términos más específicos.';
        } else if (msg.includes('permission') || msg.includes('rls')) {
          errorMessage = 'No tienes permisos para realizar esta búsqueda.';
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchByServiceId,
    searchByClientAndDate,
    clearResults
  };
}
