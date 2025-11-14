import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LeadAuditLog {
  id: string;
  lead_id: string;
  action_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
  performed_by_name: string | null;
  performed_by_role: string | null;
  ip_address: string | null;
  user_agent: string | null;
  additional_data: Record<string, any> | null;
  created_at: string;
}

export const useLeadAudit = () => {
  const [auditLogs, setAuditLogs] = useState<LeadAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const logAction = useCallback(async (
    leadId: string,
    actionType: string,
    fieldName?: string,
    oldValue?: string,
    newValue?: string,
    additionalData?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase.rpc('log_lead_action', {
        p_lead_id: leadId,
        p_action_type: actionType,
        p_field_name: fieldName || null,
        p_old_value: oldValue || null,
        p_new_value: newValue || null,
        p_additional_data: additionalData ? JSON.parse(JSON.stringify(additionalData)) : null
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  }, []);

  const fetchAuditLogs = useCallback(async (leadId: string, limit: number = 50) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('lead_audit_log')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros de auditoría",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    auditLogs,
    loading,
    logAction,
    fetchAuditLogs
  };
};
