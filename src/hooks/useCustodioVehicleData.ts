import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VehicleData {
  marca: string;
  modelo: string;
  placa: string;
  color: string;
  fuente: string;
}

export function useCustodioVehicleData(custodioNombre?: string) {
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicleData = async (nombre?: string) => {
    if (!nombre || nombre.trim() === '') {
      setVehicleData(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_custodio_vehicle_data', {
        p_custodio_nombre: nombre.trim()
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setVehicleData(data[0]);
      } else {
        setVehicleData(null);
      }
    } catch (err) {
      console.error('Error fetching vehicle data:', err);
      setError('Error al obtener datos del vehículo');
      setVehicleData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (custodioNombre) {
      fetchVehicleData(custodioNombre);
    }
  }, [custodioNombre]);

  const formatVehicleInfo = (): string => {
    if (!vehicleData) return 'Vehículo no especificado';
    
    const { marca, modelo, placa } = vehicleData;
    
    if (marca === 'No especificado' && modelo === 'No especificado') {
      return 'Vehículo no especificado';
    }
    
    return `${marca} ${modelo}${placa !== 'Sin placa' ? ` (${placa})` : ''}`;
  };

  return {
    vehicleData,
    loading,
    error,
    formatVehicleInfo,
    refetch: () => fetchVehicleData(custodioNombre)
  };
}