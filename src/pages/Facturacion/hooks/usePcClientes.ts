import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PcClienteOption {
  id: string;
  nombre: string;
}

export function usePcClientes() {
  return useQuery({
    queryKey: ['pc-clientes-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pc_clientes')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return (data || []) as PcClienteOption[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
