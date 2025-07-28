
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Permission, PermissionsByRole, RolePermissionInput, Role } from '@/types/roleTypes';

// Helper function to fetch roles safely using the new secure function
const fetchAvailableRoles = async (): Promise<Role[]> => {
  try {
    const { data, error } = await supabase.rpc('get_available_roles_secure');
    
    if (error) {
      console.error('Error fetching roles:', error);
      // Return default roles as fallback
      return [
        'owner',
        'admin',
        'supply_admin',
        'coordinador_operaciones',
        'jefe_seguridad',
        'analista_seguridad',
        'supply_lead',
        'ejecutivo_ventas',
        'custodio',
        'bi',
        'monitoring_supervisor',
        'monitoring',
        'supply',
        'instalador',
        'soporte',
        'pending',
        'unverified'
      ];
    }
    
    return (data || []) as Role[];
  } catch (err) {
    console.error('Error in fetchAvailableRoles:', err);
    return [
      'owner',
      'admin',
      'supply_admin',
      'coordinador_operaciones',
      'jefe_seguridad',
      'analista_seguridad',
      'supply_lead', 
      'ejecutivo_ventas',
      'custodio',
      'bi',
      'monitoring_supervisor',
      'monitoring',
      'supply',
      'instalador',
      'soporte',
      'pending',
      'unverified'
    ];
  }
};

// Helper function to fetch permissions safely using direct table access with admin validation
const fetchRolePermissions = async (): Promise<Permission[]> => {
  try {
    // First verify admin access using the secure function
    const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin_user_secure');
    
    if (adminError) {
      console.error('Error checking admin status:', adminError);
      throw new Error('No se pudo verificar los permisos de administrador');
    }

    if (!isAdminData) {
      throw new Error('Sin permisos para acceder a esta información');
    }

    // Now fetch permissions directly from table
    const { data, error } = await supabase
      .from('role_permissions')
      .select('id, role, permission_type, permission_id, allowed, created_at, updated_at')
      .order('role', { ascending: true })
      .order('permission_type', { ascending: true });
      
    if (error) {
      console.error('Error fetching permissions:', error);
      throw error;
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
    throw err;
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
        // Get role permissions using direct table access with admin verification
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
        rolePermissions.forEach((permission: Permission) => {
          const typedRole = permission.role as Role;
          
          if (!permissionsByRole[typedRole]) {
            permissionsByRole[typedRole] = [];
          }
          
          permissionsByRole[typedRole].push(permission);
        });
        
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

  // Mutation to update an existing permission using the secure function
  const updatePermission = useMutation({
    mutationFn: async ({ id, allowed }: { id: string, allowed: boolean }) => {
      try {
        console.log(`Attempting to update permission ${id} to ${allowed}`);
        
        // Use the secure function to update permission
        const { data, error } = await supabase.rpc('update_role_permission_secure', {
          p_permission_id: id,
          p_allowed: allowed
        });
        
        if (error) {
          console.error('Error updating permission:', error);
          throw new Error(`Error actualizando permiso: ${error.message}`);
        }
        
        console.log('Permission updated successfully');
        return { id, allowed };
      } catch (error) {
        console.error('Error in updatePermission mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Permission update mutation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permiso actualizado",
        description: "El permiso ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      console.error('Permission update mutation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al actualizar permiso",
        description: `Detalles: ${errorMessage}`,
        variant: "destructive",
      });
    }
  });

  // Mutation to add a new permission with admin verification
  const addPermission = useMutation({
    mutationFn: async ({ role, permissionType, permissionId, allowed }: RolePermissionInput) => {
      try {
        console.log(`Adding permission: ${role}.${permissionType}.${permissionId}=${allowed}`);
        
        // First verify admin access
        const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin_user_secure');
        
        if (adminError || !isAdminData) {
          throw new Error('Sin permisos para añadir permisos');
        }
        
        // Add the permission directly to the table
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
