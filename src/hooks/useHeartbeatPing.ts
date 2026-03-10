import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Global heartbeat ping — mount at page level so it runs regardless of active tab.
 * Upserts monitorista_heartbeat every 2 min.
 */
export function useHeartbeatPing() {
  const { data: userId } = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!userId) return;

    const ping = () => {
      (supabase as any)
        .from('monitorista_heartbeat')
        .upsert({ user_id: userId, last_ping: new Date().toISOString() }, { onConflict: 'user_id' })
        .then(({ error }: any) => {
          if (error) console.warn('Heartbeat ping failed:', error.message);
        });
    };

    ping(); // immediate
    const interval = setInterval(ping, 120_000); // every 2 min
    return () => clearInterval(interval);
  }, [userId]);
}
