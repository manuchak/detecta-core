import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
  action_url?: string;
}

interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
}

export function useNotifications() {
  const { user } = useAuth();

  return useQuery<NotificationsData>({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      // Try to fetch from alertas_sistema_nacional as notifications proxy
      const { data: alerts, error } = await supabase
        .from('alertas_sistema_nacional')
        .select('id, titulo, descripcion, tipo_alerta, estado, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching notifications:', error);
        return { notifications: [], unreadCount: 0 };
      }

      const notifications: Notification[] = (alerts || []).map(alert => ({
        id: alert.id,
        title: alert.titulo,
        message: alert.descripcion,
        type: alert.tipo_alerta === 'critica' ? 'error' : 
              alert.tipo_alerta === 'advertencia' ? 'warning' : 'info',
        read: alert.estado === 'resuelto',
        created_at: alert.created_at || new Date().toISOString(),
        action_url: '/monitoring'
      }));

      const unreadCount = notifications.filter(n => !n.read).length;

      return { notifications, unreadCount };
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}
