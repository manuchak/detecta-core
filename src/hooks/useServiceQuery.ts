import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CDMX_OFFSET } from '@/utils/cdmxTimezone';

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
      // ✅ Usar Promise.allSettled para resiliencia - si una tabla falla, aún mostramos la otra
      const [custodiaResult, planificadosResult] = await Promise.allSettled([
        supabase
          .from('servicios_custodia')
          .select('*')
          .ilike('id_servicio', `%${normalizedId}%`)
          .order('fecha_hora_cita', { ascending: false }),
        supabase
          .from('servicios_planificados')
          .select('*')
          .or(`id_servicio.ilike.%${normalizedId}%,id_interno_cliente.ilike.%${normalizedId}%`)
          .order('fecha_hora_cita', { ascending: false })
      ]);

      // Extraer datos con manejo de errores individuales
      const custodiaData = custodiaResult.status === 'fulfilled' && !custodiaResult.value.error
        ? custodiaResult.value.data
        : [];
      const planificadosData = planificadosResult.status === 'fulfilled' && !planificadosResult.value.error
        ? planificadosResult.value.data
        : [];

      // Log de advertencias si alguna tabla falló
      if (custodiaResult.status === 'rejected' || (custodiaResult.status === 'fulfilled' && custodiaResult.value.error)) {
        console.warn('[ServiceQuery] No access to servicios_custodia, showing only planificados');
      }
      if (planificadosResult.status === 'rejected' || (planificadosResult.status === 'fulfilled' && planificadosResult.value.error)) {
        console.warn('[ServiceQuery] No access to servicios_planificados, showing only custodia');
      }

      // Si ambas fallaron, entonces sí lanzar error
      const bothFailed = 
        (custodiaResult.status === 'rejected' || custodiaResult.value?.error) &&
        (planificadosResult.status === 'rejected' || planificadosResult.value?.error);
      
      if (bothFailed) {
        throw new Error('No tienes permisos para realizar búsquedas en ninguna tabla');
      }

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

      // ✅ Deduplicar: priorizar servicios_custodia sobre servicios_planificados
      // Si un id_servicio existe en custodia, excluirlo de planificados
      const custodiaIds = new Set(
        custodiaResults
          .map(s => s.id_servicio?.trim().toUpperCase())
          .filter((id): id is string => !!id)
      );
      
      console.log('[ServiceQuery] Dedup - Custodia IDs:', Array.from(custodiaIds));
      
      const planificadosSinDuplicados = planificadosResults.filter(s => {
        const normalizedId = s.id_servicio?.trim().toUpperCase();
        const isDuplicate = normalizedId ? custodiaIds.has(normalizedId) : false;
        if (isDuplicate) {
          console.log('[ServiceQuery] Removing duplicate planificado:', s.id_servicio);
        }
        return !isDuplicate;
      });

      // Ordenar: servicios_custodia primero, luego planificados
      const allResults = [...custodiaResults, ...planificadosSinDuplicados].sort((a, b) => {
        if (a.fuente_tabla === 'servicios_custodia' && b.fuente_tabla !== 'servicios_custodia') return -1;
        if (b.fuente_tabla === 'servicios_custodia' && a.fuente_tabla !== 'servicios_custodia') return 1;
        return new Date(b.fecha_hora_cita).getTime() - new Date(a.fecha_hora_cita).getTime();
      });
      
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
      // ✅ FIX: Construir rangos explícitos en CDMX para evitar exclusiones por shift UTC
      const startISO = startDate 
        ? `${format(startDate, 'yyyy-MM-dd')}T00:00:00${CDMX_OFFSET}` 
        : undefined;
      const endISO = endDate 
        ? `${format(endDate, 'yyyy-MM-dd')}T23:59:59${CDMX_OFFSET}` 
        : undefined;

      // ✅ Construir queries
      let custodiaQuery = supabase
        .from('servicios_custodia')
        .select('*')
        .ilike('nombre_cliente', `%${clientName}%`);

      if (startISO) custodiaQuery = custodiaQuery.gte('fecha_hora_cita', startISO);
      if (endISO) custodiaQuery = custodiaQuery.lte('fecha_hora_cita', endISO);

      let planificadosQuery = supabase
        .from('servicios_planificados')
        .select('*')
        .ilike('nombre_cliente', `%${clientName}%`);

      if (startISO) planificadosQuery = planificadosQuery.gte('fecha_hora_cita', startISO);
      if (endISO) planificadosQuery = planificadosQuery.lte('fecha_hora_cita', endISO);

      // ✅ Usar Promise.allSettled para resiliencia
      const [custodiaResult, planificadosResult] = await Promise.allSettled([
        custodiaQuery.order('fecha_hora_cita', { ascending: false }),
        planificadosQuery.order('fecha_hora_cita', { ascending: false })
      ]);

      // Extraer datos con manejo de errores individuales
      const custodiaData = custodiaResult.status === 'fulfilled' && !custodiaResult.value.error
        ? custodiaResult.value.data
        : [];
      const planificadosData = planificadosResult.status === 'fulfilled' && !planificadosResult.value.error
        ? planificadosResult.value.data
        : [];

      // Log de advertencias si alguna tabla falló
      if (custodiaResult.status === 'rejected' || (custodiaResult.status === 'fulfilled' && custodiaResult.value.error)) {
        console.warn('[ServiceQuery] No access to servicios_custodia, showing only planificados');
      }

      // Si ambas fallaron, lanzar error
      const bothFailed = 
        (custodiaResult.status === 'rejected' || custodiaResult.value?.error) &&
        (planificadosResult.status === 'rejected' || planificadosResult.value?.error);
      
      if (bothFailed) {
        throw new Error('No tienes permisos para realizar búsquedas en ninguna tabla');
      }

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

      // ✅ Deduplicar: priorizar servicios_custodia sobre servicios_planificados
      const custodiaIds = new Set(
        custodiaResults
          .map(s => s.id_servicio?.trim().toUpperCase())
          .filter((id): id is string => !!id)
      );
      
      const planificadosSinDuplicados = planificadosResults.filter(s => {
        const normalizedId = s.id_servicio?.trim().toUpperCase();
        return !(normalizedId && custodiaIds.has(normalizedId));
      });

      // Ordenar: servicios_custodia primero, luego planificados
      const allResults = [...custodiaResults, ...planificadosSinDuplicados].sort((a, b) => {
        if (a.fuente_tabla === 'servicios_custodia' && b.fuente_tabla !== 'servicios_custodia') return -1;
        if (b.fuente_tabla === 'servicios_custodia' && a.fuente_tabla !== 'servicios_custodia') return 1;
        return new Date(b.fecha_hora_cita).getTime() - new Date(a.fecha_hora_cita).getTime();
      });
      
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
