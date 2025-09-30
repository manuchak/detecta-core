
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
        console.log('Fetching ALL users with roles using new secure function...');
        
        // Usar la nueva función que muestra TODOS los usuarios
        const { data, error } = await supabase.rpc('get_all_users_with_roles_secure');
        
        if (error) {
          console.error("Error fetching users with roles:", error);
          throw new Error(`Error al cargar usuarios: ${error.message}`);
        }
        
        console.log('Raw data from get_all_users_with_roles_secure:', data);
        
        if (!data || data.length === 0) {
          console.log('No users returned from function');
          return [];
        }
        
        // Mapear los datos con los nuevos campos
        const mappedUsers = data.map((user: any) => ({
          id: user.id,
          email: user.email,
          display_name: user.display_name || user.email,
          role: user.role as Role,
          created_at: user.created_at,
          last_login: user.last_login,
          is_verified: user.is_verified,
          role_category: user.role_category,
          role_priority: user.role_priority
        })) as UserWithRole[];
        
        console.log('Mapped users with categories:', mappedUsers);
        return mappedUsers;
        
      } catch (error) {
        console.error("Error in useUserRoles:", error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Error desconocido al cargar usuarios');
      }
    },
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: Role }) => {
      try {
        console.log(`Updating user ${userId} to role ${role}`);
        
        // Usar la función segura que maneja todo internamente
        const { data, error } = await supabase.rpc('update_user_role_secure', {
          target_user_id: userId,
          new_role: role
        });
        
        if (error) {
          console.error('Error updating user role:', error);
          throw new Error(`Error al actualizar rol: ${error.message}`);
        }
        
        if (!data) {
          throw new Error('No se pudo completar la actualización del rol');
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
        
        // Usar la función segura que maneja todo internamente
        const { data, error } = await supabase.rpc('verify_user_email_secure', {
          target_user_id: userId
        });
        
        if (error) {
          console.error('Error verifying user email:', error);
          throw new Error(`Error al verificar email: ${error.message}`);
        }
        
        if (!data) {
          throw new Error('No se pudo completar la verificación del email');
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
