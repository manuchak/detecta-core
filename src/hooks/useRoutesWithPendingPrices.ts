import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';

export interface PendingPriceRoute {
  id: string;
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  valor_bruto: number;
  precio_custodio: number;
  costo_operativo: number;
  margen_neto_calculado: number;
  porcentaje_utilidad: number;
  created_at: string;
  updated_at: string;
  dias_sin_actualizar: number;
  tiene_margen_negativo: boolean;
  es_precio_placeholder: boolean;
}

/**
 * Hook para obtener rutas con precios pendientes de actualización
 * Criterios: valor_bruto <= 10 OR valor_bruto < precio_custodio
 */
export function useRoutesWithPendingPrices() {
  return useAuthenticatedQuery<PendingPriceRoute[]>(
    ['routes-pending-prices'],
    async () => {
      const { data, error } = await supabase
        .from('matriz_precios_rutas')
        .select('*')
        .eq('activo', true)
        .or('valor_bruto.lte.10,valor_bruto.lt.precio_custodio')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(route => {
        const createdAt = new Date(route.created_at);
        const updatedAt = route.updated_at ? new Date(route.updated_at) : createdAt;
        const now = new Date();
        const diasSinActualizar = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...route,
          dias_sin_actualizar: diasSinActualizar,
          tiene_margen_negativo: route.valor_bruto < route.precio_custodio,
          es_precio_placeholder: route.valor_bruto <= 10
        };
      });
    },
    { config: 'standard' }
  );
}

/**
 * Hook para obtener todas las rutas activas
 */
export function useAllRoutes() {
  return useAuthenticatedQuery(
    ['all-routes'],
    async () => {
      const { data, error } = await supabase
        .from('matriz_precios_rutas')
        .select('*')
        .eq('activo', true)
        .order('cliente_nombre', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    { config: 'standard' }
  );
}

/**
 * Hook para obtener estadísticas de rutas
 */
export function useRoutesStats() {
  return useAuthenticatedQuery(
    ['routes-stats'],
    async () => {
      const { data, error } = await supabase
        .from('matriz_precios_rutas')
        .select('id, valor_bruto, precio_custodio, margen_neto_calculado')
        .eq('activo', true);
      
      if (error) throw error;
      
      const routes = data || [];
      const total = routes.length;
      const pendingPrices = routes.filter(r => r.valor_bruto <= 10).length;
      const negativeMargin = routes.filter(r => r.valor_bruto < r.precio_custodio).length;
      
      return {
        total,
        pendingPrices,
        negativeMargin,
        validRoutes: total - pendingPrices - negativeMargin
      };
    },
    { config: 'standard' }
  );
}
