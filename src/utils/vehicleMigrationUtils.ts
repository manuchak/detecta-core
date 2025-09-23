import { supabase } from '@/integrations/supabase/client';

interface VehicleDataWithFallback {
  marca: string;
  modelo: string;
  placa: string;
  color: string;
  fuente: 'custodios_vehiculos' | 'servicios_custodia' | 'none';
}

/**
 * Obtiene datos de vehículo con sistema de fallback inteligente
 * 1. Primero busca en custodios_vehiculos (vehículo principal)
 * 2. Si no encuentra, busca en servicios_custodia (último servicio)
 * 3. Si no encuentra nada, retorna null
 */
export const getVehicleDataWithFallback = async (
  custodioNombre: string
): Promise<VehicleDataWithFallback | null> => {
  if (!custodioNombre || custodioNombre.trim() === '') {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('get_custodio_vehicle_data', {
      p_custodio_nombre: custodioNombre.trim()
    });

    if (error) {
      console.error('Error fetching vehicle data:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0] as VehicleDataWithFallback;
  } catch (err) {
    console.error('Error in getVehicleDataWithFallback:', err);
    return null;
  }
};

/**
 * Ejecuta la migración de datos de vehículos
 */
export const migrateVehicleData = async (): Promise<{ success: boolean; recordCount?: number; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('migrate_vehicle_data_from_services');
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, recordCount: data || 0 };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido en migración';
    return { success: false, error: errorMessage };
  }
};

/**
 * Formatea los datos de vehículo para mostrar al usuario
 */
export const formatVehicleInfo = (vehicleData: VehicleDataWithFallback | null): {
  displayText: string;
  marca?: string;
  modelo?: string;
  placa?: string;
  color?: string;
} => {
  if (!vehicleData) {
    return { displayText: 'Vehículo por confirmar' };
  }

  const parts = [];
  
  if (vehicleData.marca && vehicleData.marca !== 'No especificado') {
    parts.push(vehicleData.marca);
  }
  
  if (vehicleData.modelo && vehicleData.modelo !== 'No especificado') {
    parts.push(vehicleData.modelo);
  }
  
  if (vehicleData.color && vehicleData.color !== 'No especificado') {
    parts.push(vehicleData.color);
  }

  const displayText = parts.length > 0 ? parts.join(' ') : 'Vehículo por confirmar';
  
  return {
    displayText,
    marca: vehicleData.marca !== 'No especificado' ? vehicleData.marca : undefined,
    modelo: vehicleData.modelo !== 'No especificado' ? vehicleData.modelo : undefined,
    placa: vehicleData.placa !== 'Sin placa' ? vehicleData.placa : undefined,
    color: vehicleData.color !== 'No especificado' ? vehicleData.color : undefined
  };
};