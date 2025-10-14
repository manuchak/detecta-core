import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSandboxMetrics = (isTest: boolean = true) => {
  return useQuery({
    queryKey: ['sandbox-metrics', isTest],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sandbox_metrics', {
        p_is_test: isTest,
      });

      if (error) {
        console.error('Error fetching sandbox metrics:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 30000, // Refetch cada 30s
  });
};
