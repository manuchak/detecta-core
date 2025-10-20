import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      const { data, error } = await supabase.rpc('get_custodio_vehicle_data', {
        p_custodio_nombre: nombre.trim()
      });

      if (error) {
        console.warn('RPC function error:', error);
        setVehicleData({
          marca: 'No especificado',
          modelo: 'No especificado', 
          placa: 'Sin placa',
          color: 'No especificado',
          tipo_custodio: 'custodio_vehiculo',
          fuente: 'error_fallback'
        });
        return;
      }

      // Si no hay datos o fuente es 'none', intentar migración automática
      if (!data || data.length === 0 || data[0].fuente === 'none') {
        console.log('No vehicle data found, attempting migration for:', nombre);
        
        try {
          const { data: migrationData, error: migrationError } = await supabase.rpc(
            'migrate_vehicle_from_servicios_custodia',
            { p_custodio_nombre: nombre.trim() }
          );

          if (!migrationError && migrationData?.success) {
            console.log('Migration successful, refetching vehicle data');
            toast.success(`Vehículo migrado: ${migrationData.marca} ${migrationData.modelo}`);
            
            // Re-fetch después de migración exitosa
            const { data: newData, error: newError } = await supabase.rpc('get_custodio_vehicle_data', {
              p_custodio_nombre: nombre.trim()
            });
            
            if (!newError && newData && newData.length > 0) {
              setVehicleData(newData[0]);
              return;
            }
          } else {
            console.log('Migration not successful:', migrationData?.message);
          }
        } catch (migrationErr) {
          console.log('Migration attempt failed:', migrationErr);
        }
        
        // Si la migración falla o no hay datos, usar fallback
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
      }
    } catch (err) {
      console.error('Error fetching vehicle data:', err);
      setError('Error al obtener datos del vehículo');
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