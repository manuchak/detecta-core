import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';

interface CustodianProfile {
  id: string;
  email: string;
  display_name: string;
  phone?: string;
  estado?: string;
  ciudad?: string;
  disponibilidad: boolean;
  fecha_ultima_actividad?: string;
  is_verified: boolean;
}

export const useCustodianProfile = () => {
  const { user, loading: authLoading } = useStableAuth();
  const [profile, setProfile] = useState<CustodianProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile({
        id: profileData.id,
        email: profileData.email,
        display_name: profileData.display_name || profileData.email,
        phone: profileData.phone,
        estado: 'CDMX', // Default value - could be fetched from profile
        ciudad: 'Ciudad de México', // Default value
        disponibilidad: true, // Default value - would be stored in profile
        fecha_ultima_actividad: profileData.last_login,
        is_verified: profileData.is_verified || false
      });

    } catch (error) {
      console.error('Error fetching custodian profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (disponibilidad: boolean) => {
    if (!profile) return false;

    try {
      // For now, just update local state
      // Later we can add a specific column to profiles table
      setProfile({ ...profile, disponibilidad });
      return true;
    } catch (error) {
      console.error('Error updating availability:', error);
      return false;
    }
  };

  const updateProfile = async (updates: Partial<CustodianProfile>) => {
    if (!profile) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.display_name,
          phone: updates.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  return {
    profile,
    loading,
    updateAvailability,
    updateProfile,
    refetch: fetchProfile
  };
};