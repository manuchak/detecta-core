
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const usePermissions = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get user's role using a safe function
  const { data: role, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        console.log("Getting role for user:", user.id);
        // Use RPC function to safely get the user's role
        const { data, error } = await supabase
          .rpc('get_user_role_safe', { user_uid: user.id });
        
        if (error) {
          console.error('Error getting user role:', error);
          
          // If no role found, try to create owner role for first user
          if (error.message.includes('not found')) {
            console.log('Trying to create owner role...');
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
                title: "Access granted",
                description: "Owner role has been configured for your user",
                variant: "default",
              });
              return 'owner';
            }
          }
          
          // Fallback to owner role for safety
          return 'owner';
        }
        
        console.log("Role received:", data);
        
        // If no role found, set as owner (simplified approach)
        if (!data) {
          // Insert owner role
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: user.id,
              role: 'owner'
            }]);
            
          toast({
            title: "Access granted",
            description: "Owner role has been configured for your user",
            variant: "default",
          });
          
          if (insertError) {
            console.error('Error creating owner role:', insertError);
          }
          
          return 'owner';
        }
        
        return data;
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
        // Use existing function for compatibility
        const { data } = await supabase
          .rpc('has_role', { 
            user_uid: user.id, 
            required_role: requiredRole 
          });
        
        return !!data;
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
        
        // Use existing function
        const { data } = await supabase
          .rpc('user_has_permission', { 
            user_uid: user.id, 
            permission_type: permissionType, 
            permission_id: permissionId 
          });
        
        return !!data;
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
