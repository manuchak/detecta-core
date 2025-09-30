import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RouteAuditLog {
  id: string;
  route_id: string | null;
  action_type: 'created' | 'updated' | 'deleted';
  performed_by: string;
  previous_data: any;
  new_data: any;
  justification: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function useRouteAudit() {
  const [logging, setLogging] = useState(false);

  const checkDailyLimit = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase.rpc('check_route_creation_limit', {
        p_user_id: user.id
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error checking daily limit:', err);
      return false;
    }
  };

  const logRouteAction = async (
    actionData: {
      route_id?: string;
      action_type: 'created' | 'updated' | 'deleted';
      previous_data?: any;
      new_data: any;
      justification: string;
    }
  ): Promise<boolean> => {
    try {
      setLogging(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('audit_matriz_precios')
        .insert({
          route_id: actionData.route_id || null,
          action_type: actionData.action_type,
          performed_by: user.id,
          previous_data: actionData.previous_data || null,
          new_data: actionData.new_data,
          justification: actionData.justification,
          ip_address: null,
          user_agent: navigator.userAgent
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error logging route action:', err);
      toast.error('Error al registrar auditoría de ruta');
      return false;
    } finally {
      setLogging(false);
    }
  };

  const loadAuditLogs = async (routeId?: string, limit: number = 50): Promise<RouteAuditLog[]> => {
    try {
      let query = supabase
        .from('audit_matriz_precios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (routeId) {
        query = query.eq('route_id', routeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading audit logs:', err);
      toast.error('Error al cargar historial de auditoría');
      return [];
    }
  };

  return {
    logging,
    logRouteAction,
    loadAuditLogs,
    checkDailyLimit
  };
}
