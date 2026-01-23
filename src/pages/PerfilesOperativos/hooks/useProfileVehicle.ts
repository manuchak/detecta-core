import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileVehicle {
  id: string;
  marca: string | null;
  modelo: string | null;
  placa: string | null;
  color: string | null;
  es_principal: boolean;
}

export function useProfileVehicle(custodioId: string | undefined) {
  return useQuery({
    queryKey: ['profile-vehicle', custodioId],
    queryFn: async () => {
      if (!custodioId) return null;
      
      const { data, error } = await supabase
        .from('custodios_vehiculos')
        .select('id, marca, modelo, placa, color, es_principal')
        .eq('custodio_id', custodioId)
        .eq('estado', 'activo')
        .order('es_principal', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching vehicle:', error);
        return null;
      }
      
      return data as ProfileVehicle | null;
    },
    enabled: !!custodioId
  });
}
