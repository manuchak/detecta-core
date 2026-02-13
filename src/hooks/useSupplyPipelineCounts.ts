import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineCounts {
  candidatos: number | null;
  aprobaciones: number | null;
  evaluaciones: number | null;
  liberacion: number | null;
  operativos: number | null;
}

export function useSupplyPipelineCounts() {
  return useQuery({
    queryKey: ['supply-pipeline-counts'],
    queryFn: async (): Promise<PipelineCounts> => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 15);
      const cutoffISO = cutoff.toISOString();

      const [candidatos, aprobaciones, evaluaciones, liberacion, operativos] = await Promise.allSettled([
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .is('asignado_a', null)
          .not('estado', 'in', '("rechazado","inactivo","custodio_activo")')
          .gte('created_at', cutoffISO),
        supabase
          .from('lead_approval_process')
          .select('*', { count: 'exact', head: true })
          .is('final_decision', null),
        supabase
          .from('candidatos_custodios')
          .select('*', { count: 'exact', head: true })
          .in('estado_proceso', ['aprobado', 'en_evaluacion'])
          .gte('created_at', cutoffISO),
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
        candidatos: candidatos.status === 'fulfilled' ? candidatos.value.count : null,
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
