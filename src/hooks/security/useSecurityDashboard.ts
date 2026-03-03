import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityKPIs {
  totalIncidents: number;
  criticalIncidents: number;
  avgRiskScore: number;
  zonesMonitored: number;
  safePointsVerified: number;
  daysSinceLastCritical: number;
  servicesInRedZones: number;
  complianceRate: number;
  // New from incidentes_operativos
  operativeIncidents: number;
  operativeCritical: number;
  controlEffectivenessRate: number;
}

export interface OperativeEvent {
  tipo: string;
  severidad: string;
  fecha_incidente: string;
  atribuible_operacion: boolean;
  control_efectivo: boolean | null;
}

export function useSecurityDashboard() {
  const riskZonesQuery = useQuery({
    queryKey: ['security-dashboard-zones'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('risk_zone_scores')
        .select('risk_level, final_score, event_count');
      if (error) throw error;
      return data as { risk_level: string; final_score: number; event_count: number }[];
    },
  });

  const eventsQuery = useQuery({
    queryKey: ['security-dashboard-events'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('security_events')
        .select('severity, event_date, event_type, verified')
        .order('event_date', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as { severity: string; event_date: string; event_type: string; verified: boolean }[];
    },
  });

  const safePointsQuery = useQuery({
    queryKey: ['security-dashboard-safepoints'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('safe_points')
        .select('certification_level, verification_status')
        .eq('is_active', true);
      if (error) throw error;
      return data as { certification_level: string; verification_status: string }[];
    },
  });

  // NEW: Query incidentes_operativos for internal KPIs
  const operativeQuery = useQuery({
    queryKey: ['security-dashboard-operative'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('incidentes_operativos')
        .select('tipo, severidad, fecha_incidente, atribuible_operacion, control_efectivo, controles_activos')
        .order('fecha_incidente', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as (OperativeEvent & { controles_activos: string[] | null })[];
    },
  });

  const zones = riskZonesQuery.data || [];
  const events = eventsQuery.data || [];
  const safePoints = safePointsQuery.data || [];
  const operativeEvents = operativeQuery.data || [];

  const criticalEvents = events.filter(e => e.severity === 'critico' || e.severity === 'alto');
  const avgScore = zones.length > 0
    ? zones.reduce((sum, z) => sum + Number(z.final_score), 0) / zones.length
    : 0;

  // Days since last critical event (from security_events)
  const lastCritical = criticalEvents[0];
  const daysSince = lastCritical
    ? Math.floor((Date.now() - new Date(lastCritical.event_date).getTime()) / 86400000)
    : 999;

  const riskDistribution = {
    extremo: zones.filter(z => z.risk_level === 'extremo').length,
    alto: zones.filter(z => z.risk_level === 'alto').length,
    medio: zones.filter(z => z.risk_level === 'medio').length,
    bajo: zones.filter(z => z.risk_level === 'bajo').length,
  };

  // Operative KPIs
  const opCritical = operativeEvents.filter(e => e.severidad === 'critica' || e.severidad === 'alta');
  const withControls = operativeEvents.filter(e => e.controles_activos && e.controles_activos.length > 0);
  const controlEffective = withControls.filter(e => e.control_efectivo === true).length;
  const controlEffectivenessRate = withControls.length > 0
    ? Math.round((controlEffective / withControls.length) * 100)
    : 0;

  const kpis: SecurityKPIs = {
    totalIncidents: events.length,
    criticalIncidents: criticalEvents.length,
    avgRiskScore: Math.round(avgScore * 10) / 10,
    zonesMonitored: zones.length,
    safePointsVerified: safePoints.filter(sp => sp.verification_status === 'verified').length,
    daysSinceLastCritical: daysSince,
    servicesInRedZones: zones.filter(z => z.risk_level === 'extremo' || z.risk_level === 'alto').length,
    complianceRate: 0,
    operativeIncidents: operativeEvents.length,
    operativeCritical: opCritical.length,
    controlEffectivenessRate,
  };

  // Separate recent events by source
  const recentOperative: OperativeEvent[] = operativeEvents.slice(0, 10);
  const recentExternal = events.slice(0, 10);

  return {
    kpis,
    riskDistribution,
    recentEvents: recentExternal,
    recentOperative,
    isLoading: riskZonesQuery.isLoading || eventsQuery.isLoading || safePointsQuery.isLoading || operativeQuery.isLoading,
    error: riskZonesQuery.error || eventsQuery.error || safePointsQuery.error || operativeQuery.error,
  };
}
