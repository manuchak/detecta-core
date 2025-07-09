import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Role } from '@/types/roleTypes';

export const usePermissions = () => {
  const { userRole } = useAuth();
  const { permissions } = useRolePermissions();

  // Obtener permisos del rol actual
  const userPermissions = useMemo(() => {
    if (!userRole || !permissions) return [];
    return permissions[userRole as Role] || [];
  }, [userRole, permissions]);

  // Verificar si tiene un permiso específico
  const hasPermission = (permissionType: string, permissionId: string): boolean => {
    // Admin siempre tiene todos los permisos
    if (userRole === 'admin' || userRole === 'owner') {
      return true;
    }

    const permission = userPermissions.find(
      p => p.permission_type === permissionType && p.permission_id === permissionId
    );

    return permission?.allowed || false;
  };

  // Verificar acceso a página
  const hasPageAccess = (pageId: string): boolean => {
    return hasPermission('page', pageId);
  };

  // Verificar acceso a feature
  const hasFeatureAccess = (featureId: string): boolean => {
    return hasPermission('feature', featureId);
  };

  // Verificar acceso a acción
  const hasActionAccess = (actionId: string): boolean => {
    return hasPermission('action', actionId);
  };

  // Verificar acceso a módulo
  const hasModuleAccess = (moduleId: string): boolean => {
    return hasPermission('module', moduleId);
  };

  return {
    userPermissions,
    hasPermission,
    hasPageAccess,
    hasFeatureAccess,
    hasActionAccess,
    hasModuleAccess,
    userRole,
  };
};