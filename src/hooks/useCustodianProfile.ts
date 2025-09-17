// @ts-nocheck
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
  const { user, userRole, loading: authLoading } = useStableAuth();
  const [profile, setProfile] = useState<CustodianProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      fetchProfile();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Si el usuario es admin, crear un perfil mock para demo
      if (userRole === 'admin' || userRole === 'owner') {
        setProfile({
          id: user?.id || '',
          email: user?.email || 'admin@admin.com',
          display_name: 'Admin Demo',
          phone: '+52 55 1234 5678',
          estado: 'CDMX',
          ciudad: 'Ciudad de México',
          disponibilidad: true,
          fecha_ultima_actividad: new Date().toISOString(),
          is_verified: true
        });
        setLoading(false);
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching custodian profile:', error);
        // Para usuarios sin perfil, crear uno básico
        setProfile({
          id: user?.id || '',
          email: user?.email || '',
          display_name: user?.user_metadata?.display_name || user?.email || '',
          phone: user?.phone || '',
          estado: 'CDMX',
          ciudad: 'Ciudad de México',
          disponibilidad: true,
          fecha_ultima_actividad: new Date().toISOString(),
          is_verified: false
        });
      } else {
        setProfile({
          id: profileData.id,
          email: profileData.email,
          display_name: profileData.display_name || profileData.email,
          phone: profileData.phone,
          estado: 'CDMX',
          ciudad: 'Ciudad de México',
          disponibilidad: true,
          fecha_ultima_actividad: profileData.last_login,
          is_verified: profileData.is_verified || false
        });
      }

    } catch (error) {
      console.error('Error fetching custodian profile:', error);
      // Crear perfil básico en caso de error
      setProfile({
        id: user?.id || '',
        email: user?.email || '',
        display_name: 'Usuario',
        phone: '',
        estado: 'CDMX',
        ciudad: 'Ciudad de México',
        disponibilidad: true,
        fecha_ultima_actividad: new Date().toISOString(),
        is_verified: false
      });
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