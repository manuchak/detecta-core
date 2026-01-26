import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CrmDeal, CrmDealWithStage, DealFilters } from '@/types/crm';

export function useCrmDeals(filters?: DealFilters) {
  return useQuery({
    queryKey: ['crm-deals', filters],
    queryFn: async (): Promise<CrmDealWithStage[]> => {
      let query = supabase
        .from('crm_deals')
        .select(`
          *,
          crm_pipeline_stages (
            id,
            pipedrive_id,
            name,
            pipeline_name,
            order_nr,
            deal_probability,
            is_active
          )
        `)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.stageId) {
        query = query.eq('stage_id', filters.stageId);
      }

      if (filters?.ownerName) {
        query = query.ilike('owner_name', `%${filters.ownerName}%`);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,organization_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching deals:', error);
        throw error;
      }

      return (data || []) as CrmDealWithStage[];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCrmDealById(dealId: string | null) {
  return useQuery({
    queryKey: ['crm-deal', dealId],
    queryFn: async (): Promise<CrmDealWithStage | null> => {
      if (!dealId) return null;

      const { data, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          crm_pipeline_stages (*)
        `)
        .eq('id', dealId)
        .single();

      if (error) {
        console.error('Error fetching deal:', error);
        return null;
      }

      return data as CrmDealWithStage;
    },
    enabled: !!dealId,
  });
}

export function useCrmDealsByStage() {
  const { data: deals, ...rest } = useCrmDeals({ status: 'open' });

  const dealsByStage = (deals || []).reduce((acc, deal) => {
    const stageId = deal.stage_id || 'unassigned';
    if (!acc[stageId]) {
      acc[stageId] = [];
    }
    acc[stageId].push(deal);
    return acc;
  }, {} as Record<string, CrmDealWithStage[]>);

  return { dealsByStage, deals, ...rest };
}

export function useUpdateDealMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      dealId, 
      matchedClientName, 
      matchConfidence 
    }: { 
      dealId: string; 
      matchedClientName: string | null; 
      matchConfidence: number;
    }) => {
      const { error } = await supabase
        .from('crm_deals')
        .update({
          matched_client_name: matchedClientName,
          match_confidence: matchConfidence,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    },
  });
}
