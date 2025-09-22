import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AssignmentAuditLog {
  id: string;
  assignment_id?: string;
  service_id?: string;
  custodio_id?: string;
  armado_id?: string;
  proveedor_id?: string;
  action_type: 'created' | 'updated' | 'cancelled' | 'confirmed' | 'rejected';
  performed_by: string;
  previous_data?: any;
  new_data?: any;
  changes_summary?: string;
  created_at: string;
  performer_name?: string;
}

export interface PerformanceMetrics {
  user_id: string;
  user_name: string;
  total_assignments: number;
  assignments_today: number;
  avg_time_to_assign: number;
  success_rate: number;
  most_recent_assignment: string;
}

export function useAssignmentAudit() {
  const [auditLogs, setAuditLogs] = useState<AssignmentAuditLog[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logAssignmentAction = async (
    assignmentData: {
      assignment_id?: string;
      service_id?: string;
      custodio_id?: string;
      armado_id?: string;
      proveedor_id?: string;
      action_type: 'created' | 'updated' | 'cancelled' | 'confirmed' | 'rejected';
      previous_data?: any;
      new_data?: any;
      changes_summary?: string;
    }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('assignment_audit_log')
        .insert({
          ...assignmentData,
          performed_by: user.id,
          ip_address: null, // Could be populated from request if needed
          user_agent: navigator.userAgent
        });

      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error('Error logging assignment action:', err);
      toast.error('Error al registrar la acción');
      return false;
    }
  };

  const loadAuditLogs = async (limit: number = 50) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('assignment_audit_log')
        .select(`
          *,
          performer:profiles!performed_by(display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const logsWithNames = data?.map(log => ({
        ...log,
        performer_name: log.performer?.display_name || 'Usuario desconocido'
      })) || [];

      setAuditLogs(logsWithNames);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError('Error al cargar el historial de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceMetrics = async () => {
    setLoading(true);
    
    try {
      // Get performance metrics from audit logs
      const { data, error } = await supabase
        .from('assignment_audit_log')
        .select(`
          performed_by,
          action_type,
          created_at,
          performer:profiles!performed_by(display_name)
        `)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Process metrics
      const userMetrics = new Map<string, {
        user_id: string;
        user_name: string;
        total_assignments: number;
        assignments_today: number;
        avg_time_to_assign: number;
        success_rate: number;
        most_recent_assignment: string;
      }>();

      const today = new Date().toDateString();

      data?.forEach(log => {
        const userId = log.performed_by;
        const performer = Array.isArray(log.performer) ? log.performer[0] : log.performer;
        const userName = performer?.display_name || 'Usuario desconocido';
        
        if (!userMetrics.has(userId)) {
          userMetrics.set(userId, {
            user_id: userId,
            user_name: userName,
            total_assignments: 0,
            assignments_today: 0,
            avg_time_to_assign: 0,
            success_rate: 0,
            most_recent_assignment: log.created_at
          });
        }

        const metrics = userMetrics.get(userId)!;

        if (log.action_type === 'created') {
          metrics.total_assignments++;
          
          if (new Date(log.created_at).toDateString() === today) {
            metrics.assignments_today++;
          }
        }

        if (new Date(log.created_at) > new Date(metrics.most_recent_assignment)) {
          metrics.most_recent_assignment = log.created_at;
        }
      });

      // Calculate success rates (placeholder logic)
      userMetrics.forEach(metrics => {
        metrics.success_rate = Math.min(95, 80 + Math.random() * 15); // Placeholder
        metrics.avg_time_to_assign = Math.floor(15 + Math.random() * 30); // Placeholder in minutes
      });

      setPerformanceMetrics(Array.from(userMetrics.values()));
    } catch (err) {
      console.error('Error loading performance metrics:', err);
      setError('Error al cargar métricas de rendimiento');
    } finally {
      setLoading(false);
    }
  };

  return {
    auditLogs,
    performanceMetrics,
    loading,
    error,
    logAssignmentAction,
    loadAuditLogs,
    loadPerformanceMetrics
  };
}