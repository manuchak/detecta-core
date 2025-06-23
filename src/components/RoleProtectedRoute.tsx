
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types/roleTypes';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Role[];
  fallbackPath?: string;
}

const RoleProtectedRoute = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/home' 
}: RoleProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole as Role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
