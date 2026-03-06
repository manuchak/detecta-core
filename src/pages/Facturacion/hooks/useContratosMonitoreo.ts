import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContratoMonitoreo {
  id: string;
  cliente_id: string;
  numero_contrato: string;
  tipo_contrato: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  renovacion_automatica: boolean;
  estado: string;
  monto_mensual: number | null;
  moneda: string;
  condiciones_especiales: string | null;
  notas: string | null;
  created_at: string;
}

export function useContratosMonitoreo(clienteId: string) {
  return useQuery({
    queryKey: ['contratos_monitoreo', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_monitoreo' as any)
        .select('*')
        .eq('cliente_id', clienteId)
        .order('fecha_inicio', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ContratoMonitoreo[];
    },
    enabled: !!clienteId,
  });
}

export function useUpsertContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contrato: Partial<ContratoMonitoreo> & { cliente_id: string }) => {
      const { data, error } = await supabase
        .from('contratos_monitoreo' as any)
        .upsert(contrato as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['contratos_monitoreo', vars.cliente_id] });
      toast.success('Contrato guardado');
    },
    onError: () => toast.error('Error al guardar contrato'),
  });
}

export function useDeleteContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clienteId }: { id: string; clienteId: string }) => {
      const { error } = await supabase
        .from('contratos_monitoreo' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return clienteId;
    },
    onSuccess: (clienteId) => {
      qc.invalidateQueries({ queryKey: ['contratos_monitoreo', clienteId] });
      toast.success('Contrato eliminado');
    },
    onError: () => toast.error('Error al eliminar contrato'),
  });
}
