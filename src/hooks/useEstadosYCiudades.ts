import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Estado {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
}

interface Ciudad {
  id: string;
  nombre: string;
  estado_id: string;
  activo: boolean;
}

export const useEstadosYCiudades = () => {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [ciudadesFiltradas, setCiudadesFiltradas] = useState<Ciudad[]>([]);
  const [loadingEstados, setLoadingEstados] = useState(true);
  const [loadingCiudades, setLoadingCiudades] = useState(true);
  const [ciudadesReady, setCiudadesReady] = useState(false);

  // Cargar estados al inicializar
  useEffect(() => {
    fetchEstados();
    fetchCiudades();
  }, []);

  const fetchEstados = async () => {
    try {
      setLoadingEstados(true);
      const { data, error } = await supabase
        .from('estados')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setEstados(data || []);
    } catch (error) {
      console.error('Error fetching estados:', error);
      toast.error('Error al cargar estados');
    } finally {
      setLoadingEstados(false);
    }
  };

  const fetchCiudades = async () => {
    try {
      setLoadingCiudades(true);
      setCiudadesReady(false);
      const { data, error } = await supabase
        .from('ciudades')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setCiudades(data || []);
      setCiudadesReady(true);
      console.log('✅ Ciudades cargadas:', data?.length || 0);
    } catch (error) {
      console.error('Error fetching ciudades:', error);
      toast.error('Error al cargar ciudades');
    } finally {
      setLoadingCiudades(false);
    }
  };

  const getCiudadesByEstado = useCallback((estadoId: string) => {
    console.log('🔍 getCiudadesByEstado:', { estadoId, ciudadesCount: ciudades.length, ready: ciudadesReady });
    
    if (!ciudadesReady || !estadoId) {
      console.warn('⚠️ Ciudades aún no listas o estadoId vacío');
      setCiudadesFiltradas([]);
      return [];
    }
    
    const ciudadesDelEstado = ciudades.filter(ciudad => ciudad.estado_id === estadoId);
    console.log('✅ Ciudades filtradas para estado:', ciudadesDelEstado.length);
    setCiudadesFiltradas(ciudadesDelEstado);
    return ciudadesDelEstado;
  }, [ciudades, ciudadesReady]);

  const getEstadoById = useCallback((estadoId: string) => {
    return estados.find(estado => estado.id === estadoId);
  }, [estados]);

  const getCiudadById = useCallback((ciudadId: string) => {
    return ciudades.find(ciudad => ciudad.id === ciudadId);
  }, [ciudades]);

  return {
    estados,
    ciudades,
    ciudadesFiltradas,
    loading: loadingEstados, // Backward compatible
    loadingEstados,
    loadingCiudades,
    ciudadesReady,
    getCiudadesByEstado,
    getEstadoById,
    getCiudadById,
    fetchEstados,
    fetchCiudades
  };
};
