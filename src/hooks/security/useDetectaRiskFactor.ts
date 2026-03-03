import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, subWeeks, subMonths, subQuarters, subYears, startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

export type TrendPeriod = 'DoD' | 'WoW' | 'MoM' | 'QoQ' | 'YoY';

export interface DRFBreakdown {
  incidentRate: number;       // 0-100 normalized
  severityIndex: number;      // 0-100 normalized
  controlFailureRate: number; // 0-100 normalized
  exposureScore: number;      // 0-100 normalized
  mitigationBonus: number;    // 0-100 normalized
}

export interface DRFTrend {
  period: TrendPeriod;
  current: number;
  previous: number;
  change: number;        // absolute diff
  changePercent: number; // % change
  direction: 'improving' | 'stable' | 'worsening';
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
// WEIGHTS — DRF Formula
// =============================================================================

const W = {
  incidentRate: 0.30,
  severityIndex: 0.25,
  controlFailure: 0.20,
  exposure: 0.15,
  mitigation: 0.10,
};

// Severity weights for index calculation
const SEVERITY_WEIGHTS: Record<string, number> = {
  critica: 4,
  alta: 3,
  media: 2,
  baja: 1,
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
// DRF CALCULATION ENGINE
// =============================================================================

interface RawIncident {
  severidad: string;
  atribuible_operacion: boolean;
  controles_activos: string[] | null;
  control_efectivo: boolean | null;
  fecha_incidente: string;
}

interface RawService {
  id: string;
  fecha_hora_cita: string;
}

interface RawZone {
  risk_level: string;
  final_score: number;
}

interface RawSafePoint {
  verification_status: string;
}

function calculateDRF(
  incidents: RawIncident[],
  services: RawService[],
  zones: RawZone[],
  safePoints: RawSafePoint[]
): { score: number; breakdown: DRFBreakdown } {
  const totalServices = Math.max(services.length, 1);

  // 1. Incident Rate: atribuible incidents per 1000 services, normalized to 0-100
  const atribuibles = incidents.filter(i => i.atribuible_operacion).length;
  const rawRate = (atribuibles / totalServices) * 1000;
  const incidentRate = Math.min(rawRate / 50 * 100, 100); // 50 per 1000 = 100%

  // 2. Severity Index: weighted severity, normalized
  const totalIncidents = Math.max(incidents.length, 1);
  const weightedSum = incidents.reduce((sum, i) => sum + (SEVERITY_WEIGHTS[i.severidad] || 1), 0);
  const maxPossible = totalIncidents * 4;
  const severityIndex = (weightedSum / maxPossible) * 100;

  // 3. Control Failure Rate: incidents where controls existed but failed
  const withControls = incidents.filter(i => i.controles_activos && i.controles_activos.length > 0);
  const controlFailed = withControls.filter(i => i.control_efectivo === false).length;
  const controlFailureRate = withControls.length > 0
    ? (controlFailed / withControls.length) * 100
    : 0;

  // 4. Exposure Score: % of zones in alto+extremo
  const highRiskZones = zones.filter(z => z.risk_level === 'extremo' || z.risk_level === 'alto').length;
  const exposureScore = zones.length > 0
    ? (highRiskZones / zones.length) * 100
    : 0;

  // 5. Mitigation Bonus: verified safe points as % (max contribution)
  const verifiedSP = safePoints.filter(sp => sp.verification_status === 'verified').length;
  const mitigationBonus = safePoints.length > 0
    ? (verifiedSP / safePoints.length) * 100
    : 0;

  const breakdown: DRFBreakdown = {
    incidentRate: Math.round(incidentRate * 10) / 10,
    severityIndex: Math.round(severityIndex * 10) / 10,
    controlFailureRate: Math.round(controlFailureRate * 10) / 10,
    exposureScore: Math.round(exposureScore * 10) / 10,
    mitigationBonus: Math.round(mitigationBonus * 10) / 10,
  };

  const score =
    (W.incidentRate * breakdown.incidentRate) +
    (W.severityIndex * breakdown.severityIndex) +
    (W.controlFailure * breakdown.controlFailureRate) +
    (W.exposure * breakdown.exposureScore) -
    (W.mitigation * breakdown.mitigationBonus);

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
    queryKey: ['detecta-risk-factor'],
    queryFn: async () => {
      // Parallel queries
      const [incidentsRes, servicesRes, zonesRes, safePointsRes] = await Promise.all([
        (supabase as any)
          .from('incidentes_operativos')
          .select('severidad, atribuible_operacion, controles_activos, control_efectivo, fecha_incidente'),
        (supabase as any)
          .from('servicios_planificados')
          .select('id, fecha_hora_cita'),
        (supabase as any)
          .from('risk_zone_scores')
          .select('risk_level, final_score'),
        (supabase as any)
          .from('safe_points')
          .select('verification_status')
          .eq('is_active', true),
      ]);

      if (incidentsRes.error) throw incidentsRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (zonesRes.error) throw zonesRes.error;
      if (safePointsRes.error) throw safePointsRes.error;

      const allIncidents = (incidentsRes.data || []) as RawIncident[];
      const allServices = (servicesRes.data || []) as RawService[];
      const zones = (zonesRes.data || []) as RawZone[];
      const safePoints = (safePointsRes.data || []) as RawSafePoint[];

      // Global DRF (all-time)
      const global = calculateDRF(allIncidents, allServices, zones, safePoints);

      // Calculate trends for all periods
      const periods: TrendPeriod[] = ['DoD', 'WoW', 'MoM', 'QoQ', 'YoY'];
      const trends: DRFTrend[] = periods.map(period => {
        const currentRange = getPeriodRange(period, 'current');
        const previousRange = getPeriodRange(period, 'previous');

        const filterByRange = <T extends { fecha_incidente?: string; fecha_hora_cita?: string }>(
          items: T[],
          dateField: 'fecha_incidente' | 'fecha_hora_cita',
          from: string,
          to: string
        ) => items.filter(item => {
          const d = item[dateField];
          return d && d >= from && d < to;
        });

        const currentIncidents = filterByRange(allIncidents, 'fecha_incidente', currentRange.from, currentRange.to);
        const currentServices = filterByRange(allServices, 'fecha_hora_cita', currentRange.from, currentRange.to);
        const prevIncidents = filterByRange(allIncidents, 'fecha_incidente', previousRange.from, previousRange.to);
        const prevServices = filterByRange(allServices, 'fecha_hora_cita', previousRange.from, previousRange.to);

        const currentDRF = calculateDRF(currentIncidents, currentServices, zones, safePoints);
        const prevDRF = calculateDRF(prevIncidents, prevServices, zones, safePoints);

        const change = currentDRF.score - prevDRF.score;
        const changePercent = prevDRF.score > 0
          ? (change / prevDRF.score) * 100
          : (currentDRF.score > 0 ? 100 : 0);

        let direction: DRFTrend['direction'] = 'stable';
        if (change < -2) direction = 'improving';   // Lower DRF = less risk = improving
        else if (change > 2) direction = 'worsening';

        return {
          period,
          current: currentDRF.score,
          previous: prevDRF.score,
          change: Math.round(change * 10) / 10,
          changePercent: Math.round(changePercent * 10) / 10,
          direction,
        };
      });

      return { global, trends };
    },
    staleTime: 5 * 60 * 1000,
  });

  const data = query.data;
  const trends = data?.trends || [];
  const selectedTrend = trends.find(t => t.period === selectedPeriod) || null;

  return {
    currentDRF: data?.global.score ?? 0,
    riskLevel: getRiskLevel(data?.global.score ?? 0),
    breakdown: data?.global.breakdown ?? {
      incidentRate: 0,
      severityIndex: 0,
      controlFailureRate: 0,
      exposureScore: 0,
      mitigationBonus: 0,
    },
    trends,
    selectedTrend,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
