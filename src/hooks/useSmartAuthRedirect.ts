import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook que maneja la redirección inteligente basada en el rol del usuario
 * después de iniciar sesión exitosamente.
 */
export const useSmartAuthRedirect = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // No hacer nada mientras carga
    if (loading) return;
    
    // Solo actuar si hay usuario autenticado
    if (!user) return;

    // Solo redirigir si estamos en páginas de auth
    const isAuthPage = location.pathname.startsWith('/auth/');
    const isLoginPage = location.pathname === '/auth/login';
    
    // Esperar a que el rol esté resuelto (puede ser 'unverified' o un rol válido)
    if (userRole === null) return;

    // Si el usuario no tiene rol asignado, redirigir a pending-activation
    if (userRole === 'unverified' && !location.pathname.includes('pending-activation')) {
      navigate('/auth/pending-activation', { replace: true });
      return;
    }

    // Si tiene rol válido y está en página de login, redirigir según rol
    if (userRole !== 'unverified' && isLoginPage) {
      const targetRoute = getTargetRouteForRole(userRole);
      navigate(targetRoute, { replace: true });
    }
  }, [user, userRole, loading, navigate, location.pathname]);
};

/**
 * Determina la ruta de destino basada en el rol del usuario
 */
function getTargetRouteForRole(role: string): string {
  switch (role) {
    case 'custodio':
      return '/custodian';
    case 'instalador':
      return '/installers/portal';
    case 'planificador':
      return '/planeacion';
    case 'ejecutivo_ventas':
    case 'supply_lead':
    case 'supply':
      return '/leads';
    case 'admin':
    case 'owner':
    case 'supply_admin':
    case 'coordinador_operaciones':
    case 'bi':
      return '/home';
    default:
      return '/home';
  }
}

export default useSmartAuthRedirect;
