import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';

interface ArmadoProfile {
  id: string;
  armado_operativo_id: string | null;
  email: string;
  display_name: string;
  phone: string;
  zona_base: string | null;
  disponibilidad: string;
  rating_promedio: number | null;
  numero_servicios: number | null;
  is_verified: boolean;
}

export const useArmadoProfile = () => {
  const { user, userRole, loading: authLoading } = useStableAuth();
  const [profile, setProfile] = useState<ArmadoProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const fetchProfile = useCallback(async (silent = false) => {
    if (!user) return;
    
    try {
      if (!silent && !profileRef.current) setLoading(true);

      // Admin mock
      if (userRole === 'admin' || userRole === 'owner') {
        setProfile({
          id: user.id,
          armado_operativo_id: null,
          email: user.email || '',
          display_name: 'Admin Demo',
          phone: '+52 55 1234 5678',
          zona_base: 'CDMX',
          disponibilidad: 'disponible',
          rating_promedio: 4.5,
          numero_servicios: 0,
          is_verified: true
        });
        setLoading(false);
        return;
      }

      // Get profile from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const phone = profileData?.phone || user.phone || '';

      // Try to find armado_operativo by phone
      let armadoData = null;
      if (phone) {
        const cleanPhone = phone.replace(/\s+/g, '').replace(/[()-]/g, '');
        const { data } = await supabase
          .from('armados_operativos')
          .select('id, nombre, zona_base, disponibilidad, rating_promedio, numero_servicios, telefono')
          .or(`telefono.eq.${cleanPhone},telefono.ilike.%${cleanPhone}%`)
          .limit(1)
          .maybeSingle();
        armadoData = data;
      }

      setProfile({
        id: user.id,
        armado_operativo_id: armadoData?.id || null,
        email: profileData?.email || user.email || '',
        display_name: armadoData?.nombre || profileData?.display_name || user.email || '',
        phone,
        zona_base: armadoData?.zona_base || null,
        disponibilidad: armadoData?.disponibilidad || 'disponible',
        rating_promedio: armadoData?.rating_promedio || null,
        numero_servicios: armadoData?.numero_servicios || 0,
        is_verified: profileData?.is_verified || false
      });
    } catch (error) {
      console.error('Error fetching armado profile:', error);
      setProfile({
        id: user.id,
        armado_operativo_id: null,
        email: user.email || '',
        display_name: 'Armado',
        phone: '',
        zona_base: null,
        disponibilidad: 'disponible',
        rating_promedio: null,
        numero_servicios: 0,
        is_verified: false
      });
    } finally {
      setLoading(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchProfile(!!profileRef.current);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
};
