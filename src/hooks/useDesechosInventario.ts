import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DesechoInventario } from '@/types/wms';

export interface NuevoDesechoInput {
  producto_id: string;
  cantidad: number;
  motivo?: string;
  seriales?: string[];
  costo_unitario?: number;
}

export const useDesechosInventario = () => {
  const qc = useQueryClient();

  const desechosQuery = useQuery({
    queryKey: ['desechos-inventario'],
    queryFn: async (): Promise<DesechoInventario[]> => {
      const { data, error } = await supabase
        .from('desechos_inventario')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DesechoInventario[];
    },
    staleTime: 60_000,
  });

  const crearDesecho = useMutation({
    mutationFn: async (input: NuevoDesechoInput): Promise<DesechoInventario> => {
      // 1) Crear registro de desecho
      const { data: desecho, error } = await supabase
        .from('desechos_inventario')
        .insert([{ 
          producto_id: input.producto_id,
          cantidad: input.cantidad,
          motivo: input.motivo,
          seriales: input.seriales || [],
          costo_unitario: input.costo_unitario ?? 0,
          valor_total: (input.costo_unitario ?? 0) * input.cantidad,
        }])
        .select('*')
        .single();
      if (error) throw error;

      // 2) Obtener stock actual para calcular movimiento y nueva cantidad
      const { data: stockRow, error: stockError } = await supabase
        .from('stock_productos')
        .select('cantidad_disponible')
        .eq('producto_id', input.producto_id)
        .maybeSingle();
      if (stockError) throw stockError;
      const cantidadAnterior = stockRow?.cantidad_disponible ?? 0;
      const cantidadNueva = Math.max(0, cantidadAnterior - input.cantidad);

      // 3) Registrar movimiento que actualizará stock vía trigger
      const { data: { user } } = await supabase.auth.getUser();
      const { error: movError } = await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: input.producto_id,
          tipo_movimiento: 'desecho',
          cantidad: input.cantidad,
          cantidad_anterior: cantidadAnterior,
          cantidad_nueva: cantidadNueva,
          motivo: input.motivo || 'Baja por desecho',
          referencia_tipo: 'desechos_inventario',
          referencia_id: desecho.id,
          usuario_id: user?.id || null,
          fecha_movimiento: new Date().toISOString(),
          costo_unitario: input.costo_unitario ?? 0,
          valor_total: (input.costo_unitario ?? 0) * input.cantidad,
        });
      if (movError) throw movError;

      return desecho as DesechoInventario;
    },
    onSuccess: () => {
      toast.success('Desecho registrado');
      qc.invalidateQueries({ queryKey: ['desechos-inventario'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Error al registrar desecho'),
  });

  return {
    desechos: desechosQuery.data,
    isLoading: desechosQuery.isLoading,
    error: desechosQuery.error,
    refetch: desechosQuery.refetch,
    crearDesecho,
  };
};
