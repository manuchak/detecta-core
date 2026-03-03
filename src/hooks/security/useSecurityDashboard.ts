import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, differenceInDays } from 'date-fns';

export interface SecurityKPIs {
  totalIncidents: number;
  criticalIncidents: number;
  avgRiskScore: number;
  zonesMonitored: number;
  safePointsVerified: number;
  daysSinceLastCritical: number;
  /** Total H3 zones alto+extremo in national network (structural) */
  zonesHighRisk: number;
  complianceRate: number;
  // Operative
  operativeIncidents: number;
  operativeCritical: number;
  controlEffectivenessRate: number;
  // Checklist-based
  checklistsCompleted: number;
  totalServicesInPeriod: number;
  /** Human-readable label for the effectiveness period */
  effectivenessPeriodLabel: string;
  /** Siniestros streak in days */
  daysSinceLastSiniestro: number;
  /** Number of siniestros in last 90 days */
  siniestrosRecent: number;
  // Legacy compat
  servicesInRedZones: number;
}

export interface OperativeEvent {
  tipo: string;
  severidad: string;
  fecha_incidente: string;
  atribuible_operacion: boolean;
  control_efectivo: boolean | null;
}

export interface DailyIncidentEntry {
  date: string;
  count: number;
  maxSeverity: string;
  /** Count of only siniestros (robberies) this day */
  siniestroCount: number;
  /** Count of operative incidents that are NOT siniestros */
  operativeCount: number;
  /** Count of external intel events */
  intelCount: number;
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

  // Operative incidents
  const operativeQuery = useQuery({
    queryKey: ['security-dashboard-operative'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('incidentes_operativos')
        .select('tipo, severidad, fecha_incidente, atribuible_operacion, control_efectivo, controles_activos, es_siniestro')
        .order('fecha_incidente', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as (OperativeEvent & { controles_activos: string[] | null; es_siniestro: boolean })[];
    },
  });

  // Checklist data for control effectiveness
  const checklistQuery = useQuery({
    queryKey: ['security-dashboard-checklists'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('checklist_servicio')
        .select('id, created_at')
        .limit(5000);
      if (error) throw error;
      return data as { id: string; created_at: string }[];
    },
  });

  // Fill rate for total services — uses 'fecha' column (date, e.g. '2026-02-01')
  const fillRateQuery = useQuery({
    queryKey: ['security-dashboard-fillrate'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('siniestros_historico')
        .select('fecha, servicios_completados')
        .order('fecha', { ascending: true })
        .limit(100);
      if (error) throw error;
      return data as { fecha: string; servicios_completados: number }[];
    },
  });

  const zones = riskZonesQuery.data || [];
  const events = eventsQuery.data || [];
  const safePoints = safePointsQuery.data || [];
  const operativeEvents = operativeQuery.data || [];
  const checklists = checklistQuery.data || [];
  const fillRateData = fillRateQuery.data || [];

  const criticalEvents = events.filter(e => e.severity === 'critico' || e.severity === 'alto');
  const avgScore = zones.length > 0
    ? zones.reduce((sum, z) => sum + Number(z.final_score), 0) / zones.length
    : 0;

  // Days since last SINIESTRO (real critical = robbery/loss)
  const now = new Date();
  const lastSiniestro = operativeEvents.find(e => e.es_siniestro === true);
  const daysSinceSiniestro = lastSiniestro
    ? Math.floor((now.getTime() - new Date(lastSiniestro.fecha_incidente).getTime()) / 86400000)
    : 999;

  const riskDistribution = {
    extremo: zones.filter(z => z.risk_level === 'extremo').length,
    alto: zones.filter(z => z.risk_level === 'alto').length,
    medio: zones.filter(z => z.risk_level === 'medio').length,
    bajo: zones.filter(z => z.risk_level === 'bajo').length,
  };

  // Operative KPIs — 90-day window only
  const ninetyDaysAgo = subDays(now, 90).toISOString();
  const recentOperativeEvents = operativeEvents.filter(e => e.fecha_incidente >= ninetyDaysAgo);
  const opCriticalRecent = recentOperativeEvents.filter(e => e.es_siniestro === true);

  // =========================================================================
  // CONTROL EFFECTIVENESS — Corrected: only count services from checklist era
  // Checklists started Feb 12 2026. We compare checklists vs services in that
  // same window, not against 27 months of historical data.
  // =========================================================================
  const CHECKLIST_START = '2026-02-12';
  const checklistStartDate = new Date(CHECKLIST_START);
  const checklistsCompleted = checklists.length;

  // Filter fillRate rows to months >= Feb 2026 using 'fecha' column
  const servicesInChecklistPeriod = fillRateData
    .filter(r => r.fecha >= '2026-02-01')
    .reduce((s, r) => s + r.servicios_completados, 0);

  // No fallback — if no services in checklist period, show 0%
  const effectiveDenominator = servicesInChecklistPeriod;

  const controlEffectivenessRate = effectiveDenominator > 0
    ? Math.round((checklistsCompleted / effectiveDenominator) * 100)
    : 0;

  // Period label
  const daysSinceChecklistStart = differenceInDays(now, checklistStartDate);
  const weeksLabel = Math.ceil(daysSinceChecklistStart / 7);
  const effectivenessPeriodLabel = weeksLabel <= 8
    ? `Últimas ${weeksLabel} semanas (desde 12-Feb)`
    : `Desde Feb 2026`;

  const zonesHighRisk = zones.filter(z => z.risk_level === 'extremo' || z.risk_level === 'alto').length;

  const kpis: SecurityKPIs = {
    totalIncidents: events.length,
    criticalIncidents: criticalEvents.length,
    avgRiskScore: Math.round(avgScore * 10) / 10,
    zonesMonitored: zones.length,
    safePointsVerified: safePoints.filter(sp => sp.verification_status === 'verified').length,
    daysSinceLastCritical: daysSinceSiniestro,
    zonesHighRisk,
    servicesInRedZones: zonesHighRisk, // legacy compat
    complianceRate: 0,
    operativeIncidents: operativeEvents.length,
    operativeCritical: opCriticalRecent.length,
    controlEffectivenessRate,
    checklistsCompleted,
    totalServicesInPeriod: effectiveDenominator,
    effectivenessPeriodLabel,
    daysSinceLastSiniestro: daysSinceSiniestro,
    siniestrosRecent: opCriticalRecent.length,
  };

  // =========================================================================
  // HEATMAP: Separate siniestros / operative / intel per day
  // =========================================================================
  const heatmapData: DailyIncidentEntry[] = (() => {
    const map = new Map<string, { count: number; maxSev: string; siniestroCount: number; operativeCount: number; intelCount: number }>();
    const sevOrder: Record<string, number> = { critica: 4, alta: 3, media: 2, baja: 1, critico: 4, alto: 3, medio: 2, bajo: 1 };

    // Operative events
    for (const e of operativeEvents) {
      const d = e.fecha_incidente?.slice(0, 10);
      if (!d) continue;
      const existing = map.get(d) || { count: 0, maxSev: '', siniestroCount: 0, operativeCount: 0, intelCount: 0 };
      existing.count++;
      if (e.es_siniestro) {
        existing.siniestroCount++;
      } else {
        existing.operativeCount++;
      }
      const sevVal = sevOrder[e.severidad] || 0;
      if (sevVal > (sevOrder[existing.maxSev] || 0)) existing.maxSev = e.severidad;
      map.set(d, existing);
    }

    // External intel events
    for (const e of events) {
      const d = e.event_date?.slice(0, 10);
      if (!d) continue;
      const existing = map.get(d) || { count: 0, maxSev: '', siniestroCount: 0, operativeCount: 0, intelCount: 0 };
      existing.count++;
      existing.intelCount++;
      const sevVal = sevOrder[e.severity] || 0;
      if (sevVal > (sevOrder[existing.maxSev] || 0)) existing.maxSev = e.severity;
      map.set(d, existing);
    }

    const result: DailyIncidentEntry[] = [];
    for (let i = 27; i >= 0; i--) {
      const key = format(subDays(now, i), 'yyyy-MM-dd');
      const entry = map.get(key);
      result.push({
        date: key,
        count: entry?.count ?? 0,
        maxSeverity: entry?.maxSev ?? '',
        siniestroCount: entry?.siniestroCount ?? 0,
        operativeCount: entry?.operativeCount ?? 0,
        intelCount: entry?.intelCount ?? 0,
      });
    }
    return result;
  })();

  const intelByLevel = {
    extremo: events.filter(e => e.severity === 'critico').length,
    alto: events.filter(e => e.severity === 'alto').length,
    medio: events.filter(e => e.severity === 'medio').length,
    bajo: events.filter(e => e.severity === 'bajo').length,
  };

  const recentOperative: OperativeEvent[] = operativeEvents.slice(0, 10);
  const recentExternal = events.slice(0, 10);

  return {
    kpis,
    riskDistribution,
    intelByLevel,
    heatmapData,
    recentEvents: recentExternal,
    recentOperative,
    isLoading: riskZonesQuery.isLoading || eventsQuery.isLoading || safePointsQuery.isLoading || operativeQuery.isLoading || checklistQuery.isLoading || fillRateQuery.isLoading,
    error: riskZonesQuery.error || eventsQuery.error || safePointsQuery.error || operativeQuery.error || checklistQuery.error || fillRateQuery.error,
  };
}
