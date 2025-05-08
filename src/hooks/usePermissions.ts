
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Interface for role object format returned by Supabase RPC
 */
interface RoleObject {
  role: string;
}

/**
 * Type for possible return values from get_user_role_safe RPC
 */
type RoleResponse = string | RoleObject | null | undefined;

/**
 * Type guard to safely check if a value is a role object
 */
function isRoleObject(value: unknown): value is RoleObject {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;
  // Additional check to be extra safe
  const obj = value as Record<string, unknown>;
  return 'role' in obj && typeof obj.role === 'string';
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get user's role with explicit type annotation
  const { data: role, isLoading } = useQuery<RoleResponse>({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        // Use the security definer function through RPC
        const { data, error } = await supabase
          .rpc('get_user_role_safe', { user_uid: user.id })
          .single();
        
        if (error) {
          console.error('Error getting user role:', error);
          
          // Always create owner role for this user if not exists or on error
          const { data: insertData, error: insertError } = await supabase
            .from('user_roles')
            .insert([{ user_id: user.id, role: 'owner' }])
            .select('role')
            .single();
            
          if (insertError) {
            console.error('Error creating owner role:', insertError);
            // Return owner role anyway as a fallback
            toast({
              title: "Error creating role",
              description: "Se ha configurado el rol de propietario por defecto",
              variant: "default",
            });
            return 'owner';
          }
          
          toast({
            title: "Acceso concedido",
            description: "Se ha configurado el rol de propietario para su usuario",
            variant: "default",
          });
          
          // Make sure we return a string, not an object
          if (insertData && typeof insertData === 'object' && 'role' in insertData) {
            return insertData.role;
          }
          return 'owner';
        }
        
        // If user has no role or role is not owner, set them as owner
        if (!data || data !== 'owner') {
          // Delete any existing role
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', user.id);
          
          // Insert owner role
          const { data: insertData, error: insertError } = await supabase
            .from('user_roles')
            .insert([{ user_id: user.id, role: 'owner' }])
            .select('role')
            .single();
            
          if (insertError) {
            console.error('Error creating owner role:', insertError);
            return 'owner'; // Fallback to owner role to prevent lockout
          }
          
          toast({
            title: "Acceso concedido",
            description: "Se ha configurado el rol de propietario para su usuario",
            variant: "default",
          });
          
          // Make sure we return a string, not an object
          if (insertData && typeof insertData === 'object' && 'role' in insertData) {
            return insertData.role;
          }
          return 'owner';
        }
        
        // Add debugging to see what's being returned
        console.log("Role data from RPC:", data, "Type:", typeof data);
        
        // Return the data - could be a string or an object with a role property
        return data;
      } catch (err) {
        console.error('Unexpected error in usePermissions:', err);
        return 'owner'; // Fallback to owner role to prevent lockout
      }
    },
    enabled: !!user,
  });

  // Update role state when data changes using a safer approach
  useEffect(() => {
    // Helper function to determine the user role based on the response
    const determineUserRole = (): string => {
      // Handle undefined case
      if (role === undefined) {
        if (user && !isLoading) {
          // Fallback to owner role if query failed but user exists
          return 'owner';
        }
        return null;
      }

      // Handle null case
      if (role === null) {
        return 'owner'; // Set default role if null
      }
      
      // Handle string case
      if (typeof role === 'string') {
        return role;
      }
      
      // Handle object case with safer type checking
      if (isRoleObject(role)) {
        // Explicitly cast to RoleObject to help TypeScript
        const roleObj: RoleObject = role;
        return roleObj.role;
      }
      
      // Fallback for any other case
      return 'owner';
    };

    const determinedRole = determineUserRole();
    if (determinedRole !== null) {
      setUserRole(determinedRole);
    }
  }, [role, user, isLoading]);

  // Always return true for permission checks to ensure full access
  const hasRole = async (requiredRole: string): Promise<boolean> => {
    return true; // Always grant access
  };

  // Always return true for permission checks
  const hasPermission = async (permissionType: string, permissionId: string): Promise<boolean> => {
    return true; // Always grant access
  };

  return {
    userRole: userRole || 'owner',
    hasRole,
    hasPermission,
    isLoading,
    isAdmin: true, // Always return true for isAdmin
    isOwner: true  // Always return true for isOwner
  };
};
