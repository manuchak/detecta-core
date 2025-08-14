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

  // If a required role is specified and user doesn't have it, return null
  // Use database-driven permission checks only, no hardcoded bypasses
  if (requiredRole && userRole !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};

export default SecurityWrapper;