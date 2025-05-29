
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user role using the new secure function
  const { data: userRole, isLoading: roleLoading, refetch: refetchRole } = useQuery({
    queryKey: ['user-role', context.user?.id],
    queryFn: async () => {
      if (!context.user?.id) return null;
      
      try {
        const { data, error } = await supabase.rpc('get_user_role_secure', {
          user_uuid: context.user.id
        });

        if (error) {
          console.error('Error getting user role:', error);
          return 'unverified';
        }

        return data || 'unverified';
      } catch (err) {
        console.error('Unexpected error getting role:', err);
        return 'unverified';
      }
    },
    enabled: !!context.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Check if user has specific role
  const hasRole = async (role: string): Promise<boolean> => {
    if (!context.user?.id) return false;
    
    try {
      const { data, error } = await supabase.rpc('user_has_role_secure', {
        user_uuid: context.user.id,
        required_role: role
      });

      if (error) {
        console.error('Error checking role:', error);
        return false;
      }

      return data || false;
    } catch (err) {
      console.error('Error in hasRole:', err);
      return false;
    }
  };

  // Check if user is admin or owner
  const isAdminOrOwner = async (): Promise<boolean> => {
    if (!context.user?.id) return false;
    
    try {
      const { data, error } = await supabase.rpc('is_admin_or_owner', {
        user_uuid: context.user.id
      });

      if (error) {
        console.error('Error checking admin/owner:', error);
        return false;
      }

      return data || false;
    } catch (err) {
      console.error('Error in isAdminOrOwner:', err);
      return false;
    }
  };

  // Assign role to user (admin/owner only)
  const assignRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select()
        .single();

      if (error) {
        throw new Error(`Error asignando rol: ${error.message}`);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });

      toast({
        title: "Rol asignado",
        description: `Rol '${role}' asignado correctamente.`,
      });

      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al asignar rol",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    ...context,
    userRole,
    roleLoading,
    refetchRole,
    hasRole,
    isAdminOrOwner,
    assignRole,
    isOwner: userRole === 'owner',
    isAdmin: userRole === 'admin',
    isAuthenticated: !!context.user,
  };
};
