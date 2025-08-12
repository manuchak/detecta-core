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
      const { data, error } = await supabase
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
      return data as DesechoInventario;
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
