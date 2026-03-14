
// @ts-nocheck
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
      seriales,
      seriales_salida,
      es_serializado
    }: { 
      producto_id: string; 
      nueva_cantidad: number; 
      motivo: string; 
      seriales?: Array<{
        numero_serie: string;
        imei?: string;
        mac_address?: string;
      }>;
      seriales_salida?: string[]; // IDs de productos_serie a dar de baja
      es_serializado?: boolean;
    }) => {
      // Obtener cantidad actual
      const { data: stockActual } = await supabase
        .from('stock_productos')
        .select('cantidad_disponible, valor_inventario')
        .eq('producto_id', producto_id)
        .maybeSingle();

      const cantidadAnterior = stockActual?.cantidad_disponible || 0;
      const diferencia = nueva_cantidad - cantidadAnterior;
      const absDif = Math.abs(diferencia);

      // Obtener usuario actual de forma segura
      const { data: { user } } = await supabase.auth.getUser();

      let motivoFinal = motivo;

      // Si es salida de producto serializado, validar y actualizar seriales primero
      if (diferencia < 0 && es_serializado) {
        if (!seriales_salida || seriales_salida.length !== absDif) {
          throw new Error(`Debe seleccionar exactamente ${absDif} número(s) de serie para dar de baja.`);
        }

        // Validar pertenencia y estado de seriales
        const { data: serialesRows, error: serialesFetchError } = await supabase
          .from('productos_serie')
          .select('id, numero_serie, estado')
          .in('id', seriales_salida)
          .eq('producto_id', producto_id);
        if (serialesFetchError) throw serialesFetchError;
        if (!serialesRows || serialesRows.length !== absDif) {
          throw new Error('Algunos números de serie no pertenecen al producto seleccionado.');
        }
        const noDisponibles = serialesRows.filter(s => s.estado !== 'disponible');
        if (noDisponibles.length > 0) {
          throw new Error('Algunos números de serie no están disponibles para baja.');
        }

        const nowIso = new Date().toISOString();
        const { data: serialsUpdated, error: updateSerialsError } = await supabase
          .from('productos_serie')
          .update({ estado: 'dado_de_baja', updated_at: nowIso })
          .in('id', seriales_salida)
          .eq('producto_id', producto_id)
          .select('id');
        if (updateSerialsError) throw updateSerialsError;
        if (!serialsUpdated || serialsUpdated.length !== seriales_salida.length) {
          throw new Error(`Solo se actualizaron ${serialsUpdated?.length || 0} de ${seriales_salida.length} seriales — posible bloqueo de permisos`);
        }

        const serialNums = serialesRows.map(s => s.numero_serie).join(', ');
        motivoFinal = motivo ? `${motivo} | Seriales de baja: ${serialNums}` : `Seriales de baja: ${serialNums}`;
      }

      // Actualizar el stock en la tabla stock_productos
      const { data: stockUpdated, error: updateError } = await supabase
        .from('stock_productos')
        .update({ 
          cantidad_disponible: nueva_cantidad,
          ultima_actualizacion: new Date().toISOString()
        })
        .eq('producto_id', producto_id)
        .select('id');

      if (updateError) {
        // Intentar revertir actualización de seriales en caso de error al actualizar stock
        if (diferencia < 0 && seriales_salida && seriales_salida.length) {
          await supabase
            .from('productos_serie')
            .update({ estado: 'disponible', updated_at: new Date().toISOString() })
            .in('id', seriales_salida)
            .eq('producto_id', producto_id);
        }
        throw updateError;
      }
      if (!stockUpdated || stockUpdated.length === 0) {
        throw new Error('No se pudo actualizar el stock — posible bloqueo de permisos');
      }

      // Registrar movimiento en el historial
      const { data: movInserted, error: movError } = await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id,
          tipo_movimiento: 'ajuste',
          cantidad: Math.abs(diferencia),
          cantidad_anterior: cantidadAnterior,
          cantidad_nueva: nueva_cantidad,
          motivo: motivoFinal,
          referencia_tipo: 'ajuste_manual',
          referencia_id: null,
          usuario_id: user?.id,
          fecha_movimiento: new Date().toISOString()
        })
        .select('id');

      if (movError) throw movError;
      if (!movInserted || movInserted.length === 0) {
        throw new Error('No se pudo registrar el movimiento de inventario — posible bloqueo de permisos');
      }

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
        description: (error as any)?.message || "No se pudo actualizar el stock.",
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
