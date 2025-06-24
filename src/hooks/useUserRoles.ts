
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
        
        // Verificar primero si el usuario actual es admin
        const { data: currentUserRole, error: roleError } = await (supabase as any).rpc('get_current_user_role');
        
        if (roleError) {
          console.error('Error checking user role:', roleError);
          throw new Error('No se pudo verificar los permisos del usuario');
        }
        
        console.log('Current user role:', currentUserRole);
        
        if (!currentUserRole || !['admin', 'owner'].includes(currentUserRole)) {
          throw new Error('Sin permisos de administrador para ver usuarios');
        }
        
        // Usar la función segura para obtener usuarios
        const { data, error } = await (supabase as any).rpc('get_users_with_roles_secure');
        
        if (error) {
          console.error("Error fetching users with roles:", error);
          throw new Error(`Error al cargar usuarios: ${error.message}`);
        }
        
        console.log('Raw data from get_users_with_roles_secure:', data);
        
        if (!data || data.length === 0) {
          console.log('No users returned from function');
          return [];
        }
        
        // Mapear los datos de manera segura
        const mappedUsers = data.map((user: any) => ({
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
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Error desconocido al cargar usuarios');
      }
    },
    retry: 2,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: Role }) => {
      try {
        console.log(`Updating user ${userId} to role ${role}`);
        
        const { data, error } = await (supabase as any).rpc('update_user_role_secure', {
          p_user_id: userId,
          p_role: role
        });
        
        if (error) {
          console.error('Error updating user role:', error);
          throw new Error(`Error al actualizar rol: ${error.message}`);
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
        
        const { data, error } = await (supabase as any).rpc('verify_user_email_secure', {
          p_user_id: userId
        });
        
        if (error) {
          console.error('Error verifying user email:', error);
          throw new Error(`Error al verificar email: ${error.message}`);
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
