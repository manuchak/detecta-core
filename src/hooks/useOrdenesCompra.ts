
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { OrdenCompra, DetalleOrdenCompra } from '@/types/wms';

interface CreateDetalleOrdenCompra {
  producto_id: string;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  notas?: string;
}

interface CreateOrdenCompraData {
  proveedor_id: string;
  fecha_orden: string;
  fecha_entrega_esperada?: string;
  estado: 'borrador' | 'enviada' | 'confirmada' | 'parcial' | 'recibida' | 'cancelada';
  subtotal: number;
  impuestos: number;
  total: number;
  moneda?: string;
  terminos_pago?: string;
  notas?: string;
  creado_por?: string;
  detalles?: CreateDetalleOrdenCompra[];
}

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
    mutationFn: async (ordenData: CreateOrdenCompraData) => {
      // Generar número de orden automático
      const { count } = await supabase
        .from('ordenes_compra')
        .select('*', { count: 'exact', head: true });
      
      const numeroOrden = `OC-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

      const { detalles, ...orden } = ordenData;

      // Crear la orden principal
      const { data: ordenCreada, error: ordenError } = await supabase
        .from('ordenes_compra')
        .insert({ ...orden, numero_orden: numeroOrden })
        .select()
        .single();

      if (ordenError) throw ordenError;

      // Si hay detalles, crearlos
      if (detalles && detalles.length > 0) {
        const detallesConOrden = detalles.map(detalle => ({
          ...detalle,
          orden_id: ordenCreada.id,
          subtotal: (detalle.cantidad_solicitada * detalle.precio_unitario) * (1 - (detalle.descuento_porcentaje || 0) / 100)
        }));

        const { error: detallesError } = await supabase
          .from('detalles_orden_compra')
          .insert(detallesConOrden);

        if (detallesError) throw detallesError;
      }

      return ordenCreada;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      toast({
        title: "Orden de compra creada",
        description: "La orden ha sido registrada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error creating orden:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la orden de compra.",
        variant: "destructive",
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
      const subtotal = (detalle.cantidad_solicitada * detalle.precio_unitario) * (1 - (detalle.descuento_porcentaje || 0) / 100);
      
      const { data, error } = await supabase
        .from('detalles_orden_compra')
        .insert({ ...detalle, subtotal })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
    }
  });

  const recibirOrden = useMutation({
    mutationFn: async ({ ordenId, detallesRecepcion }: { 
      ordenId: string; 
      detallesRecepcion: { detalle_id: string; cantidad_recibida: number; estado_producto: string; notas?: string }[] 
    }) => {
      // Actualizar cantidades recibidas en detalles
      for (const recepcion of detallesRecepcion) {
        const { error: detalleError } = await supabase
          .from('detalles_orden_compra')
          .update({ cantidad_recibida: recepcion.cantidad_recibida })
          .eq('id', recepcion.detalle_id);

        if (detalleError) throw detalleError;

        // Obtener información del detalle para actualizar stock
        const { data: detalle, error: detalleQueryError } = await supabase
          .from('detalles_orden_compra')
          .select('producto_id, cantidad_recibida, precio_unitario')
          .eq('id', recepcion.detalle_id)
          .single();

        if (detalleQueryError) throw detalleQueryError;

        // Actualizar stock del producto
        if (recepcion.cantidad_recibida > 0 && recepcion.estado_producto === 'bueno') {
          // Obtener stock actual
          const { data: stockActual, error: stockError } = await supabase
            .from('stock_productos')
            .select('cantidad_disponible, valor_inventario')
            .eq('producto_id', detalle.producto_id)
            .single();

          if (stockError && stockError.code !== 'PGRST116') throw stockError;

          const nuevaCantidad = (stockActual?.cantidad_disponible || 0) + recepcion.cantidad_recibida;
          const nuevoValor = (stockActual?.valor_inventario || 0) + (recepcion.cantidad_recibida * detalle.precio_unitario);

          if (stockActual) {
            // Actualizar stock existente
            const { error: updateStockError } = await supabase
              .from('stock_productos')
              .update({
                cantidad_disponible: nuevaCantidad,
                valor_inventario: nuevoValor,
                ultima_actualizacion: new Date().toISOString()
              })
              .eq('producto_id', detalle.producto_id);

            if (updateStockError) throw updateStockError;
          } else {
            // Crear nuevo registro de stock
            const { error: createStockError } = await supabase
              .from('stock_productos')
              .insert({
                producto_id: detalle.producto_id,
                cantidad_disponible: nuevaCantidad,
                cantidad_reservada: 0,
                cantidad_transito: 0,
                valor_inventario: nuevoValor,
                ultima_actualizacion: new Date().toISOString()
              });

            if (createStockError) throw createStockError;
          }

          // Registrar movimiento de inventario
          const { error: movimientoError } = await supabase
            .from('movimientos_inventario')
            .insert({
              producto_id: detalle.producto_id,
              tipo_movimiento: 'entrada',
              cantidad: recepcion.cantidad_recibida,
              cantidad_anterior: stockActual?.cantidad_disponible || 0,
              cantidad_nueva: nuevaCantidad,
              costo_unitario: detalle.precio_unitario,
              valor_total: recepcion.cantidad_recibida * detalle.precio_unitario,
              referencia_tipo: 'orden_compra',
              referencia_id: ordenId,
              motivo: 'Recepción de orden de compra',
              usuario_id: (await supabase.auth.getUser()).data.user?.id
            });

          if (movimientoError) throw movimientoError;
        }
      }

      // Verificar si la orden está completamente recibida
      const { data: detallesOrden, error: detallesError } = await supabase
        .from('detalles_orden_compra')
        .select('cantidad_solicitada, cantidad_recibida')
        .eq('orden_id', ordenId);

      if (detallesError) throw detallesError;

      const totalSolicitado = detallesOrden.reduce((sum, d) => sum + d.cantidad_solicitada, 0);
      const totalRecibido = detallesOrden.reduce((sum, d) => sum + d.cantidad_recibida, 0);
      
      let nuevoEstado = 'parcial';
      if (totalRecibido === totalSolicitado) {
        nuevoEstado = 'recibida';
      } else if (totalRecibido === 0) {
        nuevoEstado = 'confirmada';
      }

      // Actualizar estado de la orden
      const { error: ordenError } = await supabase
        .from('ordenes_compra')
        .update({ 
          estado: nuevoEstado,
          fecha_entrega_real: nuevoEstado === 'recibida' ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', ordenId);

      if (ordenError) throw ordenError;

      return { ordenId, nuevoEstado };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      queryClient.invalidateQueries({ queryKey: ['stock-productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] });
      toast({
        title: "Recepción procesada",
        description: "La mercancía ha sido recibida e ingresada al inventario.",
      });
    }
  });

  return {
    ordenes,
    isLoading,
    error,
    createOrden,
    updateOrden,
    addDetalleOrden,
    recibirOrden
  };
};
