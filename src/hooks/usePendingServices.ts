import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface PendingService {
  id: string;
  id_servicio: string;
  id_interno_cliente?: string; // Referencia cliente - crítico para facturación
  nombre_cliente: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  tipo_servicio: string;
  requiere_armado: boolean;
  observaciones?: string;
  created_at: string;
  // Campos adicionales para servicios existentes
  custodio_asignado?: string;
  armado_asignado?: string;
  estado?: string;
}

export interface PendingServicesSummary {
  total_pending: number;
  pending_services: PendingService[];
}

export function usePendingServices(selectedDate: Date = new Date()) {
  const [summary, setSummary] = useState<PendingServicesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPendingServices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Formatear fecha usando date-fns para evitar bug de timezone
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Obtener servicios planificados sin custodio asignado del día seleccionado
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('*')
        .is('custodio_asignado', null)
        .not('estado_planeacion', 'in', '(cancelado,completado)')
        .gte('fecha_hora_cita', `${dateStr}T00:00:00`)
        .lt('fecha_hora_cita', `${dateStr}T23:59:59`)
        .order('fecha_hora_cita', { ascending: true });

      if (error) throw error;

      const pendingServices: PendingService[] = (data || []).map(service => ({
        id: service.id,
        id_servicio: service.id_servicio,
        id_interno_cliente: service.id_interno_cliente, // Referencia cliente
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
  }, [selectedDate]);

  const refetch = () => loadPendingServices();

  return {
    summary,
    loading,
    error,
    refetch
  };
}