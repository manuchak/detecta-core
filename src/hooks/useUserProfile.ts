// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
  phone: string | null;
  role: string;
}

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async (): Promise<UserProfile> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('No authenticated user');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, email, phone')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) throw roleError;

      return {
        ...profile,
        role: userRole?.role || 'user'
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};