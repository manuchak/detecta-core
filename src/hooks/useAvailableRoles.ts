
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Role, CreateRoleInput, UpdateRoleInput, DeleteRoleInput } from '@/types/roleTypes';

export const useAvailableRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['available-roles'],
    queryFn: async () => {
      try {
        // Use the secure function that doesn't cause recursion
        const { data, error } = await supabase.rpc('get_user_roles_safe');
        
        if (error) {
          console.error('Error fetching available roles:', error);
          // Return default roles as fallback
          return [
            'owner',
            'admin', 
            'supply_admin',
            'bi',
            'monitoring_supervisor',
            'monitoring',
            'supply',
            'soporte',
            'pending',
            'unverified'
          ] as Role[];
        }
        
        // Map the returned data to Role type safely
        return (data || []).map((item: { role: string }) => item.role as Role);
      } catch (err) {
        console.error('Error in fetchAvailableRoles:', err);
        // Return default roles as fallback
        return [
          'owner',
          'admin',
          'supply_admin', 
          'bi',
          'monitoring_supervisor',
          'monitoring',
          'supply',
          'soporte',
          'pending',
          'unverified'
        ] as Role[];
      }
    },
  });

  const createRole = useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      // Insert directly into user_roles table for new role creation
      const { data, error } = await supabase
        .from('user_roles')
        .insert([{ 
          user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for role definition
          role: input.role 
        }]);
      
      if (error) {
        throw new Error(`Error creating role: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-roles'] });
      toast({
        title: "Rol creado",
        description: "El nuevo rol ha sido creado correctamente",
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

  const updateRole = useMutation({
    mutationFn: async (input: UpdateRoleInput) => {
      // Update all instances of the old role to the new role
      const { data, error } = await supabase
        .from('user_roles')
        .update({ role: input.newRole })
        .eq('role', input.oldRole);
      
      if (error) {
        throw new Error(`Error updating role: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "Rol actualizado",
        description: "El rol ha sido actualizado correctamente",
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

  const deleteRole = useMutation({
    mutationFn: async (input: DeleteRoleInput) => {
      // Delete all instances of the role
      const { data, error } = await supabase
        .from('user_roles')
        .delete()
        .eq('role', input.role);
      
      if (error) {
        throw new Error(`Error deleting role: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "Rol eliminado",
        description: "El rol ha sido eliminado correctamente",
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
