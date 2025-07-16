
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProductoInventario } from '@/types/wms';

export const useProductosInventario = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productos, isLoading, error } = useQuery({
    queryKey: ['productos-inventario'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos_inventario')
        .select(`
          *,
          categoria:categorias_productos(*),
          stock:stock_productos(*)
        `)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as ProductoInventario[];
    }
  });

  const createProducto = useMutation({
    mutationFn: async (producto: Omit<ProductoInventario, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('productos_inventario')
        .insert(producto)
        .select()
        .single();

      if (error) throw error;

      // Crear registro inicial de stock
      await supabase
        .from('stock_productos')
        .insert({
          producto_id: data.id,
          cantidad_disponible: 0,
          cantidad_reservada: 0,
          cantidad_transito: 0,
          valor_inventario: 0
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
      queryClient.invalidateQueries({ queryKey: ['stock-productos'] });
      toast({
        title: "Producto creado",
        description: "El producto ha sido registrado en el inventario.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el producto.",
        variant: "destructive",
      });
    }
  });

  const updateProducto = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProductoInventario> & { id: string }) => {
      const { data, error } = await supabase
        .from('productos_inventario')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
      toast({
        title: "Producto actualizado",
        description: "Los cambios han sido guardados.",
      });
    }
  });

  const deleteProducto = useMutation({
    mutationFn: async (id: string) => {
      // Obtener datos del producto antes de eliminarlo para el log
      const { data: producto } = await supabase
        .from('productos_inventario')
        .select('*')
        .eq('id', id)
        .single();

      // Primero eliminar el registro de stock relacionado
      await supabase
        .from('stock_productos')
        .delete()
        .eq('producto_id', id);
      
      // Luego eliminar el producto
      const { error } = await supabase
        .from('productos_inventario')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Registrar en el log de auditoría
      if (producto) {
        await supabase
          .from('audit_log_productos')
          .insert({
            producto_id: id,
            accion: 'eliminar',
            datos_anteriores: producto,
            datos_nuevos: null,
            usuario_id: (await supabase.auth.getUser()).data.user?.id,
            motivo: 'Eliminación de producto desde interfaz WMS'
          });
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado del inventario.",
      });
    }
  });

  return {
    productos,
    isLoading,
    error,
    createProducto,
    updateProducto,
    deleteProducto
  };
};
