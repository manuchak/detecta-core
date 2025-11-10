
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredPermission?: 'canViewLeads' | 'canEditLeads' | 'canManageUsers' | 'canViewDashboard';
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

const RoleProtectedRoute = ({ 
  children, 
  allowedRoles,
  requiredPermission,
  fallbackPath = '/home',
  showAccessDenied = true
}: RoleProtectedRouteProps) => {
  const { user, userRole, loading, hasRole, hasPermission } = useAuth();

  // Mostrar loading de manera consistente
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Verificando permisos...</h2>
              <p className="text-muted-foreground">
                Validando acceso y roles de usuario...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect a login si no está autenticado
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Verificar acceso por roles
  if (allowedRoles && (!userRole || !hasRole(allowedRoles))) {
    // Log detallado para debugging
    console.warn('🚫 RoleProtectedRoute: Access denied', {
      user: user?.email,
      userRole,
      allowedRoles,
      hasRole: hasRole(allowedRoles),
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    });
    
    if (showAccessDenied) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
                <p className="text-muted-foreground mb-4">
                  No tienes permisos para acceder a esta sección.
                </p>
                <div className="space-y-2 text-sm bg-muted p-3 rounded-md">
                  <p>
                    <span className="font-medium">Usuario:</span> {user?.email || 'No identificado'}
                  </p>
                  <p>
                    <span className="font-medium">Tu rol:</span> {userRole || 'No asignado'}
                  </p>
                  <p>
                    <span className="font-medium">Roles requeridos:</span> {allowedRoles.join(', ')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Si crees que esto es un error, contacta al administrador.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Verificar acceso por permisos específicos
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Log detallado para debugging
    console.warn('🚫 RoleProtectedRoute: Permission denied', {
      user: user?.email,
      userRole,
      requiredPermission,
      hasPermission: hasPermission(requiredPermission),
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    });
    
    if (showAccessDenied) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Permisos Insuficientes</h2>
                <p className="text-muted-foreground mb-4">
                  Tu rol actual no tiene los permisos necesarios para esta acción.
                </p>
                <div className="space-y-2 text-sm bg-muted p-3 rounded-md">
                  <p>
                    <span className="font-medium">Usuario:</span> {user?.email || 'No identificado'}
                  </p>
                  <p>
                    <span className="font-medium">Tu rol:</span> {userRole || 'No asignado'}
                  </p>
                  <p>
                    <span className="font-medium">Permiso requerido:</span> {requiredPermission}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Si crees que esto es un error, contacta al administrador.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
