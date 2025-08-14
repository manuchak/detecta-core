import React, { useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';

interface SecurityWrapperProps {
  children: ReactNode;
  requiredRole?: string;
  sensitiveData?: boolean;
  auditTrail?: boolean;
}

/**
 * Security wrapper component that provides audit logging and access control
 */
export const SecurityWrapper: React.FC<SecurityWrapperProps> = ({
  children,
  requiredRole,
  sensitiveData = false,
  auditTrail = false
}) => {
  const { user, userRole } = useAuth();
  const { logSecurityEvent } = useSecurityAudit();

  useEffect(() => {
    if (auditTrail && user) {
      logSecurityEvent('permission_access', {
        required_role: requiredRole,
        user_role: userRole,
        sensitive_data: sensitiveData,
        timestamp: new Date().toISOString()
      });
    }
  }, [auditTrail, user, requiredRole, userRole, sensitiveData, logSecurityEvent]);

  // Enhanced security: Use database-driven permission checks only
  // No hardcoded bypasses - all access control via RLS policies
  if (requiredRole && userRole !== requiredRole) {
    // Log unauthorized access attempt for security audit
    if (auditTrail) {
      logSecurityEvent('permission_access', {
        required_role: requiredRole,
        user_role: userRole,
        sensitive_data: sensitiveData,
        timestamp: new Date().toISOString()
      });
    }
    return null;
  }

  return <>{children}</>;
};

export default SecurityWrapper;