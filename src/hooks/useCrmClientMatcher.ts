import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClientMatchResult } from '@/types/crm';

function getMatchStatus(confidence: number | null): ClientMatchResult['matchStatus'] {
  if (confidence === null || confidence === 0) return 'no-match';
  if (confidence >= 1) return 'verified';
  if (confidence >= 0.7) return 'auto-match';
  return 'pending';
}

export interface CrmClientMatchFilter {
  months?: number | null; // null = all time
}

export function useCrmClientMatches(filter?: CrmClientMatchFilter) {
  const months = filter?.months ?? 6; // Default: 6 months
  
  return useQuery({
    queryKey: ['crm-client-matches', months],
    queryFn: async (): Promise<ClientMatchResult[]> => {
      // Calculate cutoff date if filtering by months
      let cutoffDate: string | null = null;
      if (months !== null) {
        const date = new Date();
        date.setMonth(date.getMonth() - months);
        cutoffDate = date.toISOString();
      }

      // Get open and won deals with optional date filter
      let query = supabase
        .from('crm_deals')
        .select('id, title, organization_name, matched_client_name, match_confidence, value')
        .eq('is_deleted', false)
        .in('status', ['open', 'won']);

      if (cutoffDate) {
        query = query.gte('created_at', cutoffDate);
      }

      const { data: deals, error: dealsError } = await query.order('value', { ascending: false });

      if (dealsError) {
        console.error('Error fetching deals for matching:', dealsError);
        throw dealsError;
      }

      // Get GMV by client from servicios_custodia
      const { data: gmvData, error: gmvError } = await supabase
        .from('servicios_custodia')
        .select('nombre_cliente, cobro_cliente')
        .not('cobro_cliente', 'is', null);

      if (gmvError) {
        console.error('Error fetching GMV data:', gmvError);
      }

      // Aggregate GMV by client name
      const gmvByClient: Record<string, number> = {};
      (gmvData || []).forEach(row => {
        const name = row.nombre_cliente?.toUpperCase().trim() || '';
        if (name) {
          gmvByClient[name] = (gmvByClient[name] || 0) + (Number(row.cobro_cliente) || 0);
        }
      });

      return (deals || []).map(deal => {
        const matchedName = deal.matched_client_name?.toUpperCase().trim() || '';
        const gmvReal = matchedName ? gmvByClient[matchedName] || null : null;

        return {
          dealId: deal.id,
          dealTitle: deal.title,
          organizationName: deal.organization_name,
          matchedClientName: deal.matched_client_name,
          matchConfidence: deal.match_confidence,
          matchStatus: getMatchStatus(deal.match_confidence),
          dealValue: Number(deal.value) || 0,
          gmvReal,
        };
      });
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSearchClients(searchTerm: string) {
  return useQuery({
    queryKey: ['search-clients', searchTerm],
    queryFn: async (): Promise<string[]> => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('nombre_cliente')
        .ilike('nombre_cliente', `%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error searching clients:', error);
        return [];
      }

      // Deduplicate
      const unique = [...new Set((data || []).map(d => d.nombre_cliente).filter(Boolean))];
      return unique as string[];
    },
    enabled: searchTerm.length >= 2,
  });
}

export function useLinkDealToClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      dealId, 
      clientName 
    }: { 
      dealId: string; 
      clientName: string;
    }) => {
      const { error } = await supabase
        .from('crm_deals')
        .update({
          matched_client_name: clientName,
          match_confidence: 1.0, // Manual match = verified
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-client-matches'] });
    },
  });
}

export function useUnlinkDealFromClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from('crm_deals')
        .update({
          matched_client_name: null,
          match_confidence: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-client-matches'] });
    },
  });
}
