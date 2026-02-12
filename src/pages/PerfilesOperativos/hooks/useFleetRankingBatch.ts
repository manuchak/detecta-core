import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RankingTier } from './useFleetRanking';

export interface RankingEntry {
  posicion: number;
  totalFlota: number;
  percentil: number;
  tier: RankingTier;
  score: number;
}

function getTier(percentil: number): RankingTier {
  if (percentil <= 10) return 'gold';
  if (percentil <= 25) return 'silver';
  if (percentil <= 50) return 'bronze';
  return 'standard';
}

export function useFleetRankingBatch() {
  return useQuery({
    queryKey: ['fleet-ranking-batch-30d'],
    queryFn: async (): Promise<Map<string, RankingEntry>> => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('nombre_custodio, estado, costo_custodio, hora_presentacion, fecha_hora_cita')
        .gte('fecha_hora_cita', since.toISOString());

      if (error) throw error;

      const result = new Map<string, RankingEntry>();
      if (!data || data.length === 0) return result;

      // Aggregate per custodian
      const byName: Record<string, { completados: number; revenue: number; puntualCount: number; puntualTotal: number }> = {};

      for (const r of data) {
        const n = r.nombre_custodio;
        if (!n) continue;
        if (!byName[n]) byName[n] = { completados: 0, revenue: 0, puntualCount: 0, puntualTotal: 0 };

        const isCompleted = ['Finalizado', 'completado', 'Completado', 'finalizado'].includes(r.estado || '');
        if (isCompleted) byName[n].completados++;
        byName[n].revenue += (r.costo_custodio as number) || 0;

        if (r.hora_presentacion && r.fecha_hora_cita) {
          const cita = new Date(r.fecha_hora_cita).getTime();
          const presentacion = new Date(r.hora_presentacion).getTime();
          const diffMin = (presentacion - cita) / 60000;
          const puntScore = diffMin <= 0 ? 100 : diffMin <= 30 ? Math.max(0, 100 - (diffMin / 30) * 100) : 0;
          byName[n].puntualCount++;
          byName[n].puntualTotal += puntScore;
        }
      }

      // Calculate composite score per custodian
      const entries = Object.entries(byName).map(([name, m]) => {
        const puntualidad = m.puntualCount > 0 ? m.puntualTotal / m.puntualCount : 50;
        const volScore = Math.min(100, (m.completados / 20) * 100);
        const revScore = Math.min(100, (m.revenue / 100000) * 100);
        const score = volScore * 0.4 + revScore * 0.3 + puntualidad * 0.3;
        return { name, score };
      });

      entries.sort((a, b) => b.score - a.score);

      const totalFlota = entries.length;
      entries.forEach((entry, idx) => {
        const posicion = idx + 1;
        const percentil = Math.round((posicion / totalFlota) * 100);
        result.set(entry.name.toLowerCase(), {
          posicion,
          totalFlota,
          percentil,
          tier: getTier(percentil),
          score: Math.round(entry.score),
        });
      });

      return result;
    },
    staleTime: 1000 * 60 * 5,
  });
}
