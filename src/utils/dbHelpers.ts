
import { supabase } from '@/integrations/supabase/client';
import { Role, Permission, UserWithRole } from '@/types/roleTypes';

/**
 * Helper functions to handle database operations following Supabase best practices
 * Updated to use consolidated security functions
 */

export const fetchUserRoles = async (): Promise<Role[]> => {
  try {
    // Use the new consolidated secure function
    const { data, error } = await supabase.rpc('get_available_roles_secure');
    
    if (error) {
      console.error('Error fetching user roles:', error);
      // Return default roles as fallback including all new roles
      return [
        'owner',
        'admin',
        'supply_admin',
        'coordinador_operaciones',
        'jefe_seguridad',
        'analista_seguridad',
        'supply_lead',
        'ejecutivo_ventas',
        'custodio',
        'bi',
        'monitoring_supervisor',
        'monitoring',
        'supply',
        'instalador',
        'soporte',
        'pending',
        'unverified'
      ];
    }
    
    // Map the returned data to Role type safely
    return (data || []).map((item: { role: string }) => item.role as Role);
  } catch (err) {
    console.error('Error in fetchUserRoles:', err);
    // Return default roles as fallback including all new roles
    return [
      'owner',
      'admin',
      'supply_admin',
      'coordinador_operaciones',
      'jefe_seguridad',
      'analista_seguridad',
      'supply_lead',
      'ejecutivo_ventas',
      'custodio',
      'bi',
      'monitoring_supervisor',
      'monitoring',
      'supply',
      'instalador',
      'soporte',
      'pending',
      'unverified'
    ];
  }
};

export const fetchRolePermissions = async (): Promise<Permission[]> => {
  try {
    // Verify admin access first using consolidated function
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_user_secure');
    
    if (adminError || !isAdmin) {
      console.error('No admin permissions for fetching role permissions');
      return [];
    }

    const { data, error } = await supabase
      .from('role_permissions')
      .select('id, role, permission_type, permission_id, allowed')
      .order('role', { ascending: true })
      .order('permission_type', { ascending: true });
      
    if (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
    
    return data.map((p: any) => ({
      id: p.id,
      role: p.role as Role,
      permission_type: p.permission_type,
      permission_id: p.permission_id,
      allowed: p.allowed
    }));
  } catch (err) {
    console.error('Error in fetchRolePermissions:', err);
    return [];
  }
};

export const fetchUsersWithRoles = async (): Promise<UserWithRole[]> => {
  try {
    // Use the consolidated secure function
    const { data, error } = await supabase.rpc('get_users_with_roles_secure');
    
    if (error) {
      console.error('Error fetching users with roles:', error);
      return [];
    }
    
    // Map the returned data to UserWithRole type safely
    return (data || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      role: user.role as Role,
      created_at: user.created_at,
      last_login: user.last_login
    }));
  } catch (err) {
    console.error('Error in fetchUsersWithRoles:', err);
    return [];
  }
};
