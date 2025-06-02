
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
        const { data, error } = await supabase
          .from('estados')
          .select('*')
          .order('nombre');
        
        if (error) {
          console.error('Error fetching estados:', error);
          throw error;
        }
        
        console.log('Estados fetched:', data);
        setEstados(data || []);
      } catch (err) {
        console.error('Error in fetchEstados:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar estados');
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
      return;
    }

    const fetchCiudades = async () => {
      try {
        setLoading(true);
        console.log('Fetching ciudades for estado:', estadoId);
        const { data, error } = await supabase
          .from('ciudades')
          .select('*')
          .eq('estado_id', estadoId)
          .order('nombre');
        
        if (error) {
          console.error('Error fetching ciudades:', error);
          throw error;
        }
        
        console.log('Ciudades fetched:', data);
        setCiudades(data || []);
      } catch (err) {
        console.error('Error in fetchCiudades:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar ciudades');
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
      return;
    }

    const fetchZonas = async () => {
      try {
        setLoading(true);
        console.log('Fetching zonas for ciudad:', ciudadId);
        const { data, error } = await supabase
          .from('zonas_trabajo')
          .select('*')
          .eq('ciudad_id', ciudadId)
          .order('nombre');
        
        if (error) {
          console.error('Error fetching zonas:', error);
          throw error;
        }
        
        console.log('Zonas fetched:', data);
        setZonas(data || []);
      } catch (err) {
        console.error('Error in fetchZonas:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar zonas');
      } finally {
        setLoading(false);
      }
    };

    fetchZonas();
  }, [ciudadId]);

  return { zonas, loading, error };
};
