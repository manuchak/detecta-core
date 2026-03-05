import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

export interface StaleService {
  id: string;
  id_servicio: string;
  nombre_cliente: string | null;
  custodio_asignado: string | null;
  hora_inicio_real: string;
  ultima_actividad: string;
}

const BATCH_SIZE = 100;

export function useStaleServiceCleanup() {
  const queryClient = useQueryClient();
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState({ closed: 0, total: 0 });

  const staleQuery = useQuery({
    queryKey: ['stale-services'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('detectar_servicios_estancados');
      if (error) throw error;
      return (data || []) as StaleService[];
    },
  });

  const closeAll = useCallback(async () => {
    const total = staleQuery.data?.length || 0;
    if (total === 0) return;

    setIsClosing(true);
    setProgress({ closed: 0, total });
    let totalClosed = 0;

    try {
      while (true) {
        const { data, error } = await (supabase as any).rpc('cerrar_servicios_estancados', { p_limit: BATCH_SIZE });
        if (error) throw error;

        const batchClosed = data?.cerrados ?? 0;
        if (batchClosed === 0) break;

        totalClosed += batchClosed;
        setProgress({ closed: totalClosed, total });
        toast.info(`Cerrados ${totalClosed} de ${total}...`);
      }

      toast.success(`Se cerraron ${totalClosed} servicios estancados`);
      queryClient.invalidateQueries({ queryKey: ['stale-services'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-board-active'] });
    } catch (error: any) {
      toast.error('Error al cerrar servicios: ' + error.message);
    } finally {
      setIsClosing(false);
      setProgress({ closed: 0, total: 0 });
    }
  }, [staleQuery.data, queryClient]);

  return {
    staleServices: staleQuery.data || [],
    isLoading: staleQuery.isLoading,
    error: staleQuery.error,
    refetch: staleQuery.refetch,
    closeAll,
    isClosing,
    progress,
  };
}
