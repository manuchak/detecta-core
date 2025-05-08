
import { useQuery } from '@tanstack/react-query';
import { Role } from '@/types/roleTypes';

export const useAvailableRoles = () => {
  const { data: roles } = useQuery({
    queryKey: ['available-roles'],
    queryFn: async () => {
      // Instead of using RPC, we'll use a direct query or hardcoded list
      // since the RPC function might not exist yet
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
  });

  return { roles };
};
