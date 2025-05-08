
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Permission, PermissionsByRole, RolePermissionInput } from '@/types/roleTypes';

export const useRolePermissions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');

      if (error) {
        throw new Error(`Error fetching permissions: ${error.message}`);
      }

      // Group permissions by role
      const permissionsByRole: PermissionsByRole = {};
      
      data.forEach(permission => {
        if (!permissionsByRole[permission.role]) {
          permissionsByRole[permission.role] = [];
        }
        permissionsByRole[permission.role].push(permission);
      });
      
      return permissionsByRole;
    }
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
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addPermission = useMutation({
    mutationFn: async ({ role, permissionType, permissionId, allowed }: RolePermissionInput) => {
      const { error } = await supabase
        .from('role_permissions')
        .insert({ role, permission_type: permissionType, permission_id: permissionId, allowed });
      
      if (error) {
        throw new Error(`Error adding permission: ${error.message}`);
      }
      
      return { role, permissionType, permissionId, allowed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permiso añadido",
        description: "El nuevo permiso ha sido añadido correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    permissions,
    isLoading,
    updatePermission,
    addPermission
  };
};
