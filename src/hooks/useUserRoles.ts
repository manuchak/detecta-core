
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Role, UserWithRole } from '@/types/roleTypes';

export const useUserRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      try {
        // Get all users from profiles table
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        if (profilesError) {
          throw new Error(`Error fetching profiles: ${profilesError.message}`);
        }

        // Direct query for user roles to avoid RLS recursion
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) {
          console.error('Error fetching user roles:', rolesError);
          throw new Error(`Error fetching user roles: ${rolesError.message}`);
        }

        // Create a map of user_id to role for faster lookup
        const userRoleMap = new Map();
        
        if (Array.isArray(userRoles)) {
          userRoles.forEach(ur => {
            userRoleMap.set(ur.user_id, ur.role);
          });
        }

        // Combine data
        return profiles.map((profile) => {
          return {
            id: profile.id,
            email: profile.email,
            display_name: profile.display_name,
            role: userRoleMap.get(profile.id) || 'unverified',
            created_at: profile.created_at,
            last_login: profile.last_login,
          } as UserWithRole;
        });
      } catch (error) {
        console.error("Error in useUserRoles:", error);
        throw error;
      }
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: Role }) => {
      // Direct SQL approach to avoid recursion
      try {
        // First delete any existing role
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) {
          console.error('Error deleting existing role:', deleteError);
          throw new Error(`Error updating role: ${deleteError.message}`);
        }
        
        // Then insert new role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role }]);
          
        if (insertError) {
          console.error('Error inserting new role:', insertError);
          throw new Error(`Error updating role: ${insertError.message}`);
        }
        
        return { userId, role };
      } catch (error) {
        console.error('Error in updateUserRole:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado correctamente",
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

  const verifyUserEmail = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      try {
        // Directly update the auth.users table with the service role
        // This approach avoids RLS restrictions
        const { data, error } = await supabase.auth.admin.updateUserById(
          userId,
          { email_confirm: true }
        );
        
        if (error) {
          throw new Error(`Error verifying email: ${error.message}`);
        }
        
        // Update user role from unverified to pending if needed
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'pending' })
          .eq('user_id', userId)
          .eq('role', 'unverified');
        
        if (roleError) {
          console.error('Error updating role after verification:', roleError);
        }
        
        return { userId };
      } catch (error) {
        console.error('Error in verifyUserEmail:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "Email verificado",
        description: "El email del usuario ha sido verificado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al verificar el email",
        variant: "destructive",
      });
    }
  });

  return {
    users,
    isLoading,
    error,
    updateUserRole,
    verifyUserEmail
  };
};
