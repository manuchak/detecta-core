import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Bell, AlertTriangle, XCircle } from 'lucide-react';
import React from 'react';

interface AlertPayload {
  id: string;
  tipo_alerta: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: number;
  datos_contexto: {
    action_url?: string;
    nombre?: string;
    custodio_id?: string;
    [key: string]: unknown;
  } | null;
  created_at: string;
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleNewAlert = useCallback((payload: { new: AlertPayload }) => {
    const alert = payload.new;
    
    console.log('[Realtime] Nueva alerta recibida:', alert);

    // Invalidar query de notificaciones para actualizar badge
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

    // Determinar icono y estilo según categoría/tipo
    let icon = React.createElement(Bell, { className: 'h-5 w-5' });
    let toastType: 'success' | 'info' | 'warning' | 'error' = 'info';
    
    if (alert.categoria === 'liberacion') {
      icon = React.createElement(CheckCircle, { className: 'h-5 w-5 text-emerald-500' });
      toastType = 'success';
    } else if (alert.tipo_alerta === 'critica') {
      icon = React.createElement(XCircle, { className: 'h-5 w-5 text-destructive' });
      toastType = 'error';
    } else if (alert.tipo_alerta === 'advertencia') {
      icon = React.createElement(AlertTriangle, { className: 'h-5 w-5 text-warning' });
      toastType = 'warning';
    }

    // Obtener nombre del custodio si está disponible
    const custodioNombre = alert.datos_contexto?.nombre;
    const description = custodioNombre 
      ? `${custodioNombre} está disponible para asignación`
      : alert.descripcion;

    // Mostrar toast con acción de navegación
    const actionUrl = alert.datos_contexto?.action_url;

    toast[toastType](alert.titulo, {
      description,
      icon,
      duration: 8000,
      action: actionUrl ? {
        label: 'Ver detalles',
        onClick: () => navigate(actionUrl)
      } : undefined,
    });
  }, [queryClient, navigate]);

  useEffect(() => {
    if (!user) return;

    console.log('[Realtime] Suscribiendo a alertas_sistema_nacional...');

    // Suscribirse a nuevas alertas
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alertas_sistema_nacional',
        },
        handleNewAlert
      )
      .subscribe((status) => {
        console.log('[Realtime] Estado de suscripción:', status);
      });

    return () => {
      console.log('[Realtime] Desuscribiendo de alertas...');
      supabase.removeChannel(channel);
    };
  }, [user, handleNewAlert]);
}
