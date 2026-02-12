import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export type AlertLevel = 'yellow' | 'orange' | 'red';

export interface PipelineAlert {
  id: string;
  nombre: string;
  stage: 'evaluaciones' | 'liberacion';
  daysSinceUpdate: number;
  level: AlertLevel;
  updatedAt: string;
}

export interface PipelineAlertsSummary {
  evaluaciones: { yellow: number; orange: number; red: number; total: number };
  liberacion: { yellow: number; orange: number; red: number; total: number };
  alerts: PipelineAlert[];
}

function getAlertLevel(days: number): AlertLevel | null {
  if (days >= 30) return 'red';
  if (days >= 15) return 'orange';
  if (days >= 7) return 'yellow';
  return null;
}

const emptySummary: PipelineAlertsSummary = {
  evaluaciones: { yellow: 0, orange: 0, red: 0, total: 0 },
  liberacion: { yellow: 0, orange: 0, red: 0, total: 0 },
  alerts: [],
};

export function useSupplyPipelineAlerts() {
  return useQuery({
    queryKey: ['supply-pipeline-alerts'],
    queryFn: async (): Promise<PipelineAlertsSummary> => {
      const now = new Date();

      const [evalRes, libRes] = await Promise.allSettled([
        supabase
          .from('candidatos_custodios')
          .select('id, nombre, updated_at')
          .in('estado_proceso', ['aprobado', 'en_evaluacion']),
        supabase
          .from('custodio_liberacion')
          .select('id, updated_at, candidato:candidatos_custodios(nombre)')
          .not('estado_liberacion', 'in', '("liberado","rechazado")'),
      ]);

      const alerts: PipelineAlert[] = [];
      const summary: PipelineAlertsSummary = {
        evaluaciones: { yellow: 0, orange: 0, red: 0, total: 0 },
        liberacion: { yellow: 0, orange: 0, red: 0, total: 0 },
        alerts: [],
      };

      // Process evaluaciones
      if (evalRes.status === 'fulfilled' && evalRes.value.data) {
        for (const row of evalRes.value.data) {
          const days = differenceInDays(now, new Date(row.updated_at));
          const level = getAlertLevel(days);
          if (level) {
            summary.evaluaciones[level]++;
            summary.evaluaciones.total++;
            alerts.push({
              id: row.id,
              nombre: row.nombre || 'Sin nombre',
              stage: 'evaluaciones',
              daysSinceUpdate: days,
              level,
              updatedAt: row.updated_at,
            });
          }
        }
      }

      // Process liberacion
      if (libRes.status === 'fulfilled' && libRes.value.data) {
        for (const row of libRes.value.data as any[]) {
          const days = differenceInDays(now, new Date(row.updated_at));
          const level = getAlertLevel(days);
          if (level) {
            summary.liberacion[level]++;
            summary.liberacion.total++;
            alerts.push({
              id: row.id,
              nombre: row.candidato?.nombre || 'Sin nombre',
              stage: 'liberacion',
              daysSinceUpdate: days,
              level,
              updatedAt: row.updated_at,
            });
          }
        }
      }

      // Sort by severity (red first) then by days
      alerts.sort((a, b) => {
        const levelOrder = { red: 0, orange: 1, yellow: 2 };
        const diff = levelOrder[a.level] - levelOrder[b.level];
        return diff !== 0 ? diff : b.daysSinceUpdate - a.daysSinceUpdate;
      });

      summary.alerts = alerts;
      return summary;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
