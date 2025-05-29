
import { supabase } from '@/integrations/supabase/client';
import { Role, Permission, UserWithRole } from '@/types/roleTypes';

/**
 * Helper functions to handle database operations following Supabase best practices
 */

export const fetchUserRoles = async (): Promise<Role[]> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .order('created_at');
    
    if (error) {
      console.error('Error fetching user roles:', error);
      // Return default roles as fallback
      return [
        'owner',
        'admin',
        'supply_admin',
        'supply',
        'soporte',
        'bi',
        'monitoring_supervisor',
        'monitoring',
        'pending',
        'unverified'
      ];
    }
    
    // Get unique roles and sort them by hierarchy
    const uniqueRoles = [...new Set(data.map(item => item.role))];
    
    return uniqueRoles.sort((a, b) => {
      const sortOrder = {
        'owner': 1,
        'admin': 2,
        'supply_admin': 3,
        'bi': 4,
        'monitoring_supervisor': 5,
        'monitoring': 6,
        'supply': 7,
        'soporte': 8,
        'pending': 9,
        'unverified': 10
      };
      const orderA = sortOrder[a as keyof typeof sortOrder] || 100;
      const orderB = sortOrder[b as keyof typeof sortOrder] || 100;
      return orderA - orderB;
    }) as Role[];
  } catch (err) {
    console.error('Error in fetchUserRoles:', err);
    // Return default roles as fallback
    return [
      'owner',
      'admin',
      'supply_admin',
      'supply',
      'soporte',
      'bi',
      'monitoring_supervisor',
      'monitoring',
      'pending',
      'unverified'
    ];
  }
};

export const fetchRolePermissions = async (): Promise<Permission[]> => {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('id, role, permission_type, permission_id, allowed')
      .order('role', { ascending: true })
      .order('permission_type', { ascending: true });
      
    if (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
    
    return data.map((p: any) => ({
      id: p.id.toString(), // Ensure id is string for consistency
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
    // Get all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .order('user_id');
      
    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      throw rolesError;
    }
    
    // Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, created_at, last_login')
      .order('created_at', { ascending: false });
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }
    
    // Map roles to users (using highest priority role per user)
    const roleMap = new Map<string, Role>();
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
    
    if (Array.isArray(userRoles)) {
      userRoles.forEach((ur: any) => {
        const currentRole = roleMap.get(ur.user_id);
        const currentPriority = currentRole ? roleHierarchy[currentRole as keyof typeof roleHierarchy] || 0 : 0;
        const newPriority = roleHierarchy[ur.role as keyof typeof roleHierarchy] || 0;
        
        if (newPriority > currentPriority) {
          roleMap.set(ur.user_id, ur.role);
        }
      });
    }
    
    // Combine data
    return profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name,
      role: roleMap.get(profile.id) || 'unverified',
      created_at: profile.created_at,
      last_login: profile.last_login
    }));
  } catch (err) {
    console.error('Error in fetchUsersWithRoles:', err);
    return [];
  }
};
