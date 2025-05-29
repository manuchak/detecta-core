
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const usePermissions = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get user's role safely using direct database query
  const { data: role, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        console.log("Getting role for user:", user.id);
        
        // Direct query to user_roles table
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          console.error('Error getting user role:', error);
          
          // If no role found, try to create owner role for first user
          if (error.code === 'PGRST116') { // No rows returned
            console.log('No role found, creating owner role...');
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert([{ 
                user_id: user.id, 
                role: 'owner' 
              }])
              .select('role')
              .single();
              
            if (insertError) {
              console.error('Error creating owner role:', insertError);
            } else {
              toast({
                title: "Acceso concedido",
                description: "Se ha configurado el rol de propietario para tu usuario",
                variant: "default",
              });
              return 'owner';
            }
          }
          
          // Fallback to owner role for safety
          return 'owner';
        }
        
        console.log("Role received:", data?.role);
        return data?.role || 'owner';
      } catch (err) {
        console.error('Unexpected error in usePermissions:', err);
        return 'owner'; // Fallback to owner to avoid blocking access
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 60000,
  });

  // Update role state when data changes
  useEffect(() => {
    if (role === undefined) {
      if (user && !isLoading) {
        setUserRole('owner');
      }
      return;
    }

    if (role === null) {
      setUserRole('owner');
      return;
    }
    
    setUserRole(role);
  }, [role, user, isLoading]);

  // Check if user has a specific role
  const hasRole = async (requiredRole: string): Promise<boolean> => {
    try {
      if (userRole === 'owner') return true;
      
      if (user?.id) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', requiredRole)
          .limit(1);
        
        if (error) {
          console.error('Error checking role:', error);
          return false;
        }
        
        return data.length > 0;
      }
      return false;
    } catch (err) {
      console.error('Error in hasRole:', err);
      return false;
    }
  };

  // Check role hierarchy (owner > admin > other roles)
  const hasRoleOrHigher = async (requiredRole: string): Promise<boolean> => {
    try {
      if (!userRole || !user?.id) return false;
      
      // Define role hierarchy
      const roleHierarchy = {
        'owner': 10,
        'admin': 9,
        'supply_admin': 8,
        'bi': 7,
        'monitoring_supervisor': 6,
        'monitoring': 5,
        'supply': 4,
        'soporte': 3,
        'pending': 2,
        'unverified': 1
      };
      
      const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
      
      return userRoleLevel >= requiredRoleLevel;
    } catch (err) {
      console.error('Error in hasRoleOrHigher:', err);
      return false;
    }
  };

  // Check if user has a specific permission
  const hasPermission = async (permissionType: string, permissionId: string): Promise<boolean> => {
    try {
      if (user?.id && userRole) {
        if (userRole === 'owner') {
          return true;
        }
        
        // Query role_permissions table directly
        const { data, error } = await supabase
          .from('role_permissions')
          .select('allowed')
          .eq('role', userRole)
          .eq('permission_type', permissionType)
          .eq('permission_id', permissionId)
          .eq('allowed', true)
          .limit(1);
        
        if (error) {
          console.error('Error checking permission:', error);
          return false;
        }
        
        return data.length > 0;
      }
      return false;
    } catch (err) {
      console.error('Error in hasPermission:', err);
      return false;
    }
  };

  return {
    userRole: userRole || 'owner',
    hasRole,
    hasRoleOrHigher,
    hasPermission,
    isLoading,
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isOwner: userRole === 'owner'
  };
};
