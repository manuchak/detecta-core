import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSandbox } from '@/contexts/SandboxContext';

interface SandboxRouteGuardProps {
  children: React.ReactNode;
}

export const SandboxRouteGuard: React.FC<SandboxRouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const { isSandboxMode, toggleSandboxMode } = useSandbox();

  useEffect(() => {
    const isSandboxRoute = location.pathname.startsWith('/sandbox-');
    
    // Activar sandbox automáticamente al entrar a rutas /sandbox-*
    if (isSandboxRoute && !isSandboxMode) {
      toggleSandboxMode();
    }
  }, [location.pathname, isSandboxMode, toggleSandboxMode]);

  return <>{children}</>;
};
