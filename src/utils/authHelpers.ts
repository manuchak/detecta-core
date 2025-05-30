
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper functions for authentication and authorization
 * Following Supabase best practices
 */

export const getCurrentUserRole = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Use the safe function that doesn't cause recursion
    const { data, error } = await supabase.rpc('get_user_role_safe', {
      user_uid: user.id
    });

    if (error) {
      console.error('Error getting user role:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in getCurrentUserRole:', err);
    return null;
  }
};

export const isUserAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    // Direct admin check for admin@admin.com
    if (user.email === 'admin@admin.com') {
      return true;
    }
    
    const { data, error } = await supabase.rpc('has_role', {
      user_uid: user.id,
      required_role: 'admin'
    });

    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }

    return data || false;
  } catch (err) {
    console.error('Error in isUserAdmin:', err);
    return false;
  }
};

export const canAccessDashboardData = async (): Promise<boolean> => {
  try {
    const userRole = await getCurrentUserRole();
    
    // Define roles that can access dashboard data
    const allowedRoles = ['admin', 'owner', 'bi', 'monitoring_supervisor', 'supply_admin'];
    
    return userRole ? allowedRoles.includes(userRole) : false;
  } catch (err) {
    console.error('Error checking dashboard access:', err);
    return false;
  }
};
