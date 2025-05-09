
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Role, CreateRoleInput, UpdateRoleInput, DeleteRoleInput } from '@/types/roleTypes';

export const useAvailableRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: ['available-roles'],
    queryFn: async () => {
      // Use our safe RPC function that doesn't cause recursion
      const { data, error } = await supabase
        .rpc('get_user_roles_safe');
      
      if (error) {
        console.error('Error fetching roles:', error);
        // Fallback to hardcoded roles if the RPC fails
        const availableRoles: Role[] = [
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
        
        return availableRoles;
      }

      // Extract unique roles from the result
      const uniqueRoles = new Set<Role>();
      data?.forEach(roleData => {
        uniqueRoles.add(roleData.role as Role);
      });

      // If no roles found, return default roles
      if (uniqueRoles.size === 0) {
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
        ] as Role[];
      }

      return Array.from(uniqueRoles);
    }
  });

  // Create a new role
  const createRole = useMutation({
    mutationFn: async ({ role }: CreateRoleInput) => {
      const { data, error } = await supabase
        .rpc('create_new_role', { 
          new_role: role 
        });

      if (error) {
        throw new Error(`Error creating role: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-roles'] });
      toast({
        title: "Rol creado",
        description: "El rol ha sido creado exitosamente",
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

  // Update an existing role
  const updateRole = useMutation({
    mutationFn: async ({ oldRole, newRole }: UpdateRoleInput) => {
      const { data, error } = await supabase
        .rpc('update_role_name', { 
          old_role: oldRole,
          new_role: newRole 
        });

      if (error) {
        throw new Error(`Error updating role: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "Rol actualizado",
        description: "El nombre del rol ha sido actualizado exitosamente",
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

  // Delete a role
  const deleteRole = useMutation({
    mutationFn: async ({ role }: DeleteRoleInput) => {
      const { data, error } = await supabase
        .rpc('delete_role', { 
          target_role: role 
        });

      if (error) {
        throw new Error(`Error deleting role: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Rol eliminado",
        description: "El rol ha sido eliminado exitosamente",
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
    roles, 
    createRole,
    updateRole,
    deleteRole
  };
};
