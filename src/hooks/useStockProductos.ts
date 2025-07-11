
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { StockProducto, MovimientoInventario } from '@/types/wms';

export const useStockProductos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stock, isLoading, error } = useQuery({
    queryKey: ['stock-productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_productos')
        .select(`
          *,
          producto:productos_inventario(
            *,
            categoria:categorias_productos(*)
          )
        `)
        .order('ultima_actualizacion', { ascending: false });

      if (error) throw error;
      return data as StockProducto[];
    }
  });

  const { data: movimientos, isLoading: isLoadingMovimientos } = useQuery({
    queryKey: ['movimientos-inventario'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimientos_inventario')
        .select(`
          *,
          producto:productos_inventario(*)
        `)
        .order('fecha_movimiento', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as MovimientoInventario[];
    }
  });

  const registrarMovimiento = useMutation({
    mutationFn: async (movimiento: Omit<MovimientoInventario, 'id' | 'fecha_movimiento'>) => {
      const { data, error } = await supabase
        .from('movimientos_inventario')
        .insert(movimiento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] });
      toast({
        title: "Movimiento registrado",
        description: "El movimiento de inventario ha sido procesado.",
      });
    }
  });

  const ajustarStock = useMutation({
    mutationFn: async ({ 
      producto_id, 
      nueva_cantidad, 
      motivo 
    }: { 
      producto_id: string; 
      nueva_cantidad: number; 
      motivo: string; 
    }) => {
      // Obtener cantidad actual
      const { data: stockActual } = await supabase
        .from('stock_productos')
        .select('cantidad_disponible')
        .eq('producto_id', producto_id)
        .maybeSingle();

      const cantidadAnterior = stockActual?.cantidad_disponible || 0;
      const diferencia = nueva_cantidad - cantidadAnterior;

      // Obtener usuario actual de forma segura
      const { data: { user } } = await supabase.auth.getUser();

      // Registrar movimiento
      await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id,
          tipo_movimiento: 'ajuste',
          cantidad: Math.abs(diferencia),
          cantidad_anterior: cantidadAnterior,
          cantidad_nueva: nueva_cantidad,
          motivo,
          referencia_tipo: 'ajuste_manual',
          usuario_id: user?.id
        });

      return { producto_id, nueva_cantidad };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] });
      toast({
        title: "Stock ajustado",
        description: "El stock ha sido actualizado correctamente.",
      });
    }
  });

  return {
    stock,
    movimientos,
    isLoading,
    isLoadingMovimientos,
    error,
    registrarMovimiento,
    ajustarStock
  };
};
