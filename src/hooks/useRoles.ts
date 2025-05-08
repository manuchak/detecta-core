
import { useState } from 'react';
import { useUserRoles } from './useUserRoles';
import { useAvailableRoles } from './useAvailableRoles';
import { useRolePermissions } from './useRolePermissions';
import { Role, UserWithRole } from '@/types/roleTypes';

export type { Role, UserWithRole } from '@/types/roleTypes';

export const useRoles = () => {
  const { users, isLoading: usersLoading, error, updateUserRole, verifyUserEmail } = useUserRoles();
  const { roles } = useAvailableRoles();
  const { permissions, isLoading: permissionsLoading, updatePermission, addPermission } = useRolePermissions();

  // Combine loading states
  const isLoading = usersLoading || permissionsLoading;

  return {
    users,
    roles,
    permissions,
    isLoading,
    error,
    updateUserRole,
    updatePermission,
    addPermission,
    verifyUserEmail
  };
};
