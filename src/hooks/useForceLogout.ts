import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getLockedServices } from '@/lib/handoffLock';

interface ForceLogoutParams {
  monitoristaId: string;
  monitoristaName: string;
}

interface ForceLogoutResponse {
  ok: boolean;
  services_released: number;
  warnings?: string[];
  error?: string;
}

export function useForceLogout() {
  const queryClient = useQueryClient();

  const forceLogout = useMutation({
    mutationFn: async ({ monitoristaId }: ForceLogoutParams) => {
      // Pre-flight: Check if any services are locked by an active handoff
      const lockedServices = getLockedServices();
      if (lockedServices.size > 0) {
        throw new Error(
          'Hay una entrega de turno en progreso. Espere a que finalice antes de forzar cierre de sesión.'
        );
      }

      const { data, error } = await supabase.functions.invoke<ForceLogoutResponse>(
        'force-logout-monitorista',
        { body: { monitorista_id: monitoristaId } }
      );

      if (error) throw new Error(error.message || 'Error al forzar cierre de sesión');
      if (data?.error) throw new Error(data.error);
      if (!data?.ok) throw new Error('Respuesta inesperada del servidor');

      return data;
    },
    onSuccess: (data, variables) => {
      const warningText = data.warnings?.length
        ? ` (⚠️ ${data.warnings.length} advertencia(s))`
        : '';

      toast.success(
        `Sesión de ${variables.monitoristaName} cerrada. ${data.services_released} servicio(s) liberado(s) para reasignación.${warningText}`,
        { duration: 6000 }
      );

      if (data.warnings?.length) {
        console.warn('Force logout warnings:', data.warnings);
      }

      // Invalidate all monitoring-related queries so OrphanGuard picks up freed services
      queryClient.invalidateQueries({ queryKey: ['monitorista-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['paused-monitorista-ids'] });
      queryClient.invalidateQueries({ queryKey: ['monitoristas-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-anomalias'] });
      queryClient.invalidateQueries({ queryKey: ['monitorista-heartbeats'] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`, { duration: 5000 });
    },
  });

  return { forceLogout };
}
