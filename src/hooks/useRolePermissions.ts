
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Permission, PermissionsByRole, RolePermissionInput, Role } from '@/types/roleTypes';

// Helper function to fetch roles safely
const fetchAvailableRoles = async (): Promise<Role[]> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .order('created_at');
    
    if (error) {
      console.error('Error fetching roles:', error);
      // Return default roles as fallback
      return [
        'owner',
        'admin',
        'supply_admin',
        'supply',
        'soporte',
        'bi',
        'monitoring_supervisor',
        'monitoring',
        'pending',
        'unverified'
      ];
    }
    
    // Get unique roles and sort them by hierarchy
    const uniqueRoles = [...new Set(data.map(item => item.role as Role))];
    
    return uniqueRoles.sort((a, b) => {
      const sortOrder = {
        'owner': 1,
        'admin': 2,
        'supply_admin': 3,
        'bi': 4,
        'monitoring_supervisor': 5,
        'monitoring': 6,
        'supply': 7,
        'soporte': 8,
        'pending': 9,
        'unverified': 10
      };
      const orderA = sortOrder[a as keyof typeof sortOrder] || 100;
      const orderB = sortOrder[b as keyof typeof sortOrder] || 100;
      return orderA - orderB;
    });
  } catch (err) {
    console.error('Error in fetchAvailableRoles:', err);
    // Return default roles as fallback
    return [
      'owner',
      'admin',
      'supply_admin',
      'supply',
      'soporte',
      'bi',
      'monitoring_supervisor',
      'monitoring',
      'pending',
      'unverified'
    ];
  }
};

// Helper function to fetch permissions safely
const fetchRolePermissions = async (): Promise<Permission[]> => {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('id, role, permission_type, permission_id, allowed')
      .order('role', { ascending: true })
      .order('permission_type', { ascending: true });
      
    if (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
    
    return data.map((p: any) => ({
      id: p.id,
      role: p.role as Role,
      permission_type: p.permission_type,
      permission_id: p.permission_id,
      allowed: p.allowed
    }));
  } catch (err) {
    console.error('Error in fetchRolePermissions:', err);
    return [];
  }
};

export const useRolePermissions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to get all permissions by role
  const { data: permissions, isLoading, error, refetch } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      try {
        // Get all permissions using helper functions
        const rolePermissions = await fetchRolePermissions();
        
        // Get all available roles
        const allRoles = await fetchAvailableRoles();
        
        // Group permissions by role
        const permissionsByRole = {} as PermissionsByRole;
        
        // Initialize with empty arrays for all roles
        allRoles.forEach(role => {
          permissionsByRole[role] = [];
        });
        
        // Populate with fetched permissions
        if (rolePermissions && Array.isArray(rolePermissions)) {
          rolePermissions.forEach(permission => {
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
        
        console.log('Permissions loaded by role:', permissionsByRole);
        return permissionsByRole;
      } catch (err) {
        console.error('Error in useRolePermissions:', err);
        throw err;
      }
    },
    staleTime: 60000,
    retry: 1,
  });

  // Mutation to update an existing permission
  const updatePermission = useMutation({
    mutationFn: async ({ id, allowed }: { id: string, allowed: boolean }) => {
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
