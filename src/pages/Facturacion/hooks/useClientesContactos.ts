import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClienteContacto {
  id: string;
  cliente_id: string;
  nombre: string | null;
  email: string;
  telefono: string | null;
  rol: string;
  principal: boolean;
  activo: boolean;
  created_at: string;
}

export function useClientesContactos(clienteId?: string) {
  return useQuery({
    queryKey: ['clientes-contactos', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const { data, error } = await supabase
        .from('pc_clientes_contactos')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('activo', true)
        .order('principal', { ascending: false });
      if (error) throw error;
      return (data || []) as ClienteContacto[];
    },
    enabled: !!clienteId,
  });
}

export function useUpsertContacto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ClienteContacto, 'id' | 'created_at' | 'activo'> & { id?: string }) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from('pc_clientes_contactos').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pc_clientes_contactos').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes-contactos'] });
      toast.success('Contacto guardado');
    },
    onError: () => toast.error('Error al guardar contacto'),
  });
}

export function useDeleteContacto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pc_clientes_contactos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes-contactos'] });
      toast.success('Contacto eliminado');
    },
    onError: () => toast.error('Error al eliminar contacto'),
  });
}
