
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Permission, PermissionsByRole, RolePermissionInput, Role } from '@/types/roleTypes';

export const useRolePermissions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to get all permissions by role
  const { data: permissions, isLoading, error, refetch } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      try {
        // Use a direct SQL query instead of the RPC call that's causing recursion
        const { data, error } = await supabase
          .from('role_permissions')
          .select('id, role, permission_type, permission_id, allowed');

        if (error) {
          console.error('Error fetching permissions:', error);
          throw new Error(`Error fetching permissions: ${error.message}`);
        }

        // Initialize roles we know should exist
        const defaultRoles: Role[] = ['admin', 'owner', 'pending', 'unverified'];
        
        // Get all available roles
        let allRoles: Role[] = defaultRoles;
        try {
          // Direct query for roles that avoids RLS recursion
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .distinctOn('role');
          
          if (roleData && roleData.length > 0) {
            // Extract role names
            const fetchedRoles = roleData.map((r) => r.role as Role);
            allRoles = [...new Set([...defaultRoles, ...fetchedRoles])];
          }
        } catch (err) {
          console.error('Error fetching roles, using defaults:', err);
        }
        
        // Group permissions by role
        const permissionsByRole = {} as PermissionsByRole;
        
        // Initialize with empty arrays for all roles
        allRoles.forEach(role => {
          permissionsByRole[role] = [];
        });
        
        // Populate with fetched permissions
        if (data && Array.isArray(data)) {
          data.forEach(permission => {
            // Add the role to our list if it doesn't exist yet
            const typedRole = permission.role as Role;
            
            if (!permissionsByRole[typedRole]) {
              permissionsByRole[typedRole] = [];
            }
            
            permissionsByRole[typedRole].push({
              id: permission.id,
              role: typedRole,
              permission_type: permission.permission_type,
              permission_id: permission.permission_id,
              allowed: permission.allowed
            });
          });
        }
        
        return permissionsByRole;
      } catch (err) {
        console.error('Error in useRolePermissions:', err);
        throw err;
      }
    },
    staleTime: 60000, // Cache for 1 minute
    retry: 1, // Only one retry to avoid excessive requests
  });

  // Mutation to update an existing permission
  const updatePermission = useMutation({
    mutationFn: async ({ id, allowed }: { id: number, allowed: boolean }) => {
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .update({ allowed })
          .eq('id', id)
          .select('id, allowed')
          .single();
        
        if (error) {
          throw new Error(`Error updating permission: ${error.message}`);
        }
        
        return { id, allowed };
      } catch (error) {
        console.error('Error in updatePermission:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permiso actualizado",
        description: "El permiso ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el permiso",
        variant: "destructive",
      });
    }
  });

  // Mutation to add a new permission
  const addPermission = useMutation({
    mutationFn: async ({ role, permissionType, permissionId, allowed }: RolePermissionInput) => {
      try {
        console.log(`Adding permission: ${role}.${permissionType}.${permissionId}=${allowed}`);
        
        // Use direct insert instead of RPC to avoid recursion issues
        const { data, error } = await supabase
          .from('role_permissions')
          .insert([{
            role: role,
            permission_type: permissionType,
            permission_id: permissionId,
            allowed: allowed
          }])
          .select('*')
          .single();
        
        if (error) {
          console.error('Error adding permission:', error);
          throw new Error(`Error adding permission: ${error.message}`);
        }
        
        console.log('Permission added successfully:', data);
        return data;
      } catch (err) {
        console.error('Exception in addPermission mutation:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('Permission added successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permiso añadido",
        description: "El nuevo permiso ha sido añadido correctamente",
      });
    },
    onError: (error) => {
      console.error('Error in permission addition mutation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al añadir el permiso",
        variant: "destructive",
      });
    }
  });

  return {
    permissions,
    isLoading,
    error,
    refetch,
    updatePermission,
    addPermission
  };
};
