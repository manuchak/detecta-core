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
    // ✅ Paso 4: Leer parámetro de URL para forzar modo
    const searchParams = new URLSearchParams(location.search);
    const urlSandboxParam = searchParams.get('sandbox');
    
    if (urlSandboxParam !== null) {
      const forcedSandboxMode = urlSandboxParam === 'true';
      
      console.log('🔧 SandboxRouteGuard: Forzando modo desde URL', {
        urlParam: urlSandboxParam,
        forcedMode: forcedSandboxMode ? 'SANDBOX' : 'PRODUCCIÓN',
        currentMode: isSandboxMode ? 'SANDBOX' : 'PRODUCCIÓN'
      });
      
      if (forcedSandboxMode !== isSandboxMode) {
        toggleSandboxMode();
      }
      
      return;
    }
    
    // Activar sandbox automáticamente al entrar a rutas /sandbox-*
    const isSandboxRoute = location.pathname.startsWith('/sandbox-');
    if (isSandboxRoute && !isSandboxMode) {
      console.log('🧪 SandboxRouteGuard: Activando sandbox por ruta /sandbox-*');
      toggleSandboxMode();
    }
  }, [location.pathname, location.search, isSandboxMode, toggleSandboxMode]);

  return <>{children}</>;
};
