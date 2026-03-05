import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useHotelesPernocta(filters?: { estado?: string }) {
  return useQuery({
    queryKey: ['hoteles-pernocta', filters],
    queryFn: async () => {
      let query = supabase
        .from('gastos_extraordinarios_servicio')
        .select('*')
        .in('tipo_gasto', ['hotel', 'pernocta'])
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters?.estado && filters.estado !== 'todos') {
        query = query.eq('estado_reembolso', filters.estado);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
}
