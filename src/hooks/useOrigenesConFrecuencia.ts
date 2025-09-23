import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OrigenConFrecuencia {
  origen: string;
  frecuencia: number;
  ultimoUso?: string;
}

export const useOrigenesConFrecuencia = (clienteNombre?: string) => {
  return useQuery({
    queryKey: ['origenes-con-frecuencia', clienteNombre],
    queryFn: async (): Promise<OrigenConFrecuencia[]> => {
      if (!clienteNombre) return [];

      // Usar la función RPC optimizada para obtener orígenes con frecuencia en una sola query
      const { data, error } = await supabase.rpc('get_origenes_con_frecuencia', {
        cliente_nombre_param: clienteNombre
      });

      if (error) {
        console.error('Error fetching origins with frequency:', error);
        throw error;
      }

      // Transformar la respuesta al formato esperado
      return (data || []).map(row => ({
        origen: row.origen,
        frecuencia: Number(row.frecuencia),
        ultimoUso: row.ultimo_uso
      }));
    },
    enabled: !!clienteNombre,
    staleTime: 5 * 60 * 1000, // Considerar datos frescos por 5 minutos
    gcTime: 15 * 60 * 1000, // Mantener en cache por 15 minutos
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
  });
};