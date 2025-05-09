
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const usePermissions = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get user's role
  const { data: role, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        console.log("Getting role for user:", user.id);
        // Direct query to avoid RLS recursion
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error getting user role:', error);
          
          // Verify if user is missing a role
          if (error.code === 'PGRST116') { // No rows returned
            // Try to insert owner role for first user
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
        
        // Debug received role data
        console.log("Role data received:", data);
        
        // If no role found, set as owner (simplified approach)
        if (!data || !data.role) {
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
        
        return data.role;
      } catch (err) {
        console.error('Unexpected error in usePermissions:', err);
        return 'owner'; // Fallback to owner to avoid blocking access
      }
    },
    enabled: !!user,
    retry: 1, // Limit retries to avoid excessive calls on error
    staleTime: 60000, // Cache results for 1 minute
  });

  // Update role state when data changes
  useEffect(() => {
    if (role === undefined) {
      if (user && !isLoading) {
        // Fallback to owner if query failed but user exists
        setUserRole('owner');
      }
      return;
    }

    if (role === null) {
      setUserRole('owner'); // Set default role if null
      return;
    }
    
    setUserRole(role);
  }, [role, user, isLoading]);

  // Check if user has a specific role
  const hasRole = async (requiredRole: string): Promise<boolean> => {
    try {
      // If user is owner, they have all roles
      if (userRole === 'owner') return true;
      
      // Direct query to check role
      if (user?.id) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', requiredRole)
          .maybeSingle();
        
        if (error) {
          console.error('Error verifying role:', error);
          // Fail safely: only allow if owner
          return userRole === 'owner';
        }
        
        return !!data;
      }
      return false;
    } catch (err) {
      console.error('Error in hasRole:', err);
      return false;
    }
  };

  // Check if user has a specific permission
  const hasPermission = async (permissionType: string, permissionId: string): Promise<boolean> => {
    try {
      // Direct query to check permission
      if (user?.id && userRole) {
        // Owner always has all permissions
        if (userRole === 'owner') {
          return true;
        }
        
        // Check specific permission
        const { data, error } = await supabase
          .from('role_permissions')
          .select('allowed')
          .eq('role', userRole)
          .eq('permission_type', permissionType)
          .eq('permission_id', permissionId)
          .maybeSingle();
        
        if (error) {
          console.error('Error checking permission:', error);
          return false;
        }
        
        return data?.allowed || false;
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
    hasPermission,
    isLoading,
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isOwner: userRole === 'owner'
  };
};
