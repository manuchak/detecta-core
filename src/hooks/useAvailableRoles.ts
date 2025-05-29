
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
        const { data, error } = await supabase.rpc('get_available_roles_secure');
        
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
        
        return data as Role[];
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
      const { data, error } = await supabase.rpc('create_new_role', {
        new_role: input.role
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
      const { data, error } = await supabase.rpc('update_role_name', {
        old_role: input.oldRole,
        new_role: input.newRole
      });
      
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
      const { data, error } = await supabase.rpc('delete_role', {
        target_role: input.role
      });
      
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
