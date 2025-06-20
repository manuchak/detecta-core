
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

  // Get user role using the secure function that doesn't cause recursion
  const { data: userRole, isLoading: roleLoading, refetch: refetchRole } = useQuery({
    queryKey: ['user-role', context.user?.id],
    queryFn: async () => {
      if (!context.user?.id) return null;
      
      try {
        // Use the new secure function that bypasses RLS
        const { data, error } = await supabase.rpc('get_user_role_direct', {
          user_uid: context.user.id
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

  // Check if user is admin or owner using the secure bypass function
  const isAdminOrOwner = async (): Promise<boolean> => {
    if (!context.user?.id) return false;
    
    try {
      const { data, error } = await supabase.rpc('is_admin_bypass_rls');

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
      // First verify admin access
      const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin_bypass_rls');
      
      if (adminError || !isAdminData) {
        throw new Error('Sin permisos para asignar roles');
      }

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
    isAdminOrOwner,
    assignRole,
    isOwner: userRole === 'owner',
    isAdmin: userRole === 'admin',
    isAuthenticated: !!context.user,
  };
};
