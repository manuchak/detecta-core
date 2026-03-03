import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, subWeeks, subMonths, subQuarters, subYears, startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

export type TrendPeriod = 'DoD' | 'WoW' | 'MoM' | 'QoQ' | 'YoY';

export interface DRFBreakdown {
  incidentRate: number;       // 0-100
  severityIndex: number;      // 0-100
  exposureScore: number;      // 0-100 — % zones alto/extremo
  mitigationRate: number;     // 0-100 — checklist coverage
  siniestralidad: number;     // 0-100 — siniestros per 1000 services
}

export interface DRFTrend {
  period: TrendPeriod;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  direction: 'improving' | 'stable' | 'worsening';
  breakdown: DRFBreakdown;
}

export type RiskLevel = 'critico' | 'alto' | 'medio' | 'bajo';

export interface DetectaRiskFactorResult {
  currentDRF: number;
  riskLevel: RiskLevel;
  breakdown: DRFBreakdown;
  trends: DRFTrend[];
  selectedTrend: DRFTrend | null;
  isLoading: boolean;
  error: Error | null;
}

// =============================================================================
// WEIGHTS — DRF Formula (revised)
// =============================================================================

const W = {
  exposure: 0.35,        // How exposed are we by route geography
  siniestralidad: 0.30,  // Historical loss rate
  incidentRate: 0.15,    // General incident frequency
  severityIndex: 0.10,   // Severity of incidents
  mitigation: 0.10,      // Checklist coverage (reduces risk)
};

const SEVERITY_WEIGHTS: Record<string, number> = {
  critica: 4, alta: 3, media: 2, baja: 1,
};

// =============================================================================
// PERIOD HELPERS
// =============================================================================

function getPeriodRange(period: TrendPeriod, offset: 'current' | 'previous'): { from: string; to: string } {
  const now = new Date();
  const shiftFn = offset === 'previous' ? 1 : 0;

  switch (period) {
    case 'DoD': {
      const base = subDays(startOfDay(now), shiftFn);
      const end = subDays(startOfDay(now), shiftFn - 1);
      return { from: base.toISOString(), to: end.toISOString() };
    }
    case 'WoW': {
      const base = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), shiftFn);
      const end = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), shiftFn - 1);
      return { from: base.toISOString(), to: end.toISOString() };
    }
    case 'MoM': {
      const base = subMonths(startOfMonth(now), shiftFn);
      const end = subMonths(startOfMonth(now), shiftFn - 1);
      return { from: base.toISOString(), to: end.toISOString() };
    }
    case 'QoQ': {
      const base = subQuarters(startOfQuarter(now), shiftFn);
      const end = subQuarters(startOfQuarter(now), shiftFn - 1);
      return { from: base.toISOString(), to: end.toISOString() };
    }
    case 'YoY': {
      const base = subYears(startOfYear(now), shiftFn);
      const end = subYears(startOfYear(now), shiftFn - 1);
      return { from: base.toISOString(), to: end.toISOString() };
    }
  }
}

// =============================================================================
// DRF CALCULATION ENGINE (revised)
// =============================================================================

interface RawIncident {
  severidad: string;
  atribuible_operacion: boolean;
  fecha_incidente: string;
  es_siniestro: boolean;
}

interface RawZone {
  risk_level: string;
  final_score: number;
}

interface FillRateMonth {
  fecha: string;
  servicios_completados: number;
  siniestros: number;
}

function calculateDRF(
  incidents: RawIncident[],
  zones: RawZone[],
  fillRateData: FillRateMonth[],
  checklistCount: number,
  totalServicesAll: number,
): { score: number; breakdown: DRFBreakdown } {
  // 1. Exposure: % of zones in alto+extremo (structural floor)
  const highRiskZones = zones.filter(z => z.risk_level === 'extremo' || z.risk_level === 'alto').length;
  const exposureScore = zones.length > 0 ? (highRiskZones / zones.length) * 100 : 0;

  // 2. Siniestralidad: siniestros per 1000 services from fill rate
  const totalFillServices = fillRateData.reduce((s, m) => s + m.servicios_completados, 0);
  const totalSiniestros = fillRateData.reduce((s, m) => s + m.siniestros, 0);
  const rawSiniestralidad = totalFillServices > 0
    ? (totalSiniestros / totalFillServices) * 1000
    : 0;
  // Normalize: 10 per 1000 = 100 score
  const siniestralidad = Math.min((rawSiniestralidad / 10) * 100, 100);

  // 3. Incident Rate: incidents per 100 services
  const totalServices = Math.max(totalServicesAll, 1);
  const rawRate = (incidents.length / totalServices) * 100;
  const incidentRate = Math.min((rawRate / 5) * 100, 100); // 5% = max

  // 4. Severity Index
  const totalIncidents = Math.max(incidents.length, 1);
  const weightedSum = incidents.reduce((sum, i) => {
    const base = SEVERITY_WEIGHTS[i.severidad] || 1;
    return sum + (i.es_siniestro ? Math.max(base, 4) : base);
  }, 0);
  const severityIndex = incidents.length > 0
    ? (weightedSum / (totalIncidents * 4)) * 100
    : 0;

  // 5. Mitigation: checklist coverage (higher = less risk)
  const mitigationRate = totalServicesAll > 0
    ? Math.min((checklistCount / totalServicesAll) * 100, 100)
    : 0;

  const breakdown: DRFBreakdown = {
    incidentRate: Math.round(incidentRate * 10) / 10,
    severityIndex: Math.round(severityIndex * 10) / 10,
    exposureScore: Math.round(exposureScore * 10) / 10,
    mitigationRate: Math.round(mitigationRate * 10) / 10,
    siniestralidad: Math.round(siniestralidad * 10) / 10,
  };

  const score =
    (W.exposure * breakdown.exposureScore) +
    (W.siniestralidad * breakdown.siniestralidad) +
    (W.incidentRate * breakdown.incidentRate) +
    (W.severityIndex * breakdown.severityIndex) -
    (W.mitigation * breakdown.mitigationRate);

  return {
    score: Math.round(Math.max(0, Math.min(100, score)) * 10) / 10,
    breakdown,
  };
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'critico';
  if (score >= 50) return 'alto';
  if (score >= 25) return 'medio';
  return 'bajo';
}

// =============================================================================
// HOOK
// =============================================================================

export function useDetectaRiskFactor(selectedPeriod: TrendPeriod = 'MoM'): DetectaRiskFactorResult {
  const query = useQuery({
    queryKey: ['detecta-risk-factor-v2'],
    queryFn: async () => {
      const [incidentsRes, zonesRes, fillRateRes, checklistRes] = await Promise.all([
        (supabase as any)
          .from('incidentes_operativos')
          .select('severidad, atribuible_operacion, fecha_incidente, es_siniestro'),
        (supabase as any)
          .from('risk_zone_scores')
          .select('risk_level, final_score'),
        (supabase as any)
          .from('siniestros_historico')
          .select('fecha, servicios_completados, siniestros')
          .order('fecha', { ascending: true }),
        (supabase as any)
          .from('checklist_servicio')
          .select('id, created_at')
          .limit(5000),
      ]);

      if (incidentsRes.error) throw incidentsRes.error;
      if (zonesRes.error) throw zonesRes.error;
      if (fillRateRes.error) throw fillRateRes.error;
      if (checklistRes.error) throw checklistRes.error;

      const allIncidents = (incidentsRes.data || []) as RawIncident[];
      const zones = (zonesRes.data || []) as RawZone[];
      const fillRate = (fillRateRes.data || []) as FillRateMonth[];
      const allChecklists = (checklistRes.data || []) as { id: string; created_at: string }[];

      const totalServicesAll = fillRate.reduce((s, m) => s + m.servicios_completados, 0);

      // Global DRF
      const global = calculateDRF(allIncidents, zones, fillRate, allChecklists.length, totalServicesAll);

      // Per-period trends
      const periods: TrendPeriod[] = ['DoD', 'WoW', 'MoM', 'QoQ', 'YoY'];
      const trends: DRFTrend[] = periods.map(period => {
        const currentRange = getPeriodRange(period, 'current');
        const previousRange = getPeriodRange(period, 'previous');

        const filterIncidents = (from: string, to: string) =>
          allIncidents.filter(i => i.fecha_incidente >= from && i.fecha_incidente < to);

        const filterFillRate = (from: string, to: string) =>
          fillRate.filter(m => m.fecha >= from.slice(0, 10) && m.fecha < to.slice(0, 10));

        const filterChecklists = (from: string, to: string) =>
          allChecklists.filter(c => c.created_at >= from && c.created_at < to);

        const curInc = filterIncidents(currentRange.from, currentRange.to);
        const curFR = filterFillRate(currentRange.from, currentRange.to);
        const curCL = filterChecklists(currentRange.from, currentRange.to);
        const curServices = curFR.reduce((s, m) => s + m.servicios_completados, 0);
        // If no fill rate data for period, use proportional estimate
        const effectiveCurServices = curServices > 0 ? curServices : Math.max(Math.round(totalServicesAll / 24), 1);

        const prevInc = filterIncidents(previousRange.from, previousRange.to);
        const prevFR = filterFillRate(previousRange.from, previousRange.to);
        const prevCL = filterChecklists(previousRange.from, previousRange.to);
        const prevServices = prevFR.reduce((s, m) => s + m.servicios_completados, 0);
        const effectivePrevServices = prevServices > 0 ? prevServices : Math.max(Math.round(totalServicesAll / 24), 1);

        const currentDRF = calculateDRF(curInc, zones, curFR.length > 0 ? curFR : fillRate, curCL.length, effectiveCurServices);
        const prevDRF = calculateDRF(prevInc, zones, prevFR.length > 0 ? prevFR : fillRate, prevCL.length, effectivePrevServices);

        const change = currentDRF.score - prevDRF.score;
        const changePercent = prevDRF.score > 0
          ? (change / prevDRF.score) * 100
          : (currentDRF.score > 0 ? 100 : 0);

        let direction: DRFTrend['direction'] = 'stable';
        if (change < -2) direction = 'improving';
        else if (change > 2) direction = 'worsening';

        return {
          period,
          current: currentDRF.score,
          previous: prevDRF.score,
          change: Math.round(change * 10) / 10,
          changePercent: Math.round(changePercent * 10) / 10,
          direction,
          breakdown: currentDRF.breakdown,
        };
      });

      return { global, trends, fillRate, zones };
    },
    staleTime: 5 * 60 * 1000,
  });

  const data = query.data;
  const trends = data?.trends || [];
  const selectedTrend = trends.find(t => t.period === selectedPeriod) || null;

  // When a period is selected, show that period's DRF, not global
  const activeDRF = selectedTrend?.current ?? data?.global.score ?? 0;
  const activeBreakdown = selectedTrend?.breakdown ?? data?.global.breakdown ?? {
    incidentRate: 0, severityIndex: 0, exposureScore: 0, mitigationRate: 0, siniestralidad: 0,
  };

  return {
    currentDRF: activeDRF,
    riskLevel: getRiskLevel(activeDRF),
    breakdown: activeBreakdown,
    trends,
    selectedTrend,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
