
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

        // Get all user roles using our safe function
        const { data: userRoles, error: rolesError } = await supabase
          .rpc('get_user_roles_safe');

        if (rolesError) {
          throw new Error(`Error fetching roles: ${rolesError.message}`);
        }

        // Combine data
        return profiles.map((profile) => {
          const userRole = userRoles.find((ur) => ur.user_id === profile.id);
          return {
            id: profile.id,
            email: profile.email,
            display_name: profile.display_name,
            role: userRole ? userRole.role : 'unverified',
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
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: role
      });
      
      if (error) {
        throw new Error(`Error updating role: ${error.message}`);
      }
      
      return { userId, role };
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
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const verifyUserEmail = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase.rpc('verify_user_email', {
        target_user_id: userId
      });
      
      if (error) {
        throw new Error(`Error verifying email: ${error.message}`);
      }
      
      return { userId };
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
        description: error.message,
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
