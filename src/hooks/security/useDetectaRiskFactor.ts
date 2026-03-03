import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, subWeeks, subMonths, subQuarters, subYears, startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, format } from 'date-fns';
import { es } from 'date-fns/locale';

// =============================================================================
// TYPES
// =============================================================================

export type TrendPeriod = 'DoD' | 'WoW' | 'MoM' | 'QoQ' | 'YoY';

export interface DRFBreakdown {
  incidentRate: number;
  severityIndex: number;
  exposureScore: number;
  mitigationRate: number;
  siniestralidad: number;
}

export interface DRFHistoryPoint {
  label: string;
  score: number;
  riskLevel: RiskLevel;
}

export interface DRFTrend {
  period: TrendPeriod;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  direction: 'improving' | 'stable' | 'worsening';
  breakdown: DRFBreakdown;
  history: DRFHistoryPoint[];
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
// WEIGHTS
// =============================================================================

const W = {
  exposure: 0.35,
  siniestralidad: 0.30,
  incidentRate: 0.15,
  severityIndex: 0.10,
  mitigation: 0.10,
};

const SEVERITY_WEIGHTS: Record<string, number> = {
  critica: 4, alta: 3, media: 2, baja: 1,
};

// =============================================================================
// PERIOD HELPERS
// =============================================================================

function getPeriodRangeOffset(period: TrendPeriod, offset: number): { from: string; to: string } {
  const now = new Date();
  switch (period) {
    case 'DoD': {
      const base = subDays(startOfDay(now), offset);
      const end = subDays(startOfDay(now), offset - 1);
      return { from: base.toISOString(), to: end.toISOString() };
    }
    case 'WoW': {
      const base = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), offset);
      const end = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), offset - 1);
      return { from: base.toISOString(), to: end.toISOString() };
    }
    case 'MoM': {
      const base = subMonths(startOfMonth(now), offset);
      const end = subMonths(startOfMonth(now), offset - 1);
      return { from: base.toISOString(), to: end.toISOString() };
    }
    case 'QoQ': {
      const base = subQuarters(startOfQuarter(now), offset);
      const end = subQuarters(startOfQuarter(now), offset - 1);
      return { from: base.toISOString(), to: end.toISOString() };
    }
    case 'YoY': {
      const base = subYears(startOfYear(now), offset);
      const end = subYears(startOfYear(now), offset - 1);
      return { from: base.toISOString(), to: end.toISOString() };
    }
  }
}

function getPeriodLabel(period: TrendPeriod, offset: number): string {
  const now = new Date();
  switch (period) {
    case 'DoD': {
      if (offset === 0) return 'Hoy';
      if (offset === 1) return 'Ayer';
      const d = subDays(now, offset);
      return format(d, 'dd MMM', { locale: es });
    }
    case 'WoW': {
      if (offset === 0) return 'Esta sem';
      if (offset === 1) return 'Sem ant';
      return `-${offset} sem`;
    }
    case 'MoM': {
      const d = subMonths(startOfMonth(now), offset);
      return format(d, 'MMM', { locale: es }).replace(/^./, c => c.toUpperCase());
    }
    case 'QoQ': {
      const d = subQuarters(startOfQuarter(now), offset);
      const q = Math.ceil((d.getMonth() + 1) / 3);
      return `Q${q}-${format(d, 'yy')}`;
    }
    case 'YoY': {
      const d = subYears(startOfYear(now), offset);
      return format(d, 'yyyy');
    }
  }
}

// =============================================================================
// DRF CALCULATION ENGINE
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
  const highRiskZones = zones.filter(z => z.risk_level === 'extremo' || z.risk_level === 'alto').length;
  const exposureScore = zones.length > 0 ? (highRiskZones / zones.length) * 100 : 0;

  const totalFillServices = fillRateData.reduce((s, m) => s + m.servicios_completados, 0);
  const totalSiniestros = fillRateData.reduce((s, m) => s + m.siniestros, 0);
  const rawSiniestralidad = totalFillServices > 0 ? (totalSiniestros / totalFillServices) * 1000 : 0;
  const siniestralidad = Math.min((rawSiniestralidad / 10) * 100, 100);

  const totalServices = Math.max(totalServicesAll, 1);
  const rawRate = (incidents.length / totalServices) * 100;
  const incidentRate = Math.min((rawRate / 5) * 100, 100);

  const totalIncidents = Math.max(incidents.length, 1);
  const weightedSum = incidents.reduce((sum, i) => {
    const base = SEVERITY_WEIGHTS[i.severidad] || 1;
    return sum + (i.es_siniestro ? Math.max(base, 4) : base);
  }, 0);
  const severityIndex = incidents.length > 0 ? (weightedSum / (totalIncidents * 4)) * 100 : 0;

  const mitigationRate = totalServicesAll > 0 ? Math.min((checklistCount / totalServicesAll) * 100, 100) : 0;

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

const HISTORY_DEPTH = 5; // current + 4 previous

export function useDetectaRiskFactor(selectedPeriod: TrendPeriod = 'MoM'): DetectaRiskFactorResult {
  const query = useQuery({
    queryKey: ['detecta-risk-factor-v3'],
    queryFn: async () => {
      const [incidentsRes, zonesRes, fillRateRes, checklistRes] = await Promise.all([
        (supabase as any).from('incidentes_operativos').select('severidad, atribuible_operacion, fecha_incidente, es_siniestro'),
        (supabase as any).from('risk_zone_scores').select('risk_level, final_score'),
        (supabase as any).from('siniestros_historico').select('fecha, servicios_completados, siniestros').order('fecha', { ascending: true }),
        (supabase as any).from('checklist_servicio').select('id, created_at').limit(5000),
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

      const global = calculateDRF(allIncidents, zones, fillRate, allChecklists.length, totalServicesAll);

      const filterIncidents = (from: string, to: string) =>
        allIncidents.filter(i => i.fecha_incidente >= from && i.fecha_incidente < to);
      const filterFillRate = (from: string, to: string) =>
        fillRate.filter(m => m.fecha >= from.slice(0, 10) && m.fecha < to.slice(0, 10));
      const filterChecklists = (from: string, to: string) =>
        allChecklists.filter(c => c.created_at >= from && c.created_at < to);

      // Context window sizes for siniestralidad by period type
      const contextWindowMonths: Record<TrendPeriod, number> = {
        DoD: 1,    // 1 month window
        WoW: 2,    // 2 months
        MoM: 12,   // 12 months
        QoQ: 24,   // 24 months
        YoY: 999,  // all history
      };

      const calcForOffset = (period: TrendPeriod, offset: number) => {
        const range = getPeriodRangeOffset(period, offset);

        // STRICT temporal filtering — no fallbacks
        const inc = filterIncidents(range.from, range.to);
        const cl = filterChecklists(range.from, range.to);

        // Siniestralidad: use a contextual window ending at range.to
        const windowMonths = contextWindowMonths[period];
        const windowEnd = range.to;
        const windowStart = windowMonths >= 999
          ? '1970-01-01'
          : subMonths(new Date(windowEnd), windowMonths).toISOString().slice(0, 10);
        const frWindow = fillRate.filter(m => m.fecha >= windowStart && m.fecha < windowEnd.slice(0, 10));
        const svcWindow = frWindow.reduce((s, m) => s + m.servicios_completados, 0);

        // Incident rate: normalize by services in the PERIOD (not global)
        const frPeriod = filterFillRate(range.from, range.to);
        const svcPeriod = frPeriod.reduce((s, m) => s + m.servicios_completados, 0);
        // Estimate daily services for periods shorter than a month (DoD, WoW)
        const avgDailyServices = totalServicesAll > 0 ? totalServicesAll / Math.max(fillRate.length * 30, 1) : 1;
        const periodDays = Math.max(1, (new Date(range.to).getTime() - new Date(range.from).getTime()) / 86400000);
        const estimatedPeriodServices = svcPeriod > 0 ? svcPeriod : Math.round(avgDailyServices * periodDays);

        return calculateDRF(inc, zones, frWindow, cl.length, Math.max(estimatedPeriodServices, 1));
      };

      // Determine earliest date with real data
      const earliestDataDate = fillRate.length > 0 ? fillRate[0].fecha : null;
      const earliestIncidentDate = allIncidents.length > 0
        ? allIncidents.reduce((min, i) => i.fecha_incidente < min ? i.fecha_incidente : min, allIncidents[0].fecha_incidente)
        : null;
      const earliestDate = earliestDataDate || earliestIncidentDate || '2024-01';

      const periods: TrendPeriod[] = ['DoD', 'WoW', 'MoM', 'QoQ', 'YoY'];
      const trends: DRFTrend[] = periods.map(period => {
        const history: DRFHistoryPoint[] = [];
        for (let offset = 0; offset < HISTORY_DEPTH; offset++) {
          const range = getPeriodRangeOffset(period, offset);
          // Skip periods that fall entirely before the earliest data
          if (range.to.slice(0, 7) <= earliestDate.slice(0, 7) && offset > 0) break;
          const result = calcForOffset(period, offset);
          history.push({
            label: getPeriodLabel(period, offset),
            score: result.score,
            riskLevel: getRiskLevel(result.score),
          });
        }

        if (history.length === 0) return null;

        const current = history[0].score;
        const previous = history.length > 1 ? history[1].score : current;
        const change = current - previous;
        const changePercent = previous > 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);

        let direction: DRFTrend['direction'] = 'stable';
        if (change < -2) direction = 'improving';
        else if (change > 2) direction = 'worsening';

        const currentResult = calcForOffset(period, 0);

        return {
          period,
          current,
          previous,
          change: Math.round(change * 10) / 10,
          changePercent: Math.round(changePercent * 10) / 10,
          direction,
          breakdown: currentResult.breakdown,
          history,
        };
      }).filter((t): t is DRFTrend => t !== null);

      return { global, trends, fillRate, zones };
    },
    staleTime: 5 * 60 * 1000,
  });

  const data = query.data;
  const trends = data?.trends || [];
  const selectedTrend = trends.find(t => t.period === selectedPeriod) || null;

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
