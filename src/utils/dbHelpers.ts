
import { supabase } from '@/integrations/supabase/client';
import { Role, Permission, UserWithRole } from '@/types/roleTypes';

/**
 * Helper functions to handle database operations safely without causing RLS recursion
 */

export const fetchUserRoles = async (): Promise<Role[]> => {
  try {
    // Direct query to get distinct roles without using distinctOn
    const { data, error } = await supabase
      .from('user_roles')
      .select('role');
    
    if (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
    
    // Process the results to get unique roles
    const uniqueRoles = Array.from(new Set(data.map(item => item.role as Role)));
    return uniqueRoles;
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
      .select('id, role, permission_type, permission_id, allowed');
      
    if (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
    
    return data.map(p => ({
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
    // Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }
    
    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');
      
    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      throw rolesError;
    }
    
    // Map roles to users
    const roleMap = new Map();
    userRoles.forEach(ur => {
      roleMap.set(ur.user_id, ur.role);
    });
    
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
