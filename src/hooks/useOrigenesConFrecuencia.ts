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

      try {
        // Usar la función RPC optimizada para obtener orígenes con frecuencia en una sola query
        const { data, error } = await supabase.rpc('get_origenes_con_frecuencia', {
          cliente_nombre_param: clienteNombre
        });

        if (error) {
          console.error('Error fetching origins with frequency:', error);
          
          // Fallback: obtener orígenes directamente sin frecuencia
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('matriz_precios_rutas')
            .select('origen_texto')
            .eq('activo', true)
            .eq('cliente_nombre', clienteNombre);
            
          if (fallbackError) throw fallbackError;
          
          const uniqueOrigins = Array.from(new Set(fallbackData?.map(row => row.origen_texto) || []));
          return uniqueOrigins.map(origen => ({
            origen,
            frecuencia: 0,
            ultimoUso: undefined
          }));
        }

        // Transformar la respuesta al formato esperado
        return (data || []).map(row => ({
          origen: row.origen,
          frecuencia: Number(row.frecuencia),
          ultimoUso: row.ultimo_uso
        }));
      } catch (err) {
        console.error('Error in useOrigenesConFrecuencia:', err);
        return [];
      }
    },
    enabled: !!clienteNombre,
    staleTime: 5 * 60 * 1000, // Considerar datos frescos por 5 minutos
    gcTime: 15 * 60 * 1000, // Mantener en cache por 15 minutos
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    retry: 2, // Intentar 2 veces antes de fallar
    retryDelay: 1000, // 1 segundo entre reintentos
  });
};