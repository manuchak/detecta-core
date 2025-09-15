import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableAuth } from '@/hooks/useStableAuth';

interface SmartRedirectProps {
  children: React.ReactNode;
}

/**
 * Componente que implementa redirección inteligente basada en roles
 * Redirige automáticamente a usuarios con acceso limitado a sus módulos correspondientes
 */
const SmartRedirect = ({ children }: SmartRedirectProps) => {
  const { userRole, permissions, loading } = useStableAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // No hacer nada mientras carga
    if (loading || !userRole) return;

    // Obtener la ruta actual
    const currentPath = window.location.pathname;

    // Redirección inteligente para roles específicos
    switch (userRole) {
      case 'ejecutivo_ventas':
        // Si intenta acceder al dashboard, redirigir a leads
        if (currentPath === '/' || currentPath === '/dashboard') {
          navigate('/leads', { replace: true });
        }
        break;

      case 'supply_lead':
        // Si intenta acceder al dashboard principal, redirigir a leads
        if (currentPath === '/' || currentPath === '/dashboard') {
          navigate('/leads', { replace: true });
        }
        break;

      case 'supply':
        // Solo acceso a leads, sin edición
        if (currentPath === '/' || currentPath === '/dashboard') {
          navigate('/leads', { replace: true });
        }
        break;

      case 'custodio':
        // Redirigir a su portal específico
        if (currentPath === '/' || currentPath === '/dashboard') {
          navigate('/custodian-portal', { replace: true });
        }
        break;

      default:
        // Para admin, owner, supply_admin, etc. - sin redirección
        break;
    }
  }, [userRole, permissions, loading, navigate]);

  // Renderizar children normalmente
  return <>{children}</>;
};

export default SmartRedirect;