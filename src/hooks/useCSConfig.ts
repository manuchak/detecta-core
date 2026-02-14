import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ── Default configs (fallback when no DB row exists) ──────────────────────

export const DEFAULT_HEALTH_CONFIG = {
  penalizaciones: {
    quejas_2_mas: 30,
    quejas_1: 15,
    sin_contacto_60d: 25,
    sin_contacto_30d: 10,
    sin_servicios_90d: 20,
    csat_bajo_3: 15,
    csat_bajo_4: 5,
  },
  umbrales_churn: {
    alto: 40,
    medio: 70,
  },
};

export const DEFAULT_LOYALTY_CONFIG = {
  en_riesgo: {
    quejas_minimas: 2,
    dias_inactividad: 60,
    servicios_90d_minimo: 0,
  },
  embajador: {
    meses_minimos: 6,
    csat_minimo: 4.5,
    dias_contacto_maximo: 30,
  },
  promotor: {
    meses_minimos: 6,
    csat_minimo: 4.5,
    dias_contacto_maximo: 30,
  },
  leal: {
    meses_minimos: 6,
    dias_contacto_maximo: 30,
  },
  nuevo: {
    meses_maximo: 2,
  },
};

export type HealthConfig = typeof DEFAULT_HEALTH_CONFIG;
export type LoyaltyConfig = typeof DEFAULT_LOYALTY_CONFIG;

// ── Hook ──────────────────────────────────────────────────────────────────

export function useCSConfig<T>(categoria: 'health_score' | 'loyalty_funnel') {
  const defaults = categoria === 'health_score' ? DEFAULT_HEALTH_CONFIG : DEFAULT_LOYALTY_CONFIG;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cs-config', categoria],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cs_config' as any)
        .select('config')
        .eq('categoria', categoria)
        .maybeSingle();
      if (error) throw error;
      return (data?.config as T) ?? null;
    },
  });

  const mutation = useMutation({
    mutationFn: async (config: Record<string, any>) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { error } = await supabase
        .from('cs_config' as any)
        .upsert(
          { categoria, config, updated_by: userId } as any,
          { onConflict: 'categoria' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cs-config', categoria] });
      // Also invalidate dependent queries
      if (categoria === 'health_score') {
        queryClient.invalidateQueries({ queryKey: ['cs-health-scores'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['cs-loyalty-funnel'] });
      }
      toast({ title: 'Configuración guardada', description: 'Los cambios se aplicarán en el próximo cálculo.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    },
  });

  return {
    config: (query.data ?? defaults) as T,
    isLoading: query.isLoading,
    isCustom: query.data !== null && query.data !== undefined,
    save: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
