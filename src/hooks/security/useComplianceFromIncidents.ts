import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

export interface IncidentComplianceMetrics {
  // Documentation completeness
  documentationRate: number;         // % of incidents with ≥3 timeline entries
  totalWithTimeline: number;
  totalWithoutTimeline: number;

  // Control coverage
  controlCoverageRate: number;       // % of incidents with controles_activos.length > 0
  totalWithControls: number;

  // Control effectiveness
  controlEffectivenessRate: number;  // % of control_efectivo=true when controls exist
  controlEffective: number;
  controlFailed: number;

  // Attribution analysis
  atribuibilityRate: number;         // % of atribuible_operacion=true
  totalAtribuibles: number;

  // Resolution timeliness
  resolvedOnTime: number;            // % resolved within SLA (72h critical, 7d non-critical)
  totalResolved: number;
  avgResolutionHours: number;

  // Mean Time to Response (first 'accion' entry after 'deteccion')
  avgMTTR: number;                   // hours

  // ISO 28000 §8 overall score (weighted)
  isoScore: number;

  totalIncidents: number;
}

export type TrafficLight = 'green' | 'amber' | 'red';

export function getTrafficLight(value: number, greenThreshold = 80, amberThreshold = 60): TrafficLight {
  if (value >= greenThreshold) return 'green';
  if (value >= amberThreshold) return 'amber';
  return 'red';
}

// =============================================================================
// HOOK
// =============================================================================

export function useComplianceFromIncidents() {
  return useQuery({
    queryKey: ['compliance-from-incidents'],
    queryFn: async (): Promise<IncidentComplianceMetrics> => {
      // Parallel: incidents + timeline entries
      const [incidentsRes, timelineRes] = await Promise.all([
        (supabase as any)
          .from('incidentes_operativos')
          .select('id, severidad, estado, fecha_incidente, fecha_resolucion, atribuible_operacion, controles_activos, control_efectivo'),
        (supabase as any)
          .from('entradas_cronologia_incidente')
          .select('incidente_id, tipo_entrada, timestamp')
          .order('timestamp', { ascending: true }),
      ]);

      if (incidentsRes.error) throw incidentsRes.error;
      if (timelineRes.error) throw timelineRes.error;

      const incidents = (incidentsRes.data || []) as {
        id: string; severidad: string; estado: string;
        fecha_incidente: string; fecha_resolucion: string | null;
        atribuible_operacion: boolean; controles_activos: string[] | null;
        control_efectivo: boolean | null;
      }[];
      const timeline = (timelineRes.data || []) as {
        incidente_id: string; tipo_entrada: string; timestamp: string;
      }[];

      const totalIncidents = incidents.length;
      if (totalIncidents === 0) {
        return {
          documentationRate: 0, totalWithTimeline: 0, totalWithoutTimeline: 0,
          controlCoverageRate: 0, totalWithControls: 0,
          controlEffectivenessRate: 0, controlEffective: 0, controlFailed: 0,
          atribuibilityRate: 0, totalAtribuibles: 0,
          resolvedOnTime: 0, totalResolved: 0, avgResolutionHours: 0,
          avgMTTR: 0, isoScore: 0, totalIncidents: 0,
        };
      }

      // Group timeline by incident
      const timelineByIncident = new Map<string, typeof timeline>();
      timeline.forEach(entry => {
        const arr = timelineByIncident.get(entry.incidente_id) || [];
        arr.push(entry);
        timelineByIncident.set(entry.incidente_id, arr);
      });

      // 1. Documentation rate (≥3 entries)
      const totalWithTimeline = incidents.filter(i => {
        const entries = timelineByIncident.get(i.id) || [];
        return entries.length >= 3;
      }).length;
      const totalWithoutTimeline = totalIncidents - totalWithTimeline;
      const documentationRate = Math.round((totalWithTimeline / totalIncidents) * 100);

      // 2. Control coverage
      const totalWithControls = incidents.filter(i => i.controles_activos && i.controles_activos.length > 0).length;
      const controlCoverageRate = Math.round((totalWithControls / totalIncidents) * 100);

      // 3. Control effectiveness
      const withControlsArr = incidents.filter(i => i.controles_activos && i.controles_activos.length > 0);
      const controlEffective = withControlsArr.filter(i => i.control_efectivo === true).length;
      const controlFailed = withControlsArr.filter(i => i.control_efectivo === false).length;
      const controlEffectivenessRate = withControlsArr.length > 0
        ? Math.round((controlEffective / withControlsArr.length) * 100) : 0;

      // 4. Attribution
      const totalAtribuibles = incidents.filter(i => i.atribuible_operacion).length;
      const atribuibilityRate = Math.round((totalAtribuibles / totalIncidents) * 100);

      // 5. Resolution timeliness
      const resolved = incidents.filter(i =>
        (i.estado === 'resuelto' || i.estado === 'cerrado') && i.fecha_resolucion
      );
      let onTimeCount = 0;
      let totalResolutionHours = 0;

      resolved.forEach(i => {
        const start = new Date(i.fecha_incidente).getTime();
        const end = new Date(i.fecha_resolucion!).getTime();
        const hours = (end - start) / 3600000;
        totalResolutionHours += hours;

        const isCritical = i.severidad === 'critica' || i.severidad === 'alta';
        const slaHours = isCritical ? 72 : 168; // 72h for critical, 7d for non-critical
        if (hours <= slaHours) onTimeCount++;
      });

      const resolvedOnTime = resolved.length > 0
        ? Math.round((onTimeCount / resolved.length) * 100) : 0;
      const avgResolutionHours = resolved.length > 0
        ? Math.round(totalResolutionHours / resolved.length) : 0;

      // 6. MTTR (Mean Time to Response)
      let mttrSum = 0;
      let mttrCount = 0;
      incidents.forEach(i => {
        const entries = timelineByIncident.get(i.id) || [];
        const deteccion = entries.find(e => e.tipo_entrada === 'deteccion');
        const accion = entries.find(e => e.tipo_entrada === 'accion');
        if (deteccion && accion) {
          const hours = (new Date(accion.timestamp).getTime() - new Date(deteccion.timestamp).getTime()) / 3600000;
          if (hours >= 0 && hours < 720) { // cap at 30 days
            mttrSum += hours;
            mttrCount++;
          }
        }
      });
      const avgMTTR = mttrCount > 0 ? Math.round((mttrSum / mttrCount) * 10) / 10 : 0;

      // 7. ISO 28000 §8 composite score (weighted)
      const isoScore = Math.round(
        0.25 * documentationRate +
        0.20 * controlCoverageRate +
        0.25 * controlEffectivenessRate +
        0.15 * resolvedOnTime +
        0.15 * (100 - atribuibilityRate) // Lower attribution = better (less own incidents)
      );

      return {
        documentationRate, totalWithTimeline, totalWithoutTimeline,
        controlCoverageRate, totalWithControls,
        controlEffectivenessRate, controlEffective, controlFailed,
        atribuibilityRate, totalAtribuibles,
        resolvedOnTime, totalResolved: resolved.length, avgResolutionHours,
        avgMTTR, isoScore, totalIncidents,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
