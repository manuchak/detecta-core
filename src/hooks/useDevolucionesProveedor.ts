import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DevolucionProveedor, DetalleDevolucionProveedor } from '@/types/wms';

export interface NuevaDevolucionInput {
  numero_rma?: string;
  proveedor_id?: string;
  notas?: string;
}

export interface NuevoDetalleDevolucionInput {
  devolucion_id: string;
  producto_id: string;
  cantidad: number;
  motivo?: string;
  seriales?: string[];
  costo_unitario?: number;
}

export const useDevolucionesProveedor = () => {
  const qc = useQueryClient();

  const devolucionesQuery = useQuery({
    queryKey: ['devoluciones-proveedor'],
    queryFn: async (): Promise<DevolucionProveedor[]> => {
      const { data, error } = await supabase
        .from('devoluciones_proveedor')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DevolucionProveedor[];
    },
    staleTime: 60_000,
  });

  const crearDevolucion = useMutation({
    mutationFn: async (input: NuevaDevolucionInput): Promise<DevolucionProveedor> => {
      const { data, error } = await supabase
        .from('devoluciones_proveedor')
        .insert([{ numero_rma: input.numero_rma, proveedor_id: input.proveedor_id, notas: input.notas }])
        .select('*')
        .single();
      if (error) throw error;
      return data as DevolucionProveedor;
    },
    onSuccess: () => {
      toast.success('Devolución creada');
      qc.invalidateQueries({ queryKey: ['devoluciones-proveedor'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Error al crear devolución'),
  });

  const agregarDetalle = useMutation({
    mutationFn: async (input: NuevoDetalleDevolucionInput): Promise<DetalleDevolucionProveedor> => {
      const { data, error } = await supabase
        .from('devoluciones_proveedor_detalle')
        .insert([{ 
          devolucion_id: input.devolucion_id,
          producto_id: input.producto_id,
          cantidad: input.cantidad,
          motivo: input.motivo,
          seriales: input.seriales || [],
          costo_unitario: input.costo_unitario ?? 0,
          subtotal: (input.costo_unitario ?? 0) * input.cantidad,
        }])
        .select('*')
        .single();
      if (error) throw error;
      return data as DetalleDevolucionProveedor;
    },
    onSuccess: () => {
      toast.success('Detalle agregado');
      qc.invalidateQueries({ queryKey: ['devoluciones-proveedor'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Error al agregar detalle'),
  });

  return {
    devoluciones: devolucionesQuery.data,
    isLoading: devolucionesQuery.isLoading,
    error: devolucionesQuery.error,
    refetch: devolucionesQuery.refetch,
    crearDevolucion,
    agregarDetalle,
  };
};
