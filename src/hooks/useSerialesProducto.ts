// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SerialProductoRow {
  id: string;
  numero_serie: string | null;
  imei: string | null;
  mac_address: string | null;
  estado: string | null;
}

export const useSerialesProducto = (productoId?: string) => {
  const query = useQuery({
    queryKey: ['seriales-producto', productoId],
    queryFn: async (): Promise<SerialProductoRow[]> => {
      if (!productoId) return [];
      const { data, error } = await supabase
        .from('productos_serie')
        .select('id, numero_serie, imei, mac_address, estado')
        .eq('producto_id', productoId)
        .eq('estado', 'disponible')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as SerialProductoRow[];
    },
    enabled: !!productoId,
    staleTime: 5 * 60 * 1000,
  });

  return query;
};
