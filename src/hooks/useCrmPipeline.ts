import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CrmPipelineStage } from '@/types/crm';

export function useCrmPipeline() {
  return useQuery({
    queryKey: ['crm-pipeline-stages'],
    queryFn: async (): Promise<CrmPipelineStage[]> => {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('*')
        .eq('is_active', true)
        .order('order_nr', { ascending: true });

      if (error) {
        console.error('Error fetching pipeline stages:', error);
        throw error;
      }

      return (data || []) as CrmPipelineStage[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCrmStageById(stageId: string | null) {
  return useQuery({
    queryKey: ['crm-pipeline-stage', stageId],
    queryFn: async (): Promise<CrmPipelineStage | null> => {
      if (!stageId) return null;

      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('*')
        .eq('id', stageId)
        .single();

      if (error) {
        console.error('Error fetching stage:', error);
        return null;
      }

      return data as CrmPipelineStage;
    },
    enabled: !!stageId,
  });
}
