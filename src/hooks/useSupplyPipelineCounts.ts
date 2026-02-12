import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineCounts {
  aprobaciones: number | null;
  evaluaciones: number | null;
  liberacion: number | null;
  operativos: number | null;
}

export function useSupplyPipelineCounts() {
  return useQuery({
    queryKey: ['supply-pipeline-counts'],
    queryFn: async (): Promise<PipelineCounts> => {
      const [aprobaciones, evaluaciones, liberacion, operativos] = await Promise.allSettled([
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('final_decision', 'approved'),
        supabase
          .from('candidatos_custodios')
          .select('*', { count: 'exact', head: true })
          .in('estado_proceso', ['aprobado', 'en_evaluacion']),
        supabase
          .from('custodio_liberacion')
          .select('*', { count: 'exact', head: true })
          .not('estado_liberacion', 'in', '("liberado","rechazado")'),
        supabase
          .from('custodios_operativos')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'activo'),
      ]);

      return {
        aprobaciones: aprobaciones.status === 'fulfilled' ? aprobaciones.value.count : null,
        evaluaciones: evaluaciones.status === 'fulfilled' ? evaluaciones.value.count : null,
        liberacion: liberacion.status === 'fulfilled' ? liberacion.value.count : null,
        operativos: operativos.status === 'fulfilled' ? operativos.value.count : null,
      };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
