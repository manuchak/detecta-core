import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PendingArmadoService {
  id: string;
  id_servicio: string;
  nombre_cliente: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  tipo_servicio: string;
  custodio_asignado: string;
  observaciones?: string;
  created_at: string;
  cantidad_armados_requeridos: number;
  armados_asignados_count: number;
}

export interface PendingArmadoServicesSummary {
  total_pending_armado: number;
  pending_armado_services: PendingArmadoService[];
}

export function usePendingArmadoServices() {
  const [summary, setSummary] = useState<PendingArmadoServicesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPendingArmadoServices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all services that require armed guards and aren't terminal
      const { data: services, error: svcError } = await supabase
        .from('servicios_planificados')
        .select('id, id_servicio, nombre_cliente, origen, destino, fecha_hora_cita, tipo_servicio, custodio_asignado, observaciones, created_at, cantidad_armados_requeridos, requiere_armado')
        .eq('requiere_armado', true)
        .not('custodio_asignado', 'is', null)
        .not('estado_planeacion', 'in', '(cancelado,completado)')
        .order('fecha_hora_cita', { ascending: true });

      if (svcError) throw svcError;
      if (!services || services.length === 0) {
        setSummary({ total_pending_armado: 0, pending_armado_services: [] });
        return;
      }

      // Batch: get count of assigned armados per service from asignacion_armados
      const serviceIds = services.map(s => s.id_servicio).filter(Boolean);
      const { data: assignments, error: assignError } = await supabase
        .from('asignacion_armados')
        .select('servicio_custodia_id')
        .in('servicio_custodia_id', serviceIds)
        .not('estado_asignacion', 'eq', 'cancelado');

      if (assignError) throw assignError;

      // Count assignments per service
      const countMap = new Map<string, number>();
      (assignments || []).forEach(a => {
        const id = a.servicio_custodia_id;
        if (id) countMap.set(id, (countMap.get(id) || 0) + 1);
      });

      // Filter: only services where assigned < required
      const pendingArmadoServices: PendingArmadoService[] = services
        .map(service => {
          const required = service.cantidad_armados_requeridos || 1;
          const assigned = countMap.get(service.id_servicio) || 0;
          return {
            id: service.id,
            id_servicio: service.id_servicio,
            nombre_cliente: service.nombre_cliente,
            origen: service.origen,
            destino: service.destino,
            fecha_hora_cita: service.fecha_hora_cita,
            tipo_servicio: service.tipo_servicio,
            custodio_asignado: service.custodio_asignado,
            observaciones: service.observaciones,
            created_at: service.created_at,
            cantidad_armados_requeridos: required,
            armados_asignados_count: assigned,
          };
        })
        .filter(s => s.armados_asignados_count < s.cantidad_armados_requeridos);

      setSummary({
        total_pending_armado: pendingArmadoServices.length,
        pending_armado_services: pendingArmadoServices
      });
    } catch (err) {
      console.error('Error loading pending armado services:', err);
      setError('Error al cargar servicios pendientes de armado');
      toast.error('Error al cargar servicios pendientes de armado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingArmadoServices();
  }, []);

  const refetch = () => loadPendingArmadoServices();

  return {
    summary,
    loading,
    error,
    refetch
  };
}