import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClienteGadget {
  id: string;
  cliente_id: string;
  tipo: string;
  precio: number;
  incluido_en_tarifa: boolean;
  facturacion: string;
  notas: string | null;
  activo: boolean;
  created_at: string;
}

export const GADGET_TIPOS = [
  { value: 'gps', label: 'GPS' },
  { value: 'candado_rhino', label: 'Candado Rhino' },
  { value: 'candado_sintel', label: 'Candado Sintel' },
  { value: 'candado_kraken', label: 'Candado Kraken' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'otro', label: 'Otro' },
];

export function useClientesGadgets(clienteId?: string) {
  return useQuery({
    queryKey: ['clientes-gadgets', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const { data, error } = await supabase
        .from('pc_clientes_gadgets')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('activo', true)
        .order('created_at');
      if (error) throw error;
      return (data || []) as ClienteGadget[];
    },
    enabled: !!clienteId,
  });
}

export function useUpsertGadget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ClienteGadget, 'id' | 'created_at' | 'activo'> & { id?: string }) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from('pc_clientes_gadgets').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pc_clientes_gadgets').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes-gadgets'] });
      toast.success('Gadget guardado');
    },
    onError: () => toast.error('Error al guardar gadget'),
  });
}

export function useDeleteGadget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pc_clientes_gadgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes-gadgets'] });
      toast.success('Gadget eliminado');
    },
    onError: () => toast.error('Error al eliminar gadget'),
  });
}
