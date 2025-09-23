import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VehicleData {
  marca: string;
  modelo: string;
  placa: string;
  color: string;
  fuente: string;
}

export const useVehicleDataWithFallback = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getVehicleData = async (custodioNombre: string): Promise<VehicleData | null> => {
    if (!custodioNombre || custodioNombre.trim() === '') {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_custodio_vehicle_data', {
        p_custodio_nombre: custodioNombre.trim()
      }) as { data: VehicleData[] | null; error: any };

      if (error) {
        console.error('Error fetching vehicle data:', error);
        setError(error.message);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (err) {
      console.error('Error in getVehicleData:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener datos del vehículo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getVehicleData,
    loading,
    error
  };
};