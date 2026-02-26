import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ArmadoService {
  id: string;
  servicio_custodia_id: string | null;
  estado_asignacion: string;
  tarifa_acordada: number | null;
  punto_encuentro: string | null;
  hora_encuentro: string | null;
  tipo_asignacion: string;
  created_at: string;
  // From joined servicio_custodia
  nombre_cliente?: string;
  origen?: string;
  destino?: string;
  fecha_hora_cita?: string;
  tipo_servicio?: string;
}

export const useArmadoServices = (armadoOperativoId: string | null) => {
  const [services, setServices] = useState<ArmadoService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    if (!armadoOperativoId) {
      setServices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Query asignacion_armados for this armado
      const { data, error } = await supabase
        .from('asignacion_armados')
        .select(`
          id,
          servicio_custodia_id,
          estado_asignacion,
          tarifa_acordada,
          punto_encuentro,
          hora_encuentro,
          tipo_asignacion,
          created_at
        `)
        .eq('armado_id', armadoOperativoId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Enrich with service details
      const enriched: ArmadoService[] = [];
      
      for (const asignacion of (data || [])) {
        let serviceDetails: any = null;
        
        if (asignacion.servicio_custodia_id) {
          const { data: svc } = await supabase
            .from('servicios_custodia')
            .select('nombre_cliente, origen, destino, fecha_hora_cita, tipo_servicio')
            .eq('id', asignacion.servicio_custodia_id)
            .maybeSingle();
          serviceDetails = svc;
        }

        enriched.push({
          ...asignacion,
          nombre_cliente: serviceDetails?.nombre_cliente || 'Sin cliente',
          origen: serviceDetails?.origen || '',
          destino: serviceDetails?.destino || '',
          fecha_hora_cita: serviceDetails?.fecha_hora_cita || asignacion.created_at,
          tipo_servicio: serviceDetails?.tipo_servicio || asignacion.tipo_asignacion,
        });
      }

      setServices(enriched);
    } catch (error) {
      console.error('Error fetching armado services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [armadoOperativoId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const stats = useMemo(() => {
    const total = services.length;
    const completados = services.filter(s => 
      ['completado', 'finalizado', 'Completado', 'Finalizado'].includes(s.estado_asignacion)
    ).length;
    const pendientes = services.filter(s => 
      ['pendiente', 'confirmado', 'asignado', 'en_ruta'].includes(s.estado_asignacion)
    ).length;
    const ingresosTotales = services.reduce((sum, s) => sum + (s.tarifa_acordada || 0), 0);

    return { total, completados, pendientes, ingresosTotales };
  }, [services]);

  const getRecentServices = useCallback((count: number) => {
    return services.slice(0, count);
  }, [services]);

  return { services, stats, loading, getRecentServices, refetch: fetchServices };
};
