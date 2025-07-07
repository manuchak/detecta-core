
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper functions for authentication and authorization
 * Following Supabase best practices with consolidated security functions
 */

export const getCurrentUserRole = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Use the consolidated safe function that doesn't cause recursion
    const { data, error } = await supabase.rpc('get_current_user_role');

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
    
    // Use the consolidated secure function
    const { data, error } = await supabase.rpc('is_admin_user_secure');

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
