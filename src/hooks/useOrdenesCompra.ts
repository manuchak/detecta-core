
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { OrdenCompra, DetalleOrdenCompra } from '@/types/wms';

export const useOrdenesCompra = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ordenes, isLoading, error } = useQuery({
    queryKey: ['ordenes-compra'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordenes_compra')
        .select(`
          *,
          proveedor:proveedores(*),
          detalles:detalles_orden_compra(
            *,
            producto:productos_inventario(*)
          )
        `)
        .order('fecha_orden', { ascending: false });

      if (error) throw error;
      return data as OrdenCompra[];
    }
  });

  const createOrden = useMutation({
    mutationFn: async (orden: Omit<OrdenCompra, 'id' | 'created_at' | 'updated_at'>) => {
      // Generar número de orden automático
      const { count } = await supabase
        .from('ordenes_compra')
        .select('*', { count: 'exact', head: true });
      
      const numeroOrden = `OC-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

      const { data, error } = await supabase
        .from('ordenes_compra')
        .insert({ ...orden, numero_orden: numeroOrden })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      toast({
        title: "Orden de compra creada",
        description: "La orden ha sido registrada exitosamente.",
      });
    }
  });

  const updateOrden = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OrdenCompra> & { id: string }) => {
      const { data, error } = await supabase
        .from('ordenes_compra')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      toast({
        title: "Orden actualizada",
        description: "Los cambios han sido guardados.",
      });
    }
  });

  const addDetalleOrden = useMutation({
    mutationFn: async (detalle: Omit<DetalleOrdenCompra, 'id' | 'subtotal' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('detalles_orden_compra')
        .insert(detalle)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
    }
  });

  return {
    ordenes,
    isLoading,
    error,
    createOrden,
    updateOrden,
    addDetalleOrden
  };
};
