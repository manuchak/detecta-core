import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeadsCounts {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  uncontacted: number;
}

export const useLeadsCounts = () => {
  return useQuery({
    queryKey: ['leads-counts'],
    queryFn: async (): Promise<LeadsCounts> => {
      const { data, error } = await supabase.rpc('get_leads_counts');
      
      if (error) {
        console.error('Error fetching leads counts:', error);
        throw error;
      }
      
      return data as LeadsCounts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });
};
