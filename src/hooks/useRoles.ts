
import { useUserRoles } from './useUserRoles';
import { useAvailableRoles } from './useAvailableRoles';
import { useRolePermissions } from './useRolePermissions';
import { Role, UserWithRole, CreateRoleInput, UpdateRoleInput, DeleteRoleInput } from '@/types/roleTypes';

export type { Role, UserWithRole } from '@/types/roleTypes';

export const useRoles = () => {
  const { users, isLoading: usersLoading, error: usersError, updateUserRole, verifyUserEmail } = useUserRoles();
  const { roles, isLoading: rolesLoading, error: rolesError, createRole, updateRole, deleteRole } = useAvailableRoles();
  const { permissions, isLoading: permissionsLoading, error: permissionsError, updatePermission, addPermission, refetch: refetchPermissions } = useRolePermissions();

  // Combine errors with priority
  const error = permissionsError || rolesError || usersError;

  // Combine loading states
  const isLoading = usersLoading || rolesLoading || permissionsLoading;

  return {
    users,
    roles,
    permissions,
    isLoading,
    error,
    updateUserRole,
    updatePermission,
    addPermission,
    verifyUserEmail,
    createRole,
    updateRole,
    deleteRole,
    refetchPermissions
  };
};
