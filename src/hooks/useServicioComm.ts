import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ───────── Types ───────── */

export interface CommMessage {
  id: string;
  chat_id: string;
  message_text: string | null;
  media_url: string | null;
  message_type: string | null;
  is_from_bot: boolean;
  delivery_status: string | null;
  created_at: string;
  servicio_id: string | null;
  is_read: boolean;
  sender_name?: string;
}

export interface CommMedia {
  id: string;
  servicio_id: string;
  storage_path: string;
  media_type: string;
  validado: boolean;
  validado_por: string | null;
  enviado_a_cliente: boolean;
  created_at: string;
}

/* ───────── Hook ───────── */

export function useServicioComm(servicioId: string | null) {
  const queryClient = useQueryClient();

  // Fetch messages for this service
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['servicio-comm', servicioId],
    queryFn: async () => {
      if (!servicioId) return [];
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('id, chat_id, content, media_url, media_type, is_from_bot, delivery_status, created_at, servicio_id, is_read')
        .eq('servicio_id', servicioId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CommMessage[];
    },
    enabled: !!servicioId,
    refetchInterval: 30000,
  });

  // Fetch media for this service
  const { data: media = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['servicio-comm-media', servicioId],
    queryFn: async () => {
      if (!servicioId) return [];
      const { data, error } = await supabase
        .from('servicio_comm_media')
        .select('*')
        .eq('servicio_id', servicioId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CommMedia[];
    },
    enabled: !!servicioId,
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!servicioId) return;

    const channel = supabase
      .channel(`comm-${servicioId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `servicio_id=eq.${servicioId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['servicio-comm', servicioId] });
          queryClient.invalidateQueries({ queryKey: ['servicio-comm-unread'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [servicioId, queryClient]);

  // Mark messages as read
  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!servicioId) return;
      const { error } = await supabase
        .from('whatsapp_messages')
        .update({ is_read: true } as any)
        .eq('servicio_id', servicioId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicio-comm', servicioId] });
      queryClient.invalidateQueries({ queryKey: ['servicio-comm-unread'] });
    },
  });

  // Validate media
  const validateMedia = useMutation({
    mutationFn: async (mediaId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('servicio_comm_media')
        .update({ validado: true, validado_por: user?.id, validado_at: new Date().toISOString() })
        .eq('id', mediaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicio-comm-media', servicioId] });
      toast.success('Media validado');
    },
  });

  const unreadCount = useMemo(
    () => messages.filter(m => !m.is_read && !m.is_from_bot).length,
    [messages]
  );

  return {
    messages,
    media,
    messagesLoading,
    mediaLoading,
    unreadCount,
    markAsRead: markAsRead.mutate,
    validateMedia: validateMedia.mutate,
  };
}

/* ───────── Unread counts for all services (badge on cards) ───────── */

export function useUnreadCounts() {
  const { data: unreadMap = new Map<string, number>() } = useQuery({
    queryKey: ['servicio-comm-unread'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('servicio_id')
        .eq('is_read', false)
        .eq('is_from_bot', false)
        .not('servicio_id', 'is', null);
      if (error) throw error;
      const map = new Map<string, number>();
      (data || []).forEach((row: any) => {
        const sid = row.servicio_id as string;
        map.set(sid, (map.get(sid) || 0) + 1);
      });
      return map;
    },
    refetchInterval: 30000,
  });

  return unreadMap;
}
