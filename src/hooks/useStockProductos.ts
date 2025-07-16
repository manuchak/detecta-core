
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { StockProducto, MovimientoInventario } from '@/types/wms';

export const useStockProductos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const { data: stock, isLoading, error } = useQuery({
    queryKey: ['stock-productos'],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching stock productos...');
        
        // Verificar sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Usuario no autenticado');
        }
        
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

        if (error) {
          console.error('❌ Stock productos query error:', error);
          throw error;
        }
        
        console.log('✅ Stock productos fetched successfully:', data?.length || 0, 'records');
        return data as StockProducto[];
      } catch (err) {
        console.error('❌ Stock productos fetch error:', err);
        throw err;
      }
    },
    enabled: !!user && !authLoading, // Solo ejecutar si hay usuario autenticado
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: movimientos, isLoading: isLoadingMovimientos } = useQuery({
    queryKey: ['movimientos-stock'],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching movimientos stock...');
        
        // Verificar sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Usuario no autenticado');
        }
        
        const { data, error } = await supabase
          .from('movimientos_inventario')
          .select(`
            *,
            producto:productos_inventario(*)
          `)
          .order('fecha_movimiento', { ascending: false })
          .limit(100);

        if (error) {
          console.error('❌ Movimientos stock query error:', error);
          throw error;
        }
        
        console.log('✅ Movimientos stock fetched successfully:', data?.length || 0, 'records');
        return data;
      } catch (err) {
        console.error('❌ Movimientos stock fetch error:', err);
        throw err;
      }
    },
    enabled: !!user && !authLoading, // Solo ejecutar si hay usuario autenticado
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const registrarMovimiento = useMutation({
    mutationFn: async (movimiento: {
      producto_id: string;
      tipo_movimiento: string;
      cantidad: number;
      cantidad_anterior: number;
      cantidad_nueva: number;
      motivo?: string;
      referencia?: string;
      usuario_id?: string;
    }) => {
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
      queryClient.invalidateQueries({ queryKey: ['movimientos-stock'] });
      toast({
        title: "Movimiento registrado",
        description: "El movimiento de stock ha sido procesado.",
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
          referencia: 'ajuste_manual',
          usuario_id: user?.id
        });

      return { producto_id, nueva_cantidad };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos-stock'] });
      toast({
        title: "Stock ajustado",
        description: "El stock ha sido actualizado correctamente.",
      });
    }
  });

  return {
    stock,
    movimientos,
    isLoading: authLoading || isLoading,
    isLoadingMovimientos: authLoading || isLoadingMovimientos,
    error,
    registrarMovimiento,
    ajustarStock
  };
};
