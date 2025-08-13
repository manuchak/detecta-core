import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for security audit logging and monitoring
 */
export const useSecurityAudit = () => {
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  const logSensitiveAccess = useCallback(async (
    tableName: string,
    operation: string,
    recordId?: string,
    additionalData?: Record<string, any>
  ) => {
    try {
      setIsLogging(true);
      
      const { error } = await supabase.rpc('log_sensitive_access', {
        table_name: tableName,
        operation,
        record_id: recordId || null,
        additional_data: additionalData || null
      });

      if (error) {
        console.error('Security audit logging failed:', error);
        toast({
          title: "Security Audit Warning",
          description: "Failed to log security audit trail",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Security audit error:', error);
    } finally {
      setIsLogging(false);
    }
  }, [toast]);

  const logSecurityEvent = useCallback(async (
    eventType: 'login' | 'logout' | 'role_change' | 'permission_access' | 'data_export',
    details?: Record<string, any>
  ) => {
    await logSensitiveAccess('security_events', eventType, undefined, {
      event_type: eventType,
      ...details
    });
  }, [logSensitiveAccess]);

  return {
    logSensitiveAccess,
    logSecurityEvent,
    isLogging
  };
};