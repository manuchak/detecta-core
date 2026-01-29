import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';

export interface PriceHistoryEntry {
  id: string;
  ruta_id: string;
  campo_modificado: string;
  valor_anterior: number | null;
  valor_nuevo: number | null;
  motivo: string | null;
  usuario_id: string | null;
  created_at: string;
  // Joined data
  cliente_nombre?: string;
  origen_texto?: string;
  destino_texto?: string;
  usuario_email?: string;
}

/**
 * Hook para obtener el historial de cambios de precios
 */
export function usePriceHistory(limit: number = 100) {
  return useAuthenticatedQuery<PriceHistoryEntry[]>(
    ['price-history', limit.toString()],
    async () => {
      const { data, error } = await supabase
        .from('matriz_precios_historial')
        .select(`
          *,
          matriz_precios_rutas!ruta_id (
            cliente_nombre,
            origen_texto,
            destino_texto
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(entry => ({
        ...entry,
        cliente_nombre: (entry.matriz_precios_rutas as any)?.cliente_nombre,
        origen_texto: (entry.matriz_precios_rutas as any)?.origen_texto,
        destino_texto: (entry.matriz_precios_rutas as any)?.destino_texto
      }));
    },
    { config: 'standard' }
  );
}

/**
 * Hook para obtener historial de una ruta específica
 */
export function useRouteHistory(routeId: string | null) {
  return useAuthenticatedQuery<PriceHistoryEntry[]>(
    ['route-history', routeId || 'none'],
    async () => {
      if (!routeId) return [];
      
      const { data, error } = await supabase
        .from('matriz_precios_historial')
        .select('*')
        .eq('ruta_id', routeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    { config: 'standard' }
  );
}
