import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustodianVehicle {
  id: string;
  custodio_id: string;
  marca: string;
  modelo: string;
  año?: number;
  color?: string;
  placa: string;
  numero_serie?: string;
  es_principal: boolean;
  estado: 'activo' | 'inactivo' | 'mantenimiento';
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export function useCustodianVehicles(custodioId?: string) {
  const [vehicles, setVehicles] = useState<CustodianVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVehicles = async (custodianId?: string) => {
    if (!custodianId) {
      setVehicles([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('custodios_vehiculos')
        .select('*')
        .eq('estado', 'activo')
        .order('es_principal', { ascending: false })
        .order('created_at', { ascending: false });

      if (custodianId) {
        query = query.eq('custodio_id', custodianId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setVehicles(data || []);
    } catch (err) {
      console.error('Error loading custodian vehicles:', err);
      setError('Error al cargar vehículos del custodio');
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (vehicleData: Omit<CustodianVehicle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // If this is set as principal, unset any existing principal vehicles
      if (vehicleData.es_principal) {
        await supabase
          .from('custodios_vehiculos')
          .update({ es_principal: false })
          .eq('custodio_id', vehicleData.custodio_id)
          .eq('es_principal', true);
      }

      const { data, error } = await supabase
        .from('custodios_vehiculos')
        .insert(vehicleData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Vehículo agregado exitosamente');
      loadVehicles(vehicleData.custodio_id);
      return data;
    } catch (err) {
      console.error('Error adding vehicle:', err);
      toast.error('Error al agregar vehículo');
      throw err;
    }
  };

  const updateVehicle = async (vehicleId: string, updates: Partial<CustodianVehicle>) => {
    try {
      const { data, error } = await supabase
        .from('custodios_vehiculos')
        .update(updates)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Vehículo actualizado exitosamente');
      loadVehicles(updates.custodio_id);
      return data;
    } catch (err) {
      console.error('Error updating vehicle:', err);
      toast.error('Error al actualizar vehículo');
      throw err;
    }
  };

  const setPrincipalVehicle = async (vehicleId: string, custodioId: string) => {
    try {
      // First, unset all principal vehicles for this custodian
      await supabase
        .from('custodios_vehiculos')
        .update({ es_principal: false })
        .eq('custodio_id', custodioId);

      // Then set the selected vehicle as principal
      await supabase
        .from('custodios_vehiculos')
        .update({ es_principal: true })
        .eq('id', vehicleId);

      toast.success('Vehículo principal actualizado');
      loadVehicles(custodioId);
    } catch (err) {
      console.error('Error setting principal vehicle:', err);
      toast.error('Error al establecer vehículo principal');
    }
  };

  const getPrincipalVehicle = (custodianId: string): CustodianVehicle | null => {
    return vehicles.find(v => v.custodio_id === custodianId && v.es_principal) || null;
  };

  useEffect(() => {
    if (custodioId) {
      loadVehicles(custodioId);
    }
  }, [custodioId]);

  return {
    vehicles,
    loading,
    error,
    addVehicle,
    updateVehicle,
    setPrincipalVehicle,
    getPrincipalVehicle,
    refetch: () => loadVehicles(custodioId)
  };
}