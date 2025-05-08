
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const usePermissions = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Get user's role
  const { data: role } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Try to get role from RPC function
      const { data, error } = await supabase.rpc('get_user_role', {
        user_uid: user.id
      });
      
      if (error) {
        console.error('Error getting user role:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user,
  });

  // Update role state when data changes
  useEffect(() => {
    if (role !== undefined) {
      setUserRole(role);
    }
  }, [role]);

  // Check if user has a specific role
  const hasRole = async (requiredRole: string): Promise<boolean> => {
    if (!user) return false;
    
    const { data, error } = await supabase.rpc('has_role', {
      user_uid: user.id,
      required_role: requiredRole
    });
    
    if (error) {
      console.error('Error checking role:', error);
      return false;
    }
    
    return data;
  };

  // Check if user has a specific permission
  const hasPermission = async (permissionType: string, permissionId: string): Promise<boolean> => {
    if (!user) return false;
    
    const { data, error } = await supabase.rpc('user_has_permission', {
      user_uid: user.id,
      permission_type: permissionType,
      permission_id: permissionId
    });
    
    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }
    
    return data;
  };

  return {
    userRole,
    hasRole,
    hasPermission,
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isOwner: userRole === 'owner'
  };
};
