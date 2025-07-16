import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/roleTypes';

/**
 * Hook para verificar acceso al módulo WMS
 * Roles autorizados: owner, admin, monitoring_supervisor, monitoring, coordinador_operaciones
 */
export const useWMSAccess = () => {
  const { userRole } = useAuth();

  const wmsAuthorizedRoles: Role[] = [
    'owner',
    'admin', 
    'monitoring_supervisor',
    'monitoring',
    'coordinador_operaciones'
  ];

  const hasWMSAccess = wmsAuthorizedRoles.includes(userRole as Role);

  const canAccessWMS = () => {
    if (!userRole) return false;
    return hasWMSAccess;
  };

  const canManageConfiguration = () => {
    if (!userRole) return false;
    // Solo admin y owner pueden gestionar configuración
    return ['owner', 'admin'].includes(userRole);
  };

  const canManageInventory = () => {
    if (!userRole) return false;
    // Todos los roles autorizados pueden gestionar inventario
    return hasWMSAccess;
  };

  const canManagePurchases = () => {
    if (!userRole) return false;
    // Todos los roles autorizados pueden gestionar compras (luego se añadirán roles específicos)
    return hasWMSAccess;
  };

  return {
    hasWMSAccess,
    canAccessWMS,
    canManageConfiguration,
    canManageInventory,
    canManagePurchases,
    userRole,
  };
};