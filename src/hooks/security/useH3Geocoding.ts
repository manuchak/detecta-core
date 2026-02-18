import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface H3Location {
  address: string;
  lat: number;
  lng: number;
  h3Index: string;
  h3Resolution?: number;
}

interface UseH3GeocodingReturn {
  geocode: (address: string, resolution?: number) => Promise<H3Location | null>;
  geocodeFromCoordinates: (lat: number, lng: number, address: string, resolution?: number) => Promise<H3Location | null>;
  isLoading: boolean;
  error: string | null;
  lastResult: H3Location | null;
}

export const useH3Geocoding = (): UseH3GeocodingReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<H3Location | null>(null);

  const geocode = async (address: string, resolution: number = 8): Promise<H3Location | null> => {
    if (!address || address.trim() === '') {
      setError('La dirección no puede estar vacía');
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('geocode-to-h3', {
        body: { address, resolution }
      });
      if (funcError) throw new Error(funcError.message);
      if (!data || !data.h3Index) throw new Error('No se pudo obtener el índice H3');

      const location: H3Location = {
        address: data.address || address, lat: data.lat, lng: data.lng,
        h3Index: data.h3Index, h3Resolution: data.h3Resolution,
      };
      setLastResult(location);
      return location;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al geocodificar dirección');
      console.error('Error en useH3Geocoding:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const geocodeFromCoordinates = async (lat: number, lng: number, address: string, resolution: number = 8): Promise<H3Location | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('geocode-to-h3', {
        body: { lat, lng, resolution }
      });
      if (funcError) throw new Error(funcError.message);
      if (!data || !data.h3Index) throw new Error('No se pudo obtener el índice H3');

      const location: H3Location = {
        address, lat, lng, h3Index: data.h3Index, h3Resolution: data.h3Resolution || resolution,
      };
      setLastResult(location);
      return location;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener H3 desde coordenadas');
      console.error('Error en geocodeFromCoordinates:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { geocode, geocodeFromCoordinates, isLoading, error, lastResult };
};