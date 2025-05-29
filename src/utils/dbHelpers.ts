
import { supabase } from '@/integrations/supabase/client';
import { Role, Permission, UserWithRole } from '@/types/roleTypes';

/**
 * Helper functions to handle database operations safely without causing RLS recursion
 * NOTA: Funciones mantenidas para compatibilidad con otros proyectos
 */

export const fetchUserRoles = async (): Promise<Role[]> => {
  try {
    // Intentar usar función optimizada con fallback a la original
    try {
      const { data, error } = await supabase
        .rpc('get_user_roles_safe');
      
      if (error) throw error;
      
      // Process the results to get the roles in proper order
      return Array.isArray(data) ? 
        data.map(item => item.role as Role)
          .sort((a, b) => {
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
          }) : 
        [
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
        ] as Role[];
    } catch (funcError) {
      console.log('Function not available, using fallback');
      throw funcError;
    }
  } catch (err) {
    console.error('Error in fetchUserRoles:', err);
    // Return default roles as fallback - MANTENER COMPATIBILIDAD
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
    // Mantener query directo para compatibilidad
    const { data, error } = await supabase
      .from('role_permissions')
      .select('id, role, permission_type, permission_id, allowed');
      
    if (error) {
      console.error('Error fetching permissions:', error);
      throw error;
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
    // Intentar función optimizada con fallback
    try {
      const { data: allUserRoles, error: rolesError } = await supabase
        .rpc('get_all_user_roles_safe');
        
      if (rolesError) throw rolesError;
      
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      // Map roles to users
      const roleMap = new Map();
      if (Array.isArray(allUserRoles)) {
        allUserRoles.forEach((ur: any) => {
          roleMap.set(ur.user_id, ur.role);
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
    } catch (funcError) {
      console.log('Function not available, using direct query fallback');
      throw funcError;
    }
  } catch (err) {
    console.error('Error in fetchUsersWithRoles:', err);
    return [];
  }
};
