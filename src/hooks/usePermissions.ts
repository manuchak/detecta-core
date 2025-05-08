
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
          return insertData?.role || 'owner';
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
          return insertData?.role || 'owner';
        }
        
        return data;
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
      // First, handle the case where role is null
      if (role === null) {
        setUserRole('owner'); // Set default role if null
        return;
      }
      
      // Then safely handle object vs string cases
      if (typeof role === 'object' && role !== null) {
        // It's an object, extract the role property if it exists
        if ('role' in role) {
          setUserRole(role.role as string);
        } else {
          // Object without role property, fallback to owner
          setUserRole('owner');
        }
      } else {
        // It's a string or some other primitive, cast to string
        setUserRole(role as string);
      }
    } else if (user && !isLoading) {
      // Fallback to owner role if query failed but user exists
      setUserRole('owner');
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
