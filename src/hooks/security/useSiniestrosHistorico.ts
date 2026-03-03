import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiniestroEvent {
  id: string;
  fecha_incidente: string;
  tipo: string;
  severidad: string;
  descripcion: string;
  zona: string | null;
  cliente_nombre: string | null;
  acciones_tomadas: string | null;
  es_siniestro: boolean;
}

export interface FillRateMonth {
  fecha: string;
  servicios_solicitados: number;
  servicios_completados: number;
  siniestros: number;
  eventos_no_criticos: number;
  nota: string | null;
}

export interface SiniestrosHistoricoResult {
  siniestros: SiniestroEvent[];
  fillRate: FillRateMonth[];
  totalSiniestros: number;
  totalEventosNoCriticos: number;
  tasaSiniestralidad: number; // per 1000 services
  monthlyTrend: { month: string; siniestros: number; noCriticos: number }[];
  isLoading: boolean;
  error: Error | null;
}

export function useSiniestrosHistorico(): SiniestrosHistoricoResult {
  const siniestrosQuery = useQuery({
    queryKey: ['siniestros-events'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('incidentes_operativos')
        .select('id, fecha_incidente, tipo, severidad, descripcion, zona, cliente_nombre, acciones_tomadas, es_siniestro')
        .eq('es_siniestro', true)
        .order('fecha_incidente', { ascending: false });
      if (error) throw error;
      return (data || []) as SiniestroEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const fillRateQuery = useQuery({
    queryKey: ['fill-rate-historico'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('siniestros_historico')
        .select('*')
        .order('fecha', { ascending: true });
      if (error) throw error;
      return (data || []) as FillRateMonth[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const siniestros = siniestrosQuery.data || [];
  const fillRate = fillRateQuery.data || [];

  const totalSiniestros = siniestros.length;
  const totalEventosNoCriticos = fillRate.reduce((sum, m) => sum + m.eventos_no_criticos, 0);
  
  // Calculate total services from fill rate (if available)
  const totalServices = fillRate.reduce((sum, m) => sum + m.servicios_completados, 0);
  const tasaSiniestralidad = totalServices > 0
    ? Math.round((totalSiniestros / totalServices) * 1000 * 100) / 100
    : 0;

  // Monthly trend from fill rate
  const monthlyTrend = fillRate
    .filter(m => m.siniestros > 0 || m.eventos_no_criticos > 0)
    .map(m => ({
      month: m.fecha.slice(0, 7),
      siniestros: m.siniestros,
      noCriticos: m.eventos_no_criticos,
    }));

  return {
    siniestros,
    fillRate,
    totalSiniestros,
    totalEventosNoCriticos,
    tasaSiniestralidad,
    monthlyTrend,
    isLoading: siniestrosQuery.isLoading || fillRateQuery.isLoading,
    error: (siniestrosQuery.error || fillRateQuery.error) as Error | null,
  };
}
