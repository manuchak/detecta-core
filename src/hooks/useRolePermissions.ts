
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Permission, PermissionsByRole, RolePermissionInput, Role } from '@/types/roleTypes';

export const useRolePermissions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissions, isLoading, error } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');

      if (error) {
        throw new Error(`Error fetching permissions: ${error.message}`);
      }

      // Group permissions by role
      const permissionsByRole = {} as PermissionsByRole;
      
      // Initialize the permissionsByRole object with empty arrays for all roles
      const allRoles: Role[] = [
        'admin', 'supply', 'supply_admin', 'soporte', 'bi', 
        'monitoring', 'monitoring_supervisor', 'owner', 'pending', 'unverified'
      ];
      
      allRoles.forEach(role => {
        permissionsByRole[role] = [];
      });
      
      data.forEach(permission => {
        // Cast the string role from the database to our Role type
        const typedRole = permission.role as Role;
        
        // Cast the permission to our Permission type
        permissionsByRole[typedRole].push({
          id: permission.id,
          role: typedRole,
          permission_type: permission.permission_type,
          permission_id: permission.permission_id,
          allowed: permission.allowed
        });
      });
      
      return permissionsByRole;
    },
    staleTime: 60000 // Cache for 1 minute to improve performance
  });

  const updatePermission = useMutation({
    mutationFn: async ({ id, allowed }: { id: number, allowed: boolean }) => {
      const { error } = await supabase
        .from('role_permissions')
        .update({ allowed })
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error updating permission: ${error.message}`);
      }
      
      return { id, allowed };
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

  const addPermission = useMutation({
    mutationFn: async ({ role, permissionType, permissionId, allowed }: RolePermissionInput) => {
      try {
        // Log the request for debugging
        console.log('Sending permission request:', { role, permissionType, permissionId, allowed });
        
        // Use the edge function to add the permission
        const { data, error } = await supabase.functions.invoke('add-permission', {
          body: { 
            role, 
            permissionType, 
            permissionId, 
            allowed 
          }
        });
        
        if (error) {
          console.error('Edge function error:', error);
          throw new Error(`Error adding permission: ${error.message || String(error)}`);
        }
        
        // Check for application-level errors in the data
        if (data && data.error) {
          console.error('Application error from add-permission function:', data.error);
          throw new Error(`Error adding permission: ${data.error}`);
        }
        
        console.log('Permission added successfully:', data);
        return data;
      } catch (err) {
        console.error('Exception in addPermission mutation:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('Permission added mutation success:', data);
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permiso añadido",
        description: "El nuevo permiso ha sido añadido correctamente",
      });
    },
    onError: (error) => {
      console.error('Permission added mutation error:', error);
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
    updatePermission,
    addPermission
  };
};
