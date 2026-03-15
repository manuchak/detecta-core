import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ForceLogoutParams {
  monitoristaId: string;
  monitoristaName: string;
}

export function useForceLogout() {
  const queryClient = useQueryClient();

  const forceLogout = useMutation({
    mutationFn: async ({ monitoristaId }: ForceLogoutParams) => {
      const { data, error } = await supabase.functions.invoke('force-logout-monitorista', {
        body: { monitorista_id: monitoristaId },
      });

      if (error) throw new Error(error.message || 'Error al forzar cierre de sesión');
      if (data?.error) throw new Error(data.error);

      return data as { ok: boolean; services_released: number };
    },
    onSuccess: (data, variables) => {
      toast.success(
        `Sesión de ${variables.monitoristaName} cerrada. ${data.services_released} servicio(s) liberado(s) para reasignación.`,
        { duration: 6000 }
      );

      // Invalidate all monitoring-related queries so OrphanGuard picks up freed services
      queryClient.invalidateQueries({ queryKey: ['monitorista-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['paused-monitorista-ids'] });
      queryClient.invalidateQueries({ queryKey: ['monitoristas-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-anomalias'] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`, { duration: 5000 });
    },
  });

  return { forceLogout };
}
