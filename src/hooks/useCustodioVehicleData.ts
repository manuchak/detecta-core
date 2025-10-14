import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VehicleData {
  marca: string;
  modelo: string;
  placa: string;
  color: string;
  tipo_custodio: 'custodio_vehiculo' | 'armado_vehiculo' | 'armado' | 'abordo';
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
      // First check if the RPC function exists, if not fall back to basic data
      const { data, error } = await supabase.rpc('get_custodio_vehicle_data', {
        p_custodio_nombre: nombre.trim()
      });

      if (error) {
        console.warn('RPC function not available, using fallback data:', error);
        // Fallback: return basic vehicle info
        setVehicleData({
          marca: 'No especificado',
          modelo: 'No especificado', 
          placa: 'Sin placa',
          color: 'No especificado',
          tipo_custodio: 'custodio_vehiculo',
          fuente: 'fallback'
        });
        return;
      }

      if (data && data.length > 0) {
        setVehicleData(data[0]);
      } else {
        setVehicleData({
          marca: 'No especificado',
          modelo: 'No especificado',
          placa: 'Sin placa', 
          color: 'No especificado',
          tipo_custodio: 'custodio_vehiculo',
          fuente: 'fallback'
        });
      }
    } catch (err) {
      console.error('Error fetching vehicle data:', err);
      setError('Error al obtener datos del vehículo');
      // Provide fallback data instead of null to prevent UI errors
      setVehicleData({
        marca: 'No especificado',
        modelo: 'No especificado',
        placa: 'Sin placa',
        color: 'No especificado',
        tipo_custodio: 'custodio_vehiculo',
        fuente: 'error_fallback'
      });
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
    if (!vehicleData) return 'Vehículo pendiente de registro';
    
    const { marca, modelo, placa, fuente } = vehicleData;
    
    if (marca === 'No especificado' && modelo === 'No especificado') {
      return 'Vehículo pendiente de registro';
    }
    
    return `${marca} ${modelo}${placa !== 'Sin placa' ? ` (${placa})` : ''}`;
  };

  const hasVehicleData = (): boolean => {
    return vehicleData !== null && 
           vehicleData.marca !== 'No especificado' && 
           vehicleData.modelo !== 'No especificado';
  };

  const shouldShowVehicle = (): boolean => {
    if (!vehicleData) return false;
    
    // Solo mostrar si tiene el tipo correcto
    const hasVehicleType = ['custodio_vehiculo', 'armado_vehiculo'].includes(vehicleData.tipo_custodio);
    if (!hasVehicleType) return false;
    
    // Y además tiene datos reales (no fallback)
    const hasRealData = vehicleData.marca !== 'No especificado' && 
                        vehicleData.modelo !== 'No especificado';
    
    return hasRealData;
  };

  const isHybridCustodian = (): boolean => {
    return vehicleData?.tipo_custodio === 'armado_vehiculo';
  };

  return {
    vehicleData,
    loading,
    error,
    formatVehicleInfo,
    hasVehicleData,
    shouldShowVehicle,
    isHybridCustodian,
    refetch: () => fetchVehicleData(custodioNombre)
  };
}