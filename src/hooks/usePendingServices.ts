import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PendingService {
  id: string;
  id_servicio: string;
  nombre_cliente: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  tipo_servicio: string;
  requiere_armado: boolean;
  observaciones?: string;
  created_at: string;
}

export interface PendingServicesSummary {
  total_pending: number;
  pending_services: PendingService[];
}

export function usePendingServices() {
  const [summary, setSummary] = useState<PendingServicesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPendingServices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener servicios planificados sin custodio asignado (pendientes)
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('*')
        .is('custodio_asignado', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pendingServices: PendingService[] = (data || []).map(service => ({
        id: service.id,
        id_servicio: service.id_servicio,
        nombre_cliente: service.nombre_cliente,
        origen: service.origen,
        destino: service.destino,
        fecha_hora_cita: service.fecha_hora_cita,
        tipo_servicio: service.tipo_servicio,
        requiere_armado: service.requiere_armado || false,
        observaciones: service.observaciones,
        created_at: service.created_at
      }));

      setSummary({
        total_pending: pendingServices.length,
        pending_services: pendingServices
      });
    } catch (err) {
      console.error('Error loading pending services:', err);
      setError('Error al cargar servicios pendientes');
      toast.error('Error al cargar servicios pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingServices();
  }, []);

  const refetch = () => loadPendingServices();

  return {
    summary,
    loading,
    error,
    refetch
  };
}