import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IncidentAnalyticsData {
  // By type
  byType: { tipo: string; count: number }[];
  // By severity
  bySeverity: { severidad: string; count: number }[];
  // By zone
  byZone: { zona: string; count: number }[];
  // By month
  byMonth: { month: string; total: number; criticos: number; atribuibles: number }[];
  // By day of week
  byDayOfWeek: { day: string; count: number }[];
  // By hour
  byHour: { hour: number; count: number }[];
  // KPIs
  totalIncidents: number;
  avgResolutionDays: number;
  atribuibilityRate: number;
  controlEffectivenessRate: number;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function useIncidentAnalytics() {
  return useQuery({
    queryKey: ['security-incident-analytics'],
    queryFn: async (): Promise<IncidentAnalyticsData> => {
      const { data: incidents, error } = await supabase
        .from('incidentes_operativos')
        .select('tipo, severidad, zona, fecha_incidente, fecha_resolucion, atribuible_operacion, control_efectivo, estado');

      if (error) throw error;
      const rows = incidents || [];

      // By type
      const typeMap: Record<string, number> = {};
      const sevMap: Record<string, number> = {};
      const zoneMap: Record<string, number> = {};
      const monthMap: Record<string, { total: number; criticos: number; atribuibles: number }> = {};
      const dowMap: Record<number, number> = {};
      const hourMap: Record<number, number> = {};

      let totalResolutionDays = 0;
      let resolvedCount = 0;
      let atribuibles = 0;
      let controlEfectivo = 0;
      let controlTotal = 0;

      rows.forEach((inc) => {
        // Type
        const t = inc.tipo || 'Sin tipo';
        typeMap[t] = (typeMap[t] || 0) + 1;

        // Severity
        const s = inc.severidad || 'Sin severidad';
        sevMap[s] = (sevMap[s] || 0) + 1;

        // Zone
        const z = inc.zona || 'Sin zona';
        zoneMap[z] = (zoneMap[z] || 0) + 1;

        // Date-based
        if (inc.fecha_incidente) {
          const d = new Date(inc.fecha_incidente);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!monthMap[monthKey]) monthMap[monthKey] = { total: 0, criticos: 0, atribuibles: 0 };
          monthMap[monthKey].total++;
          const sev = (inc.severidad || '').toLowerCase();
          if (sev === 'critica' || sev === 'crítica' || sev === 'alta') monthMap[monthKey].criticos++;
          if (inc.atribuible_operacion) monthMap[monthKey].atribuibles++;

          dowMap[d.getDay()] = (dowMap[d.getDay()] || 0) + 1;
          hourMap[d.getHours()] = (hourMap[d.getHours()] || 0) + 1;
        }

        // Resolution time
        if (inc.fecha_resolucion && inc.fecha_incidente) {
          const diff = (new Date(inc.fecha_resolucion).getTime() - new Date(inc.fecha_incidente).getTime()) / 86400000;
          if (diff >= 0) { totalResolutionDays += diff; resolvedCount++; }
        }

        if (inc.atribuible_operacion) atribuibles++;
        if (inc.control_efectivo !== null) {
          controlTotal++;
          if (inc.control_efectivo) controlEfectivo++;
        }
      });

      const byType = Object.entries(typeMap)
        .map(([tipo, count]) => ({ tipo, count }))
        .sort((a, b) => b.count - a.count);

      const bySeverity = Object.entries(sevMap)
        .map(([severidad, count]) => ({ severidad, count }))
        .sort((a, b) => b.count - a.count);

      const byZone = Object.entries(zoneMap)
        .map(([zona, count]) => ({ zona, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const byMonth = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, d]) => ({ month, ...d }));

      const byDayOfWeek = Array.from({ length: 7 }, (_, i) => ({
        day: DAY_NAMES[i],
        count: dowMap[i] || 0,
      }));

      const byHour = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: hourMap[i] || 0,
      }));

      return {
        byType,
        bySeverity,
        byZone,
        byMonth,
        byDayOfWeek,
        byHour,
        totalIncidents: rows.length,
        avgResolutionDays: resolvedCount > 0 ? Math.round((totalResolutionDays / resolvedCount) * 10) / 10 : 0,
        atribuibilityRate: rows.length > 0 ? Math.round((atribuibles / rows.length) * 100) : 0,
        controlEffectivenessRate: controlTotal > 0 ? Math.round((controlEfectivo / controlTotal) * 100) : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
