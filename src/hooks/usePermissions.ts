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
        // Get user role from user_roles table
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error getting user role:', error);
          
          // Create owner role for this user if not exists
          const { data: insertData, error: insertError } = await supabase
            .from('user_roles')
            .insert([{ user_id: user.id, role: 'owner' }])
            .select('role')
            .single();
            
          if (insertError) {
            console.error('Error creating owner role:', insertError);
            return null;
          }
          
          toast({
            title: "Acceso concedido",
            description: "Se ha configurado el rol de propietario para su usuario",
            variant: "success",
          });
          
          return insertData?.role || 'owner';
        }
        
        // If user has no role, set them as owner
        if (!data) {
          const { data: insertData, error: insertError } = await supabase
            .from('user_roles')
            .insert([{ user_id: user.id, role: 'owner' }])
            .select('role')
            .single();
            
          if (insertError) {
            console.error('Error creating owner role:', insertError);
            return null;
          }
          
          toast({
            title: "Acceso concedido",
            description: "Se ha configurado el rol de propietario para su usuario",
            variant: "success",
          });
          
          return insertData?.role || 'owner';
        }
        
        return data?.role || null;
      } catch (err) {
        console.error('Unexpected error in usePermissions:', err);
        return 'owner'; // Fallback to owner role to prevent lockout
      }
    },
    enabled: !!user,
  });

  // Update role state when data changes
  useEffect(() => {
    if (role !== undefined) {
      setUserRole(role);
    } else if (user && !isLoading) {
      // Fallback to owner role if query failed but user exists
      setUserRole('owner');
    }
  }, [role, user, isLoading]);

  // Check if user has a specific role
  const hasRole = async (requiredRole: string): Promise<boolean> => {
    if (!user) return false;
    
    // If userRole is already cached, use it
    if (userRole) {
      // Owner can do anything
      if (userRole === 'owner') return true;
      
      // Admin can do anything except owner-specific tasks
      if (userRole === 'admin' && requiredRole !== 'owner') return true;
      
      // Otherwise, check exact match
      return userRole === requiredRole;
    }
    
    try {
      // Use direct query if role isn't cached yet
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data?.role) {
        console.log('No role found or error, granting owner privileges');
        return true; // Grant access if there's an error or no role
      }
      
      // Owner can do anything
      if (data.role === 'owner') return true;
      
      // Admin can do anything except owner-specific tasks
      if (data.role === 'admin' && requiredRole !== 'owner') return true;
      
      // Otherwise, check exact match
      return data.role === requiredRole;
    } catch (err) {
      console.error('Error in hasRole:', err);
      return true; // Grant access on error to prevent lockout
    }
  };

  // Check if user has a specific permission
  const hasPermission = async (permissionType: string, permissionId: string): Promise<boolean> => {
    if (!user) return false;
    
    // Owner always has all permissions
    if (userRole === 'owner') return true;
    
    try {
      // Check if the role has the specific permission
      const { data, error } = await supabase
        .from('role_permissions')
        .select('allowed')
        .eq('role', userRole || '')
        .eq('permission_type', permissionType)
        .eq('permission_id', permissionId)
        .single();
      
      if (error) {
        console.error('Error checking permission:', error);
        return userRole === 'admin'; // Admins get permissions by default on error
      }
      
      return data?.allowed || false;
    } catch (err) {
      console.error('Error in hasPermission:', err);
      return userRole === 'admin'; // Admins get permissions by default on error
    }
  };

  return {
    userRole,
    hasRole,
    hasPermission,
    isLoading,
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isOwner: userRole === 'owner'
  };
};
