import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RankingTier = 'gold' | 'silver' | 'bronze' | 'standard';

export interface FleetRanking {
  posicion: number;
  totalFlota: number;
  percentil: number;
  tier: RankingTier;
}

function getTier(percentil: number): RankingTier {
  if (percentil <= 10) return 'gold';
  if (percentil <= 25) return 'silver';
  if (percentil <= 50) return 'bronze';
  return 'standard';
}

export function useFleetRanking(nombre: string | undefined) {
  return useQuery({
    queryKey: ['fleet-ranking-30d', nombre],
    queryFn: async (): Promise<FleetRanking | null> => {
      if (!nombre) return null;

      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('nombre_custodio, estado, precio_venta, hora_presentacion, fecha_hora_cita')
        .gte('fecha_hora_cita', since.toISOString());

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Aggregate per custodian
      const byName: Record<string, { completados: number; revenue: number; puntualCount: number; puntualTotal: number }> = {};

      for (const r of data) {
        const n = r.nombre_custodio;
        if (!n) continue;
        if (!byName[n]) byName[n] = { completados: 0, revenue: 0, puntualCount: 0, puntualTotal: 0 };

        const isCompleted = ['Finalizado', 'completado', 'Completado', 'finalizado'].includes(r.estado || '');
        if (isCompleted) byName[n].completados++;
        byName[n].revenue += (r.precio_venta as number) || 0;

        // Punctuality when both timestamps exist
        if (r.hora_presentacion && r.fecha_hora_cita) {
          const cita = new Date(r.fecha_hora_cita).getTime();
          const presentacion = new Date(r.hora_presentacion).getTime();
          const diffMin = (presentacion - cita) / 60000;
          // Score: on time or early = 100, up to 15min late scales down, >30min = 0
          const puntScore = diffMin <= 0 ? 100 : diffMin <= 30 ? Math.max(0, 100 - (diffMin / 30) * 100) : 0;
          byName[n].puntualCount++;
          byName[n].puntualTotal += puntScore;
        }
      }

      // Calculate composite score per custodian
      const entries = Object.entries(byName).map(([name, m]) => {
        const puntualidad = m.puntualCount > 0 ? m.puntualTotal / m.puntualCount : 50;
        // Normalize: completados weight 40%, revenue 30%, puntualidad 30%
        const volScore = Math.min(100, (m.completados / 20) * 100); // 20 services in 30d = max
        const revScore = Math.min(100, (m.revenue / 100000) * 100); // 100k = max
        const score = volScore * 0.4 + revScore * 0.3 + puntualidad * 0.3;
        return { name, score };
      });

      entries.sort((a, b) => b.score - a.score);

      const totalFlota = entries.length;
      const idx = entries.findIndex(e => nombre.toLowerCase().includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(nombre.toLowerCase()));

      if (idx === -1) return null;

      const posicion = idx + 1;
      const percentil = Math.round((posicion / totalFlota) * 100);

      return { posicion, totalFlota, percentil, tier: getTier(percentil) };
    },
    enabled: !!nombre,
    staleTime: 1000 * 60 * 5,
  });
}
