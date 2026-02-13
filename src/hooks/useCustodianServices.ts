import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    fetchCustodianServices();
  }, [custodianPhone]);

  const fetchCustodianServices = async () => {
    try {
      setLoading(true);

      // Si no hay teléfono de custodio, establecer datos vacíos
      if (!custodianPhone) {
        setServices([]);
        setStats({
          total_servicios: 0,
          servicios_completados: 0,
          servicios_pendientes: 0,
          km_totales: 0,
          ingresos_totales: 0
        });
        setLoading(false);
        return;
      }

      // Normalizar teléfono (quitar espacios y guiones)
      const normalizedPhone = custodianPhone.replace(/[\s-]/g, '');

      // Fetch services by phone number
      const { data: servicesData, error: servicesError } = await supabase
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
        .limit(50);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        // En caso de error, establecer datos vacíos en lugar de fallar
        setServices([]);
        setStats({
          total_servicios: 0,
          servicios_completados: 0,
          servicios_pendientes: 0,
          km_totales: 0,
          ingresos_totales: 0
        });
        setLoading(false);
        return;
      }

      const services = servicesData || [];
      setServices(services);

      // Calculate stats
      const stats: CustodianStats = {
        total_servicios: services.length,
        servicios_completados: services.filter(s => 
          ['completado', 'finalizado', 'Completado', 'Finalizado'].includes(s.estado)
        ).length,
        servicios_pendientes: services.filter(s => 
          ['pendiente', 'programado', 'en_proceso', 'Pendiente', 'Programado'].includes(s.estado)
        ).length,
        km_totales: services.reduce((total, s) => total + (s.km_recorridos || 0), 0),
        ingresos_totales: services
          .filter(s => ['completado', 'finalizado', 'Completado', 'Finalizado'].includes(s.estado))
          .reduce((total, s) => total + (s.cobro_cliente || 0), 0)
      };

      setStats(stats);

    } catch (error) {
      console.error('Error fetching custodian services:', error);
      // En caso de error, establecer datos vacíos y NO mostrar toast para evitar spam
      setServices([]);
      setStats({
        total_servicios: 0,
        servicios_completados: 0,
        servicios_pendientes: 0,
        km_totales: 0,
        ingresos_totales: 0
      });
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
      return serviceDate > now && ['pendiente', 'programado'].includes(status);
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