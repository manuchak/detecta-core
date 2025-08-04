import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useProductoActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Opción 1: Marcar producto como inactivo
  const marcarInactivo = useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string }) => {
      const { data, error } = await supabase.rpc('marcar_producto_inactivo', {
        p_producto_id: id,
        p_motivo: motivo || 'Marcado como inactivo desde interfaz'
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
      toast({
        title: "Producto marcado como inactivo",
        description: "El producto ha sido desactivado pero mantiene su historial.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al marcar como inactivo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Opción 2: Eliminar producto (solo si no tiene movimientos ni seriales)
  const eliminarProducto = useMutation({
    mutationFn: async (id: string) => {
      // Verificar movimientos de inventario
      const { data: movimientos } = await supabase
        .from('movimientos_inventario')
        .select('id')
        .eq('producto_id', id);

      if (movimientos && movimientos.length > 0) {
        throw new Error(`No se puede eliminar este producto porque tiene ${movimientos.length} movimiento(s) de inventario registrado(s). Use la opción "Marcar como inactivo" o "Archivar" en su lugar.`);
      }

      // Verificar números de serie
      const { data: seriales } = await supabase
        .from('productos_serie')
        .select('id')
        .eq('producto_id', id);

      if (seriales && seriales.length > 0) {
        throw new Error(`No se puede eliminar este producto porque tiene ${seriales.length} número(s) de serie registrado(s). Debe eliminar primero todos los números de serie asociados o usar la opción "Archivar".`);
      }

      // Obtener datos del producto para el log
      const { data: producto } = await supabase
        .from('productos_inventario')
        .select('*')
        .eq('id', id)
        .single();

      // Eliminar registro de stock
      await supabase
        .from('stock_productos')
        .delete()
        .eq('producto_id', id);
      
      // Eliminar producto
      const { error } = await supabase
        .from('productos_inventario')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Registrar en audit log
      if (producto) {
        await supabase
          .from('audit_log_productos')
          .insert({
            producto_id: id,
            accion: 'eliminar',
            datos_anteriores: producto,
            datos_nuevos: null,
            usuario_id: (await supabase.auth.getUser()).data.user?.id,
            motivo: 'Eliminación permanente desde interfaz WMS'
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado permanentemente del inventario.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar producto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Opción 3: Archivar producto
  const archivarProducto = useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string }) => {
      const { data, error } = await supabase.rpc('archivar_producto', {
        p_producto_id: id,
        p_motivo: motivo || 'Producto archivado por obsolescencia'
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
      toast({
        title: "Producto archivado",
        description: "El producto ha sido archivado y marcado como obsoleto.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al archivar producto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Función para restaurar producto
  const restaurarProducto = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('restaurar_producto', {
        p_producto_id: id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
      toast({
        title: "Producto restaurado",
        description: "El producto ha sido reactivado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al restaurar producto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    marcarInactivo,
    eliminarProducto,
    archivarProducto,
    restaurarProducto
  };
};