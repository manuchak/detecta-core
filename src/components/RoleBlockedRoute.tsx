import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FIELD_OPERATOR_ROLES, PORTAL_REDIRECTS } from '@/constants/accessControl';
import { supabase } from '@/integrations/supabase/client';

interface RoleBlockedRouteProps {
  children: ReactNode;
  blockedRoles?: readonly string[];
  redirectMap?: Record<string, string>;
}

/**
 * Security wrapper that blocks specific roles from accessing admin routes.
 * Field operators (custodio, instalador) are redirected to their dedicated portals.
 * 
 * This prevents manual URL navigation to sensitive modules.
 */
const RoleBlockedRoute = ({ 
  children, 
  blockedRoles = FIELD_OPERATOR_ROLES,
  redirectMap = PORTAL_REDIRECTS 
}: RoleBlockedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();
  const [shouldLog, setShouldLog] = useState(false);

  // Log unauthorized access attempts for security audit
  useEffect(() => {
    if (shouldLog && user && userRole && blockedRoles.includes(userRole)) {
      const logAttempt = async () => {
        try {
          await supabase.from('user_role_audit').insert({
            user_id: user.id,
            action: 'blocked_route_access_attempt',
            old_role: userRole,
            new_role: userRole,
            changed_by: user.id,
            reason: `Attempted to access ${location.pathname}`
          });
        } catch (error) {
          console.error('Failed to log security event:', error);
        }
      };
      logAttempt();
    }
  }, [shouldLog, user, userRole, location.pathname, blockedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, let ProtectedRoute handle it
  if (!user) {
    return <>{children}</>;
  }

  // Check if user role is in the blocked list
  if (userRole && blockedRoles.includes(userRole)) {
    // Set flag to log the attempt (in useEffect to avoid state update during render)
    if (!shouldLog) {
      setShouldLog(true);
    }

    // Get redirect path for this role
    const redirectPath = redirectMap[userRole] || '/';
    
    return <Navigate to={redirectPath} replace state={{ blockedFrom: location.pathname }} />;
  }

  return <>{children}</>;
};

export default RoleBlockedRoute;
