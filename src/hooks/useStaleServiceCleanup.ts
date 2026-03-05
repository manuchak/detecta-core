import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StaleService {
  id: string;
  id_servicio: string;
  nombre_cliente: string | null;
  custodio_asignado: string | null;
  hora_inicio_real: string;
  ultima_actividad: string;
}

export function useStaleServiceCleanup() {
  const queryClient = useQueryClient();

  const staleQuery = useQuery({
    queryKey: ['stale-services'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('detectar_servicios_estancados');
      if (error) throw error;
      return (data || []) as StaleService[];
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc('cerrar_servicios_estancados');
      if (error) throw error;
      return data as { cerrados: number; timestamp: string };
    },
    onSuccess: (data) => {
      toast.success(`Se cerraron ${data.cerrados} servicios estancados`);
      queryClient.invalidateQueries({ queryKey: ['stale-services'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-board-active'] });
    },
    onError: (error: any) => {
      toast.error('Error al cerrar servicios: ' + error.message);
    },
  });

  return {
    staleServices: staleQuery.data || [],
    isLoading: staleQuery.isLoading,
    error: staleQuery.error,
    refetch: staleQuery.refetch,
    closeAll: cleanupMutation.mutate,
    isClosing: cleanupMutation.isPending,
  };
}
