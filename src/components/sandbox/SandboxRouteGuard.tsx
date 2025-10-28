import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSandbox } from '@/contexts/SandboxContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SandboxRouteGuardProps {
  children: React.ReactNode;
}

export const SandboxRouteGuard: React.FC<SandboxRouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const { isSandboxMode, toggleSandboxMode } = useSandbox();
  const { userRole } = useAuth();
  const { toast } = useToast();
  
  // Validar si el usuario puede acceder a Sandbox
  const canAccessSandbox = () => {
    return userRole === 'admin' || userRole === 'owner';
  };

  useEffect(() => {
    // 🚫 CASO 1: Usuario sin permisos detectado en Sandbox → FORZAR salida
    if (isSandboxMode && !canAccessSandbox() && userRole) {
      console.warn('🚫 SandboxRouteGuard: Usuario sin permisos detectado en Sandbox. Forzando salida...', {
        userRole,
        isSandboxMode
      });
      toggleSandboxMode();
      toast({
        title: "Acceso Denegado",
        description: "No tienes permisos para usar el entorno Sandbox",
        variant: "destructive"
      });
      return;
    }
    
    // Leer parámetro de URL para forzar modo
    const searchParams = new URLSearchParams(location.search);
    const urlSandboxParam = searchParams.get('sandbox');
    
    // 🚫 CASO 2: Intentar activar vía URL sin permisos
    if (urlSandboxParam === 'true' && !canAccessSandbox() && userRole) {
      console.warn('🚫 SandboxRouteGuard: Intento de activar Sandbox sin permisos vía URL', {
        userRole,
        urlParam: urlSandboxParam
      });
      toast({
        title: "Acceso Denegado",
        description: "Solo administradores pueden acceder al entorno Sandbox",
        variant: "destructive"
      });
      return;
    }
    
    // ✅ CASO 3: Usuario CON permisos puede cambiar de modo vía URL
    if (urlSandboxParam !== null && canAccessSandbox()) {
      const forcedSandboxMode = urlSandboxParam === 'true';
      
      console.log('🔧 SandboxRouteGuard: Forzando modo desde URL', {
        urlParam: urlSandboxParam,
        forcedMode: forcedSandboxMode ? 'SANDBOX' : 'PRODUCCIÓN',
        currentMode: isSandboxMode ? 'SANDBOX' : 'PRODUCCIÓN',
        userRole
      });
      
      if (forcedSandboxMode !== isSandboxMode) {
        toggleSandboxMode();
      }
      
      return;
    }
    
    // 🚫 CASO 4: Intentar activar vía ruta /sandbox-* sin permisos
    const isSandboxRoute = location.pathname.startsWith('/sandbox-');
    if (isSandboxRoute && !canAccessSandbox() && userRole) {
      console.warn('🚫 SandboxRouteGuard: Intento de activar Sandbox sin permisos vía ruta', {
        userRole,
        pathname: location.pathname
      });
      toast({
        title: "Acceso Denegado",
        description: "Solo administradores pueden acceder al entorno Sandbox",
        variant: "destructive"
      });
      return;
    }
    
    // ✅ CASO 5: Usuario CON permisos en ruta /sandbox-*
    if (isSandboxRoute && !isSandboxMode && canAccessSandbox()) {
      console.log('🧪 SandboxRouteGuard: Activando sandbox por ruta /sandbox-*', {
        userRole,
        pathname: location.pathname
      });
      toggleSandboxMode();
    }
  }, [location.pathname, location.search, isSandboxMode, toggleSandboxMode, userRole]);

  return <>{children}</>;
};
