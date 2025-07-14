import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionProtectedRouteProps {
  children: ReactNode;
  permissionType: 'page' | 'feature' | 'action' | 'module';
  permissionId: string;
  fallbackPath?: string;
  showMessage?: boolean;
}

const PermissionProtectedRoute = ({ 
  children, 
  permissionType,
  permissionId,
  fallbackPath = '/home',
  showMessage = false
}: PermissionProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { hasPermission } = usePermissions();

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

  const hasAccess = hasPermission(permissionType, permissionId);

  if (!hasAccess) {
    if (showMessage) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acceso Denegado
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                No tienes permisos para acceder a esta sección. Contacta al administrador si necesitas acceso.
              </p>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default PermissionProtectedRoute;