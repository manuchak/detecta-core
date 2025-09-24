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
      // Obtener servicios con custodio asignado pero sin armado
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('*')
        .eq('requiere_armado', true)
        .is('armado_asignado', null)
        .not('custodio_asignado', 'is', null)
        .not('estado_planeacion', 'in', '(cancelado,completado)')
        .order('fecha_hora_cita', { ascending: true });

      if (error) throw error;

      const pendingArmadoServices: PendingArmadoService[] = (data || []).map(service => ({
        id: service.id,
        id_servicio: service.id_servicio,
        nombre_cliente: service.nombre_cliente,
        origen: service.origen,
        destino: service.destino,
        fecha_hora_cita: service.fecha_hora_cita,
        tipo_servicio: service.tipo_servicio,
        custodio_asignado: service.custodio_asignado,
        observaciones: service.observaciones,
        created_at: service.created_at
      }));

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