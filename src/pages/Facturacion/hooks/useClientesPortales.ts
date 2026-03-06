import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientePortal {
  id: string;
  cliente_id: string;
  nombre_portal: string;
  url_portal: string | null;
  usuario_portal: string | null;
  password_portal: string | null;
  tipo_portal: string;
  instrucciones: string | null;
  activo: boolean;
  created_at: string;
}

export const TIPOS_PORTAL = [
  { value: 'facturacion', label: 'Facturación' },
  { value: 'cobranza', label: 'Cobranza' },
  { value: 'operativo', label: 'Operativo' },
  { value: 'otro', label: 'Otro' },
];

export function useClientesPortales(clienteId: string) {
  return useQuery({
    queryKey: ['pc_clientes_portales', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pc_clientes_portales' as any)
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ClientePortal[];
    },
    enabled: !!clienteId,
  });
}

export function useUpsertPortal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (portal: Partial<ClientePortal> & { cliente_id: string }) => {
      const { data, error } = await supabase
        .from('pc_clientes_portales' as any)
        .upsert(portal as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['pc_clientes_portales', vars.cliente_id] });
      toast.success('Portal guardado');
    },
    onError: () => toast.error('Error al guardar portal'),
  });
}

export function useDeletePortal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clienteId }: { id: string; clienteId: string }) => {
      const { error } = await supabase
        .from('pc_clientes_portales' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return clienteId;
    },
    onSuccess: (clienteId) => {
      qc.invalidateQueries({ queryKey: ['pc_clientes_portales', clienteId] });
      toast.success('Portal eliminado');
    },
    onError: () => toast.error('Error al eliminar portal'),
  });
}
