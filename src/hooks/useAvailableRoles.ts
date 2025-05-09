import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Role, CreateRoleInput, UpdateRoleInput, DeleteRoleInput } from '@/types/roleTypes';
import { fetchUserRoles } from '@/utils/dbHelpers';

export const useAvailableRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['available-roles'],
    queryFn: async () => {
      try {
        // Use the helper function that avoids RLS recursion
        return await fetchUserRoles();
      } catch (error) {
        console.error('Error in useAvailableRoles:', error);
        
        // Fallback to hardcoded roles if the query fails
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
    }
  });

  // Create a new role
  const createRole = useMutation({
    mutationFn: async ({ role }: CreateRoleInput) => {
      // Use the edge function for role creation
      const response = await supabase.functions.invoke('create-role', {
        body: { new_role: role }
      });

      if (response.error) {
        console.error('Error from edge function:', response.error);
        throw new Error(`Error creating role: ${response.error.message || response.error}`);
      }
      
      if (response.data && response.data.error) {
        console.error('Error from create-role function:', response.data.error);
        throw new Error(`Error creating role: ${response.data.error}`);
      }

      return response.data;
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
        description: error instanceof Error ? error.message : "Error al crear el rol",
        variant: "destructive",
      });
    }
  });

  // Update an existing role
  const updateRole = useMutation({
    mutationFn: async ({ oldRole, newRole }: UpdateRoleInput) => {
      const { data, error } = await supabase.functions.invoke('update-role', {
        body: { 
          old_role: oldRole,
          new_role: newRole 
        }
      });

      if (error) {
        throw new Error(`Error updating role: ${error.message}`);
      }
      
      if (data && data.error) {
        throw new Error(`Error updating role: ${data.error}`);
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
        description: error instanceof Error ? error.message : "Error al actualizar el rol",
        variant: "destructive",
      });
    }
  });

  // Delete a role
  const deleteRole = useMutation({
    mutationFn: async ({ role }: DeleteRoleInput) => {
      const { data, error } = await supabase.functions.invoke('delete-role', {
        body: { target_role: role }
      });

      if (error) {
        throw new Error(`Error deleting role: ${error.message}`);
      }
      
      if (data && data.error) {
        throw new Error(`Error deleting role: ${data.error}`);
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
        description: error instanceof Error ? error.message : "Error al eliminar el rol",
        variant: "destructive",
      });
    }
  });

  return { 
    roles,
    isLoading,
    error,
    createRole,
    updateRole,
    deleteRole
  };
};
