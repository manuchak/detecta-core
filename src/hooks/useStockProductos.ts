
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
      motivo,
      seriales
    }: { 
      producto_id: string; 
      nueva_cantidad: number; 
      motivo: string; 
      seriales?: Array<{
        numero_serie: string;
        imei?: string;
        mac_address?: string;
      }>;
    }) => {
      // Obtener cantidad actual
      const { data: stockActual } = await supabase
        .from('stock_productos')
        .select('cantidad_disponible, valor_inventario')
        .eq('producto_id', producto_id)
        .maybeSingle();

      const cantidadAnterior = stockActual?.cantidad_disponible || 0;
      const diferencia = nueva_cantidad - cantidadAnterior;

      // Obtener usuario actual de forma segura
      const { data: { user } } = await supabase.auth.getUser();

      // Actualizar el stock en la tabla stock_productos
      const { error: updateError } = await supabase
        .from('stock_productos')
        .update({ 
          cantidad_disponible: nueva_cantidad,
          ultima_actualizacion: new Date().toISOString()
        })
        .eq('producto_id', producto_id);

      if (updateError) throw updateError;

      // Registrar movimiento en el historial
      const { error: movError } = await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id,
          tipo_movimiento: 'ajuste',
          cantidad: Math.abs(diferencia),
          cantidad_anterior: cantidadAnterior,
          cantidad_nueva: nueva_cantidad,
          motivo,
          referencia_tipo: 'ajuste_manual',
          referencia_id: null,
          usuario_id: user?.id,
          fecha_movimiento: new Date().toISOString()
        });

      if (movError) throw movError;

      // Si hay seriales para registrar (para entradas de productos serializados)
      if (seriales && seriales.length > 0 && diferencia > 0) {
        const serialesParaInsertar = seriales.map(serial => ({
          producto_id,
          numero_serie: serial.numero_serie.trim(),
          imei: serial.imei?.trim() || null,
          mac_address: serial.mac_address?.trim() || null,
          estado: 'disponible',
          fecha_ingreso: new Date().toISOString(),
          // orden_compra_id se puede agregar después si es necesario
        }));

        const { error: serialesError } = await supabase
          .from('productos_serie')
          .insert(serialesParaInsertar);

        if (serialesError) {
          console.error('Error inserting serials:', serialesError);
          throw new Error(`Error al registrar números de serie: ${serialesError.message}`);
        }
      }

      return { producto_id, nueva_cantidad, diferencia };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos-stock'] });
      toast({
        title: "Stock ajustado",
        description: "El stock ha sido actualizado correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error adjusting stock:', error);
      toast({
        title: "Error al ajustar stock",
        description: "No se pudo actualizar el stock. Verifique sus permisos.",
        variant: "destructive",
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
