import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  updated_by: string | null;
  updated_at: string;
}

const QUERY_KEY = ['app-feature-flags', 'whatsapp'];

export function useWhatsAppMode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: flags = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_feature_flags')
        .select('*')
        .in('key', ['whatsapp_planeacion', 'whatsapp_monitoreo']);
      if (error) throw error;
      return (data || []) as FeatureFlag[];
    },
    staleTime: 30_000,
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('app_feature_flags_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_feature_flags' },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const toggleMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('app_feature_flags')
        .update({ enabled, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: (_, { key, enabled }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      const label = key === 'whatsapp_planeacion' ? 'WA Planeación' : 'WA Monitoreo';
      toast.success(`${label} ${enabled ? 'habilitado' : 'deshabilitado'}`);
    },
    onError: () => {
      toast.error('Error al actualizar flag');
    },
  });

  const getFlag = (key: string) => flags.find(f => f.key === key)?.enabled ?? false;

  return {
    isPlaneacionEnabled: getFlag('whatsapp_planeacion'),
    isMonitoreoEnabled: getFlag('whatsapp_monitoreo'),
    isLoading,
    togglePlaneacion: () =>
      toggleMutation.mutate({ key: 'whatsapp_planeacion', enabled: !getFlag('whatsapp_planeacion') }),
    toggleMonitoreo: () =>
      toggleMutation.mutate({ key: 'whatsapp_monitoreo', enabled: !getFlag('whatsapp_monitoreo') }),
    isToggling: toggleMutation.isPending,
  };
}
