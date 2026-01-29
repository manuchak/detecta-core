import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OrigenConFrecuencia {
  origen: string;
  frecuencia: number;
  ultimoUso?: string;
  // Nuevo: agrupar orígenes similares
  variantes?: string[];
}

// Función helper para normalizar texto de ubicaciones
const normalizeLocationText = (text: string): string => {
  return text
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/\s*(EDO\.?\s*MEX\.?|EDOMEX|ESTADO DE MEXICO)\s*$/i, '') // Quitar sufijos de estado
    .replace(/\s+/g, ' ') // Normalizar espacios
    .replace(/,\s*/g, ' ') // Reemplazar comas por espacios
    .trim();
};

// Función para agrupar orígenes similares
const groupSimilarOrigins = (origins: string[]): Map<string, string[]> => {
  const groups = new Map<string, string[]>();
  
  origins.forEach(origin => {
    const normalized = normalizeLocationText(origin);
    const primaryWord = normalized.split(' ')[0]; // Primera palabra como clave
    
    if (!groups.has(primaryWord)) {
      groups.set(primaryWord, []);
    }
    groups.get(primaryWord)!.push(origin);
  });
  
  return groups;
};

export const useOrigenesConFrecuencia = (clienteNombre?: string) => {
  return useQuery({
    queryKey: ['origenes-con-frecuencia', clienteNombre],
    queryFn: async (): Promise<OrigenConFrecuencia[]> => {
      if (!clienteNombre) return [];

      try {
        // Usar la función RPC optimizada para obtener orígenes con frecuencia en una sola query
        // El RPC ahora usa LOWER() para comparación case-insensitive
        const { data, error } = await supabase.rpc('get_origenes_con_frecuencia', {
          cliente_nombre_param: clienteNombre.trim()
        });

        if (error) {
          console.error('Error fetching origins with frequency:', error);
          
          // Fallback: obtener orígenes directamente sin frecuencia usando ILIKE
          // Usamos % wildcards para mayor flexibilidad en la búsqueda
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('matriz_precios_rutas')
            .select('origen_texto')
            .eq('activo', true)
            .ilike('cliente_nombre', `%${clienteNombre.trim()}%`); // Case-insensitive con wildcards
            
          if (fallbackError) throw fallbackError;
          
          const allOrigins = fallbackData?.map(row => row.origen_texto) || [];
          const groups = groupSimilarOrigins(allOrigins);
          
          // Retornar un origen representativo por grupo
          const results: OrigenConFrecuencia[] = [];
          groups.forEach((variantes, _key) => {
            // Usar el origen más común o el primero
            const representativo = variantes[0];
            results.push({
              origen: representativo,
              frecuencia: variantes.length, // Frecuencia = cuántas variantes hay
              ultimoUso: undefined,
              variantes: variantes.length > 1 ? variantes : undefined
            });
          });
          
          return results.sort((a, b) => b.frecuencia - a.frecuencia);
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
    staleTime: 2 * 60 * 1000, // 2 minutos - balance entre cache y frescura
    gcTime: 10 * 60 * 1000, // 10 minutos - suficiente para sesiones activas
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    refetchOnMount: true, // Refrescar al montar si los datos están stale
    retry: 2, // Intentar 2 veces antes de fallar
    retryDelay: 1000, // 1 segundo entre reintentos
  });
};