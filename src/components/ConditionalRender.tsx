import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface ConditionalRenderProps {
  children: ReactNode;
  permissionType: 'page' | 'feature' | 'action' | 'module';
  permissionId: string;
  fallback?: ReactNode;
}

/**
 * Componente para renderizar condicionalmente contenido basado en permisos
 */
const ConditionalRender = ({ 
  children, 
  permissionType,
  permissionId,
  fallback = null
}: ConditionalRenderProps) => {
  const { hasPermission } = usePermissions();

  const hasAccess = hasPermission(permissionType, permissionId);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ConditionalRender;