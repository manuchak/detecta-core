import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { normalizePhone } from '@/lib/phoneUtils';

interface CustodianService {
  id_servicio: string;
  nombre_cliente: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  estado: string;
  tipo_servicio: string;
  km_recorridos?: number;
  cobro_cliente?: number;
  comentarios_adicionales?: string;
}

interface CustodianStats {
  total_servicios: number;
  servicios_completados: number;
  servicios_pendientes: number;
  km_totales: number;
  ingresos_totales: number;
}

const COMPLETED_STATES = ['completado', 'finalizado'];
const PENDING_STATES = ['pendiente', 'programado', 'en_proceso', 'planificado', 'asignado', 'confirmado', 'en_transito'];

function matchesState(estado: string, list: string[]): boolean {
  return list.includes(estado.toLowerCase());
}

export const useCustodianServices = (custodianPhone?: string) => {
  const [services, setServices] = useState<CustodianService[]>([]);
  const [stats, setStats] = useState<CustodianStats>({
    total_servicios: 0,
    servicios_completados: 0,
    servicios_pendientes: 0,
    km_totales: 0,
    ingresos_totales: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const emptyStats: CustodianStats = {
    total_servicios: 0,
    servicios_completados: 0,
    servicios_pendientes: 0,
    km_totales: 0,
    ingresos_totales: 0
  };

  useEffect(() => {
    fetchCustodianServices();
  }, [custodianPhone]);

  const fetchCustodianServices = async () => {
    try {
      setLoading(true);

      if (!custodianPhone) {
        setServices([]);
        setStats(emptyStats);
        setLoading(false);
        return;
      }

      const normalizedPhone = normalizePhone(custodianPhone);

      // Query both tables in parallel
      const [legacyResult, planificadosResult] = await Promise.all([
        // 1. Legacy: servicios_custodia
        supabase
          .from('servicios_custodia')
          .select(`
            id_servicio,
            nombre_cliente,
            origen,
            destino,
            fecha_hora_cita,
            estado,
            tipo_servicio,
            km_recorridos,
            cobro_cliente,
            comentarios_adicionales
          `)
          .or(`telefono.eq.${normalizedPhone},telefono_operador.eq.${normalizedPhone}`)
          .order('fecha_hora_cita', { ascending: false })
          .limit(200),

        // 2. Nuevo: servicios_planificados
        supabase
          .from('servicios_planificados')
          .select(`
            id_servicio,
            nombre_cliente,
            origen,
            destino,
            fecha_hora_cita,
            estado_planeacion,
            tipo_servicio,
            km_recorridos,
            cobro_cliente,
            comentarios_adicionales
          `)
          .eq('custodio_telefono', normalizedPhone)
          .order('fecha_hora_cita', { ascending: false })
          .limit(200)
      ]);

      if (legacyResult.error) {
        console.error('Error fetching servicios_custodia:', legacyResult.error);
      }
      if (planificadosResult.error) {
        console.error('Error fetching servicios_planificados:', planificadosResult.error);
      }

      // Map planificados to common format
      const legacyServices: CustodianService[] = (legacyResult.data || []);
      const planificadosServices: CustodianService[] = (planificadosResult.data || []).map(p => ({
        id_servicio: p.id_servicio || '',
        nombre_cliente: p.nombre_cliente || 'Cliente',
        origen: p.origen || '',
        destino: p.destino || '',
        fecha_hora_cita: p.fecha_hora_cita,
        estado: p.estado_planeacion || 'planificado',
        tipo_servicio: p.tipo_servicio || 'custodia',
        km_recorridos: p.km_recorridos ?? undefined,
        cobro_cliente: p.cobro_cliente ?? undefined,
        comentarios_adicionales: p.comentarios_adicionales ?? undefined,
      }));

      // Merge deduplicating by id_servicio (legacy takes precedence)
      const seenIds = new Set<string>();
      const merged: CustodianService[] = [];

      for (const s of legacyServices) {
        if (s.id_servicio && !seenIds.has(s.id_servicio)) {
          seenIds.add(s.id_servicio);
          merged.push(s);
        }
      }
      for (const s of planificadosServices) {
        if (s.id_servicio && !seenIds.has(s.id_servicio)) {
          seenIds.add(s.id_servicio);
          merged.push(s);
        }
      }

      // Sort by date descending
      merged.sort((a, b) =>
        new Date(b.fecha_hora_cita).getTime() - new Date(a.fecha_hora_cita).getTime()
      );

      setServices(merged);

      // Calculate stats
      const calculatedStats: CustodianStats = {
        total_servicios: merged.length,
        servicios_completados: merged.filter(s => matchesState(s.estado, COMPLETED_STATES)).length,
        servicios_pendientes: merged.filter(s => matchesState(s.estado, PENDING_STATES)).length,
        km_totales: merged.reduce((total, s) => total + (s.km_recorridos || 0), 0),
        ingresos_totales: merged
          .filter(s => matchesState(s.estado, COMPLETED_STATES))
          .reduce((total, s) => total + (s.cobro_cliente || 0), 0)
      };

      setStats(calculatedStats);

    } catch (error) {
      console.error('Error fetching custodian services:', error);
      setServices([]);
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  };

  const getRecentServices = (limit: number = 5) => {
    return services.slice(0, limit);
  };

  const getUpcomingServices = () => {
    const now = new Date();
    return services.filter(service => {
      if (!service.fecha_hora_cita) return false;
      const serviceDate = new Date(service.fecha_hora_cita);
      const status = service.estado?.toLowerCase() || '';
      return serviceDate > now && PENDING_STATES.includes(status);
    });
  };

  return {
    services,
    stats,
    loading,
    getRecentServices,
    getUpcomingServices,
    refetch: fetchCustodianServices
  };
};
