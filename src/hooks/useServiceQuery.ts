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
  
  // Asignaciones
  nombre_custodio?: string;
  armado_nombre?: string;
  armado_asignado?: boolean;
  incluye_armado?: boolean;
  
  // Información del servicio ejecutado
  km_recorridos?: number;
  cobro_cliente?: number;
  costo_custodio?: number;
  auto?: string;
  placa?: string;
  observaciones?: string;
  
  // Datos de planificación
  created_at?: string;
  fecha_asignacion?: string;
  estado_planeacion?: string;
  
  // Metadata
  fuente_tabla: 'servicios_custodia' | 'servicios_planificados';
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

    try {
      // Buscar en servicios_custodia primero
      const { data: custodiaData, error: custodiaError } = await supabase
        .from('servicios_custodia')
        .select('*')
        .ilike('id_servicio', `%${serviceId}%`)
        .order('fecha_hora_cita', { ascending: false });

      if (custodiaError) throw custodiaError;

      // Buscar en servicios_planificados
      const { data: planificadosData, error: planificadosError } = await supabase
        .from('servicios_planificados')
        .select('*')
        .ilike('id_servicio', `%${serviceId}%`)
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
        nombre_custodio: service.nombre_custodio,
        incluye_armado: service.armado?.toUpperCase() === 'TRUE',
        km_recorridos: service.km_recorridos,
        cobro_cliente: service.cobro_cliente,
        costo_custodio: service.costo_custodio,
        auto: service.auto,
        placa: service.placa,
        observaciones: service.observaciones,
        created_at: service.created_at,
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
        nombre_custodio: service.custodio_asignado,
        armado_asignado: service.armado_asignado,
        incluye_armado: service.requiere_armado,
        observaciones: service.observaciones,
        created_at: service.created_at,
        fecha_asignacion: service.fecha_asignacion,
        estado_planeacion: service.estado_planeacion,
        fuente_tabla: 'servicios_planificados'
      }));

      const allResults = [...custodiaResults, ...planificadosResults];
      setResults(allResults);

      if (allResults.length === 0) {
        toast.info('No se encontraron servicios con ese ID');
      }

    } catch (err) {
      console.error('Error searching services:', err);
      setError('Error al buscar servicios');
      toast.error('Error al buscar servicios');
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
        nombre_custodio: service.nombre_custodio,
        incluye_armado: service.armado?.toUpperCase() === 'TRUE',
        km_recorridos: service.km_recorridos,
        cobro_cliente: service.cobro_cliente,
        costo_custodio: service.costo_custodio,
        auto: service.auto,
        placa: service.placa,
        observaciones: service.observaciones,
        created_at: service.created_at,
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
        nombre_custodio: service.custodio_asignado,
        armado_asignado: service.armado_asignado,
        incluye_armado: service.requiere_armado,
        observaciones: service.observaciones,
        created_at: service.created_at,
        fecha_asignacion: service.fecha_asignacion,
        estado_planeacion: service.estado_planeacion,
        fuente_tabla: 'servicios_planificados'
      }));

      const allResults = [...custodiaResults, ...planificadosResults];
      setResults(allResults);

      if (allResults.length === 0) {
        toast.info('No se encontraron servicios para ese cliente');
      }

    } catch (err) {
      console.error('Error searching services:', err);
      setError('Error al buscar servicios');
      toast.error('Error al buscar servicios');
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
