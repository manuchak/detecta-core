import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, subWeeks, subMonths, subQuarters, subYears, startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

export type TrendPeriod = 'DoD' | 'WoW' | 'MoM' | 'QoQ' | 'YoY';

export interface RouteTrendRow {
  corridor: string; // "Origen → Destino" normalized
  totalServices: number;
  totalIncidents: number;
  incidentRate: number; // per 1000 services
  criticalIncidents: number;
  avgSeverity: number;
  controlEffectiveness: number; // %
  trend: {
    current: number;     // incident rate this period
    previous: number;    // incident rate previous period
    change: number;
    direction: 'improving' | 'stable' | 'worsening';
  };
}

export interface RouteRiskTrendResult {
  routes: RouteTrendRow[];
  period: TrendPeriod;
  globalIncidentRate: number;
  isLoading: boolean;
  error: Error | null;
}

// =============================================================================
// HELPERS
// =============================================================================

const SEVERITY_WEIGHT: Record<string, number> = {
  critica: 4, alta: 3, media: 2, baja: 1,
};

function normalizeCorridor(origen: string, destino: string): string {
  const normalize = (s: string) => s.trim().replace(/,\s*(México|Mexico|MX|Mex\.?)$/i, '').trim();
  return `${normalize(origen)} → ${normalize(destino)}`;
}

function getPeriodDates(period: TrendPeriod, offset: 0 | 1) {
  const now = new Date();
  const fns: Record<TrendPeriod, { start: (d: Date) => Date; sub: (d: Date, n: number) => Date }> = {
    DoD: { start: startOfDay, sub: subDays },
    WoW: { start: (d) => startOfWeek(d, { weekStartsOn: 1 }), sub: subWeeks },
    MoM: { start: startOfMonth, sub: subMonths },
    QoQ: { start: startOfQuarter, sub: subQuarters },
    YoY: { start: startOfYear, sub: subYears },
  };
  const { start, sub } = fns[period];
  const from = sub(start(now), offset);
  const to = sub(start(now), offset - 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

// =============================================================================
// HOOK
// =============================================================================

export function useRouteRiskTrend(period: TrendPeriod = 'MoM'): RouteRiskTrendResult {
  const query = useQuery({
    queryKey: ['route-risk-trend', period],
    queryFn: async () => {
      // Fetch services with origen/destino and incidents linked via servicio_planificado_id
      const [servicesRes, incidentsRes] = await Promise.all([
        (supabase as any)
          .from('servicios_planificados')
          .select('id, origen, destino, fecha_hora_cita, estado_planeacion')
          .not('estado_planeacion', 'eq', 'cancelado'),
        (supabase as any)
          .from('incidentes_operativos')
          .select('id, servicio_planificado_id, tipo, severidad, fecha_incidente, atribuible_operacion, control_efectivo, controles_activos'),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (incidentsRes.error) throw incidentsRes.error;

      const services = (servicesRes.data || []) as {
        id: string; origen: string; destino: string; fecha_hora_cita: string; estado_planeacion: string;
      }[];
      const incidents = (incidentsRes.data || []) as {
        id: string; servicio_planificado_id: string | null; tipo: string; severidad: string;
        fecha_incidente: string; atribuible_operacion: boolean; control_efectivo: boolean | null;
        controles_activos: string[] | null;
      }[];

      // Build incident lookup by servicio_planificado_id
      const incidentsByService = new Map<string, typeof incidents>();
      incidents.forEach(inc => {
        if (!inc.servicio_planificado_id) return;
        const arr = incidentsByService.get(inc.servicio_planificado_id) || [];
        arr.push(inc);
        incidentsByService.set(inc.servicio_planificado_id, arr);
      });

      // Group services by corridor
      const corridorMap = new Map<string, {
        services: typeof services;
        incidents: typeof incidents;
      }>();

      services.forEach(svc => {
        if (!svc.origen || !svc.destino) return;
        const key = normalizeCorridor(svc.origen, svc.destino);
        if (!corridorMap.has(key)) corridorMap.set(key, { services: [], incidents: [] });
        const entry = corridorMap.get(key)!;
        entry.services.push(svc);
        const svcIncidents = incidentsByService.get(svc.id) || [];
        entry.incidents.push(...svcIncidents);
      });

      // Period ranges
      const currentRange = getPeriodDates(period, 0);
      const previousRange = getPeriodDates(period, 1);

      const inRange = (date: string, from: string, to: string) => date >= from && date < to;

      // Build route trend rows
      const routes: RouteTrendRow[] = [];

      corridorMap.forEach((data, corridor) => {
        const totalServices = data.services.length;
        if (totalServices < 2) return; // Skip low-traffic routes

        const totalIncidents = data.incidents.length;
        const criticalIncidents = data.incidents.filter(i =>
          i.severidad === 'critica' || i.severidad === 'alta'
        ).length;

        const incidentRate = (totalIncidents / totalServices) * 1000;

        // Severity average
        const avgSeverity = totalIncidents > 0
          ? data.incidents.reduce((sum, i) => sum + (SEVERITY_WEIGHT[i.severidad] || 1), 0) / totalIncidents
          : 0;

        // Control effectiveness
        const withControls = data.incidents.filter(i => i.controles_activos && i.controles_activos.length > 0);
        const controlEffective = withControls.filter(i => i.control_efectivo === true).length;
        const controlEffectiveness = withControls.length > 0
          ? Math.round((controlEffective / withControls.length) * 100)
          : -1; // -1 = no data

        // Period trend
        const currentServices = data.services.filter(s => inRange(s.fecha_hora_cita, currentRange.from, currentRange.to));
        const prevServices = data.services.filter(s => inRange(s.fecha_hora_cita, previousRange.from, previousRange.to));
        const currentIncidents = data.incidents.filter(i => inRange(i.fecha_incidente, currentRange.from, currentRange.to));
        const prevIncidents = data.incidents.filter(i => inRange(i.fecha_incidente, previousRange.from, previousRange.to));

        const currentRate = currentServices.length > 0
          ? (currentIncidents.length / currentServices.length) * 1000 : 0;
        const prevRate = prevServices.length > 0
          ? (prevIncidents.length / prevServices.length) * 1000 : 0;

        const change = currentRate - prevRate;
        let direction: 'improving' | 'stable' | 'worsening' = 'stable';
        if (change < -1) direction = 'improving';
        else if (change > 1) direction = 'worsening';

        routes.push({
          corridor,
          totalServices,
          totalIncidents,
          incidentRate: Math.round(incidentRate * 10) / 10,
          criticalIncidents,
          avgSeverity: Math.round(avgSeverity * 10) / 10,
          controlEffectiveness,
          trend: {
            current: Math.round(currentRate * 10) / 10,
            previous: Math.round(prevRate * 10) / 10,
            change: Math.round(change * 10) / 10,
            direction,
          },
        });
      });

      // Sort by incident rate descending (most risky first)
      routes.sort((a, b) => b.incidentRate - a.incidentRate);

      const globalRate = services.length > 0
        ? Math.round((incidents.length / services.length) * 1000 * 10) / 10
        : 0;

      return { routes, globalIncidentRate: globalRate };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    routes: query.data?.routes || [],
    period,
    globalIncidentRate: query.data?.globalIncidentRate || 0,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
