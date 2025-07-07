
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
        console.log('Fetching users with roles using secure function...');
        
        // Verificar primero si el usuario actual es admin usando la función segura
        const { data: currentUserRole, error: roleError } = await supabase.rpc('get_current_user_role');
        
        if (roleError) {
          console.error('Error checking user role:', roleError);
          throw new Error('No se pudo verificar los permisos del usuario');
        }
        
        console.log('Current user role:', currentUserRole);
        
        if (!currentUserRole || !['admin', 'owner', 'supply_admin'].includes(currentUserRole)) {
          throw new Error('Sin permisos de administrador para ver usuarios');
        }
        
        // Usar la función segura consolidada
        const { data, error } = await supabase.rpc('get_users_with_roles_secure');
        
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
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: Role }) => {
      try {
        console.log(`Updating user ${userId} to role ${role}`);
        
        // Verificar permisos antes de actualizar
        const { data: hasPermission, error: permissionError } = await supabase.rpc('is_admin_user_secure');
        
        if (permissionError || !hasPermission) {
          throw new Error('Sin permisos para actualizar roles de usuario');
        }
        
        // Actualizar el rol directamente en la tabla user_roles
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) {
          console.error('Error deleting old roles:', deleteError);
          throw new Error(`Error al eliminar roles anteriores: ${deleteError.message}`);
        }
        
        const { data, error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: role
          })
          .select()
          .single();
        
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
        
        // Verificar permisos antes de verificar email
        const { data: hasPermission, error: permissionError } = await supabase.rpc('is_admin_user_secure');
        
        if (permissionError || !hasPermission) {
          throw new Error('Sin permisos para verificar emails de usuario');
        }
        
        // Actualizar el perfil del usuario
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
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
