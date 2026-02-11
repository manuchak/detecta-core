import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTargetRouteForRole } from '@/constants/accessControl';

/**
 * Componente que decide qué mostrar en la ruta raíz:
 * - Si no está autenticado → /landing
 * - Si está autenticado → redirige según rol (sin renderizar Home)
 */
const SmartHomeRedirect = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  // Redirect directly based on role — no intermediate Home render
  const target = getTargetRouteForRole(userRole || 'admin');
  return <Navigate to={target} replace />;
};

export default SmartHomeRedirect;
