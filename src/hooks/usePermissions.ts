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
      
      // Get user role from user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error getting user role:', error);
        return null;
      }
      
      return data?.role || null;
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
    
    // Use direct query instead of RPC
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error checking role:', error);
      return false;
    }
    
    if (!data?.role) return false;
    
    // Owner can do anything
    if (data.role === 'owner') return true;
    
    // Admin can do anything except owner-specific tasks
    if (data.role === 'admin' && requiredRole !== 'owner') return true;
    
    // Otherwise, check exact match
    return data.role === requiredRole;
  };

  // Check if user has a specific permission
  const hasPermission = async (permissionType: string, permissionId: string): Promise<boolean> => {
    if (!user || !userRole) return false;
    
    // Owner always has all permissions
    if (userRole === 'owner') return true;
    
    // Check if the role has the specific permission
    const { data, error } = await supabase
      .from('role_permissions')
      .select('allowed')
      .eq('role', userRole)
      .eq('permission_type', permissionType)
      .eq('permission_id', permissionId)
      .single();
    
    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }
    
    return data?.allowed || false;
  };

  return {
    userRole,
    hasRole,
    hasPermission,
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isOwner: userRole === 'owner'
  };
};
