
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
        console.log('Fetching users with roles...');
        
        // Use the new secure function that bypasses RLS and includes admin checks
        const { data, error } = await supabase.rpc('get_users_with_roles_secure');
        
        if (error) {
          console.error("Error fetching users with roles:", error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        console.log('Raw data from get_users_with_roles_secure:', data);
        
        if (!data) {
          console.log('No data returned from function');
          return [];
        }
        
        // Map the returned data to UserWithRole type safely
        const mappedUsers = (data || []).map((user: any) => ({
          id: user.id,
          email: user.email,
          display_name: user.display_name || user.email,
          role: user.role as Role,
          created_at: user.created_at,
          last_login: user.last_login
        })) as UserWithRole[];
        
        console.log('Mapped users:', mappedUsers);
        return mappedUsers;
      } catch (error) {
        console.error("Error in useUserRoles:", error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: Role }) => {
      try {
        console.log(`Updating user ${userId} to role ${role}`);
        
        // First verify admin access
        const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin_bypass_rls');
        
        if (adminError || !isAdminData) {
          throw new Error('Sin permisos para actualizar roles de usuario');
        }

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
        
        console.log(`Successfully updated user ${userId} to role ${role}`);
        return { userId, role };
      } catch (error) {
        console.error('Error in updateUserRole:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
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
        console.log(`Verifying email for user ${userId}`);
        
        // First verify admin access  
        const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin_bypass_rls');
        
        if (adminError || !isAdminData) {
          throw new Error('Sin permisos para verificar emails de usuario');
        }

        // Update user profile to mark as verified
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', userId);
        
        if (profileError) {
          console.error('Error updating profile verification:', profileError);
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
        
        console.log(`Successfully verified email for user ${userId}`);
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
      console.error('Verification error:', error);
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
