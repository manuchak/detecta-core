
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Role } from '@/types/roleTypes';

export const useAvailableRoles = () => {
  const { data: roles } = useQuery({
    queryKey: ['available-roles'],
    queryFn: async () => {
      // Use our safe RPC function that doesn't cause recursion
      const { data, error } = await supabase
        .rpc('get_user_roles_safe');
      
      if (error) {
        console.error('Error fetching roles:', error);
        // Fallback to hardcoded roles if the RPC fails
        const availableRoles: Role[] = [
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
        
        return availableRoles;
      }

      // Extract unique roles from the result
      const uniqueRoles = new Set<Role>();
      data?.forEach(roleData => {
        uniqueRoles.add(roleData.role as Role);
      });

      // If no roles found, return default roles
      if (uniqueRoles.size === 0) {
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
        ] as Role[];
      }

      return Array.from(uniqueRoles);
    }
  });

  return { roles };
};
