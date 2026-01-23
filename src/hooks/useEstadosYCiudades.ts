import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [estadosReady, setEstadosReady] = useState(false);
  
  // Use refs to avoid stale closures in callbacks
  const ciudadesRef = useRef<Ciudad[]>([]);
  const ciudadesReadyRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    ciudadesRef.current = ciudades;
  }, [ciudades]);

  useEffect(() => {
    ciudadesReadyRef.current = ciudadesReady;
  }, [ciudadesReady]);

  // Cargar estados al inicializar
  useEffect(() => {
    fetchEstados();
    fetchCiudades();
  }, []);

  const fetchEstados = async () => {
    try {
      setLoadingEstados(true);
      setEstadosReady(false);
      const { data, error } = await supabase
        .from('estados')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setEstados(data || []);
      setEstadosReady(true);
      console.log('✅ Estados cargados:', data?.length || 0);
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
      ciudadesReadyRef.current = false;
      
      const { data, error } = await supabase
        .from('ciudades')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      
      const ciudadesData = data || [];
      setCiudades(ciudadesData);
      ciudadesRef.current = ciudadesData;
      setCiudadesReady(true);
      ciudadesReadyRef.current = true;
      console.log('✅ Ciudades cargadas:', ciudadesData.length);
    } catch (error) {
      console.error('Error fetching ciudades:', error);
      toast.error('Error al cargar ciudades');
    } finally {
      setLoadingCiudades(false);
    }
  };

  // Use ref-based filtering to avoid stale closure issues
  const getCiudadesByEstado = useCallback((estadoId: string) => {
    console.log('🔍 getCiudadesByEstado:', { 
      estadoId, 
      ciudadesCount: ciudadesRef.current.length, 
      ready: ciudadesReadyRef.current 
    });
    
    if (!estadoId) {
      console.warn('⚠️ estadoId vacío');
      setCiudadesFiltradas([]);
      return [];
    }

    // Wait for ciudades to be ready
    if (!ciudadesReadyRef.current) {
      console.warn('⚠️ Ciudades aún no listas, esperando...');
      setCiudadesFiltradas([]);
      return [];
    }
    
    const ciudadesDelEstado = ciudadesRef.current.filter(ciudad => ciudad.estado_id === estadoId);
    console.log('✅ Ciudades filtradas para estado:', ciudadesDelEstado.length);
    setCiudadesFiltradas(ciudadesDelEstado);
    return ciudadesDelEstado;
  }, []); // No dependencies needed - uses refs

  const getEstadoById = useCallback((estadoId: string) => {
    return estados.find(estado => estado.id === estadoId);
  }, [estados]);

  const getCiudadById = useCallback((ciudadId: string) => {
    return ciudadesRef.current.find(ciudad => ciudad.id === ciudadId);
  }, []);

  return {
    estados,
    ciudades,
    ciudadesFiltradas,
    loading: loadingEstados, // Backward compatible
    loadingEstados,
    loadingCiudades,
    estadosReady,
    ciudadesReady,
    getCiudadesByEstado,
    getEstadoById,
    getCiudadById,
    fetchEstados,
    fetchCiudades
  };
};
