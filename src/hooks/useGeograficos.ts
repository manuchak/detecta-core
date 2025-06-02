
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Estado {
  id: string;
  nombre: string;
  codigo: string;
}

interface Ciudad {
  id: string;
  nombre: string;
  estado_id: string;
}

interface ZonaTrabajo {
  id: string;
  nombre: string;
  ciudad_id: string;
  descripcion?: string;
}

export const useEstados = () => {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        console.log('Fetching estados...');
        setLoading(true);
        setError(null);
        
        // Usar la función segura que creamos con tipo explícito
        const { data, error } = await supabase.rpc('get_estados_safe') as {
          data: Estado[] | null;
          error: any;
        };
        
        if (error) {
          console.error('Error fetching estados:', error);
          setError(error.message);
          return;
        }
        
        console.log('Estados fetched successfully:', data);
        setEstados(data || []);
      } catch (err) {
        console.error('Error in fetchEstados:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar estados';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEstados();
  }, []);

  return { estados, loading, error };
};

export const useCiudades = (estadoId: string | null) => {
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!estadoId) {
      setCiudades([]);
      setLoading(false);
      return;
    }

    const fetchCiudades = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching ciudades for estado:', estadoId);
        
        // Usar la función segura que creamos con tipo explícito
        const { data, error } = await supabase.rpc('get_ciudades_safe', {
          estado_uuid: estadoId
        }) as {
          data: Ciudad[] | null;
          error: any;
        };
        
        if (error) {
          console.error('Error fetching ciudades:', error);
          setError(error.message);
          return;
        }
        
        console.log('Ciudades fetched:', data);
        setCiudades(data || []);
      } catch (err) {
        console.error('Error in fetchCiudades:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar ciudades';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCiudades();
  }, [estadoId]);

  return { ciudades, loading, error };
};

export const useZonasTrabajo = (ciudadId: string | null) => {
  const [zonas, setZonas] = useState<ZonaTrabajo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ciudadId) {
      setZonas([]);
      setLoading(false);
      return;
    }

    const fetchZonas = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching zonas for ciudad:', ciudadId);
        
        // Usar la función segura que creamos con tipo explícito
        const { data, error } = await supabase.rpc('get_zonas_trabajo_safe', {
          ciudad_uuid: ciudadId
        }) as {
          data: ZonaTrabajo[] | null;
          error: any;
        };
        
        if (error) {
          console.error('Error fetching zonas:', error);
          setError(error.message);
          return;
        }
        
        console.log('Zonas fetched:', data);
        setZonas(data || []);
      } catch (err) {
        console.error('Error in fetchZonas:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar zonas';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchZonas();
  }, [ciudadId]);

  return { zonas, loading, error };
};
