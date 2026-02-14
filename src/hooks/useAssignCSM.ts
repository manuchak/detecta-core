import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCSMOptions() {
  return useQuery({
    queryKey: ['csm-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .order('display_name');
      if (error) throw error;
      return (data || []).filter(p => p.display_name);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignCSM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clienteId, csmId }: { clienteId: string; csmId: string | null }) => {
      const { error } = await supabase
        .from('pc_clientes')
        .update({ csm_asignado: csmId } as any)
        .eq('id', clienteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('CSM asignado correctamente');
      qc.invalidateQueries({ queryKey: ['cs-cartera'] });
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });
}
