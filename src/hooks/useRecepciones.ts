import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { RecepcionMercancia, DetalleRecepcion } from '@/types/wms';

export const useRecepciones = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const { data: recepciones, isLoading, error } = useQuery({
    queryKey: ['recepciones'],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching recepciones...');
        
        const { data, error } = await supabase
          .from('recepciones_mercancia')
          .select(`
            *,
            orden_compra:ordenes_compra(*),
            proveedor:proveedores(*),
            detalles:detalles_recepcion(
              *,
              producto:productos_inventario(*)
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Recepciones query error:', error);
          throw error;
        }
        
        console.log('✅ Recepciones fetched successfully:', data?.length || 0, 'records');
        return data as RecepcionMercancia[];
      } catch (err) {
        console.error('❌ Recepciones fetch error:', err);
        throw err;
      }
    },
    enabled: !!user && !authLoading,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: ordenes, isLoading: isLoadingOrdenes } = useQuery({
    queryKey: ['ordenes-compra-pendientes'],
    queryFn: async () => {
      try {
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
          .eq('estado', 'enviada')
          .order('fecha_estimada_entrega', { ascending: true });

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('❌ Error fetching órdenes pendientes:', err);
        throw err;
      }
    },
    enabled: !!user && !authLoading,
  });

  const crearRecepcion = useMutation({
    mutationFn: async (recepcion: any) => {
      const { data, error } = await supabase
        .from('recepciones_mercancia')
        .insert(recepcion)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recepciones'] });
      toast({
        title: "Recepción creada",
        description: "La recepción ha sido registrada correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la recepción.",
        variant: "destructive",
      });
    }
  });

  const actualizarRecepcion = useMutation({
    mutationFn: async ({ id, ...recepcion }: Partial<RecepcionMercancia> & { id: string }) => {
      const { data, error } = await supabase
        .from('recepciones_mercancia')
        .update(recepcion)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recepciones'] });
      toast({
        title: "Recepción actualizada",
        description: "Los datos han sido guardados correctamente.",
      });
    }
  });

  const procesarRecepcion = useMutation({
    mutationFn: async ({ 
      recepcionId, 
      detalles 
    }: { 
      recepcionId: string; 
      detalles: Partial<DetalleRecepcion>[] 
    }) => {
      // Procesar cada detalle
      const detallesPromises = detalles.map(detalle =>
        supabase
          .from('detalles_recepcion')
          .upsert({
            producto_id: detalle.producto_id!,
            recepcion_id: recepcionId,
            cantidad_esperada: detalle.cantidad_esperada!,
            cantidad_recibida: detalle.cantidad_recibida!,
            diferencia: (detalle.cantidad_recibida || 0) - (detalle.cantidad_esperada || 0),
            estado_producto: detalle.estado_producto!,
            precio_unitario: detalle.precio_unitario,
            subtotal_esperado: detalle.subtotal_esperado,
            subtotal_recibido: detalle.subtotal_recibido,
            notas: detalle.notas
          })
      );

      await Promise.all(detallesPromises);

      // Actualizar estado de recepción
      const { data, error } = await supabase
        .from('recepciones_mercancia')
        .update({
          estado: 'completada',
          fecha_recepcion: new Date().toISOString(),
          recibido_por: user?.id
        })
        .eq('id', recepcionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recepciones'] });
      queryClient.invalidateQueries({ queryKey: ['stock-productos'] });
      toast({
        title: "Recepción procesada",
        description: "La mercancía ha sido recibida y el inventario actualizado.",
      });
    }
  });

  return {
    recepciones,
    ordenes,
    isLoading: authLoading || isLoading,
    isLoadingOrdenes: authLoading || isLoadingOrdenes,
    error,
    crearRecepcion,
    actualizarRecepcion,
    procesarRecepcion
  };
};