import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SandboxPromotion {
  id: string;
  promotion_type: string;
  title: string;
  description: string;
  test_results: any;
  validation_criteria: any;
  deployment_strategy: string;
  current_phase: number;
  status: string;
  approved_by?: string;
  approval_justification?: string;
  deployment_started_at?: string;
  deployment_completed_at?: string;
  rollback_date?: string;
  rollback_reason?: string;
  live_metrics: any;
  error_log?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useSandboxPromotions = () => {
  return useQuery({
    queryKey: ['sandbox-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sandbox_promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promotions:', error);
        throw error;
      }

      return data as SandboxPromotion[];
    },
    staleTime: 30000,
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promotion: Partial<SandboxPromotion>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('sandbox_promotions')
        .insert({
          ...promotion,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sandbox-promotions'] });
      toast.success('Promoción creada exitosamente');
    },
    onError: (error) => {
      console.error('Error creating promotion:', error);
      toast.error('Error al crear la promoción');
    },
  });
};

export const useApprovePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      promotionId, 
      justification 
    }: { 
      promotionId: string; 
      justification: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('sandbox_promotions')
        .update({
          status: 'approved',
          approved_by: user.user?.id,
          approval_justification: justification,
        })
        .eq('id', promotionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sandbox-promotions'] });
      toast.success('Promoción aprobada - Listo para desplegar');
    },
    onError: (error) => {
      console.error('Error approving promotion:', error);
      toast.error('Error al aprobar la promoción');
    },
  });
};
