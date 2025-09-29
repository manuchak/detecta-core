import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScheduledService {
  id: string;
  cliente_nombre: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  custodio_nombre: string;
  armado_nombre?: string;
  estado: string;
  incluye_armado: boolean;
  armado_asignado: boolean;
  estado_asignacion?: string;
  auto?: string;
  placa?: string;
}

export interface ScheduledServicesSummary {
  total_services: number;
  assigned_services: number;
  pending_services: number;
  confirmed_services: number;
  services_data: ScheduledService[];
}

export function useScheduledServices(selectedDate: Date = new Date()) {
  const [summary, setSummary] = useState<ScheduledServicesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScheduledServices = async (date: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      // Use the new function for planned services
      const { data, error } = await supabase.rpc('get_planned_services_summary', {
        date_filter: dateStr
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        setSummary({
          total_services: result.total_services || 0,
          assigned_services: result.assigned_services || 0,
          pending_services: result.pending_services || 0,
          confirmed_services: result.confirmed_services || 0,
          services_data: result.services_data || []
        });
      } else {
        setSummary({
          total_services: 0,
          assigned_services: 0,
          pending_services: 0,
          confirmed_services: 0,
          services_data: []
        });
      }
    } catch (err) {
      console.error('Error loading planned services:', err);
      setError('Error al cargar servicios planificados');
      toast.error('Error al cargar servicios planificados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduledServices(selectedDate);
  }, [selectedDate]);

  const refetch = () => loadScheduledServices(selectedDate);

  return {
    summary,
    loading,
    error,
    refetch
  };
}