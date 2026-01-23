
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/validators';

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        console.log('Fetching estados...');
        setLoading(true);
        setError(null);
        setReady(false);
        
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
        setReady(true);
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

  return { estados, loading, error, ready };
};

export const useCiudades = (estadoId: string | null) => {
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  // ✅ FIX: Loading debe iniciar como true si hay estadoId válido
  const [loading, setLoading] = useState(!!estadoId && isValidUUID(estadoId));
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  
  // Track previous estadoId to detect real changes
  const prevEstadoIdRef = useRef<string | null>(undefined as any); // Start as undefined, not null
  const fetchInProgressRef = useRef(false);

  // ✅ Función refetch expuesta para reintentos manuales
  const refetch = useCallback(() => {
    if (estadoId && isValidUUID(estadoId)) {
      console.log('🔄 useCiudades: Manual refetch triggered for estadoId:', estadoId);
      prevEstadoIdRef.current = null; // Force refetch
      fetchInProgressRef.current = false;
      setReady(false);
      setLoading(true);
      setError(null);
    }
  }, [estadoId]);

  useEffect(() => {
    const isSameAsPrevious = estadoId === prevEstadoIdRef.current;
    const hasDataAlready = ciudades.length > 0 && ready;
    
    console.log('🏙️ useCiudades triggered:', {
      estadoId,
      prevEstadoId: prevEstadoIdRef.current,
      isSameAsPrevious,
      hasDataAlready,
      fetchInProgress: fetchInProgressRef.current,
      isValidUUID: estadoId ? isValidUUID(estadoId) : false
    });
    
    if (isSameAsPrevious && hasDataAlready) {
      console.log('⏭️ useCiudades: Skipping fetch - same estadoId and data already loaded');
      return;
    }
    
    // Update ref AFTER the check
    prevEstadoIdRef.current = estadoId;

    // ✅ FIX: Setear loading=true ANTES de cualquier return early
    setReady(false);
    setLoading(true);

    if (!estadoId) {
      setCiudades([]);
      setLoading(false);
      setReady(true); // Ready with empty array
      return;
    }

    // Validar que el estadoId sea un UUID válido
    if (!isValidUUID(estadoId)) {
      console.warn('⚠️ useCiudades: estadoId inválido (no es UUID):', estadoId);
      setCiudades([]);
      setLoading(false);
      setReady(true); // Ready with empty array (invalid input)
      return;
    }

    // Prevent duplicate fetches
    if (fetchInProgressRef.current) {
      console.log('⏳ useCiudades: Fetch already in progress, skipping');
      return;
    }

    const fetchCiudades = async () => {
      fetchInProgressRef.current = true;
      
      // ✅ Timeout de seguridad: 10 segundos máximo
      const timeoutId = setTimeout(() => {
        if (fetchInProgressRef.current) {
          console.error('⏰ useCiudades: Fetch timeout after 10s for estado:', estadoId);
          setLoading(false);
          setReady(true);
          setError('Tiempo de espera agotado');
          fetchInProgressRef.current = false;
        }
      }, 10000);
      
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 Fetching ciudades for estado:', estadoId);
        
        // Usar la función segura que creamos con tipo explícito
        const { data, error } = await supabase.rpc('get_ciudades_safe', {
          estado_uuid: estadoId
        }) as {
          data: Ciudad[] | null;
          error: any;
        };
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('❌ Error fetching ciudades:', error);
          setError(error.message);
          setReady(true);
          return;
        }
        
        console.log('✅ Ciudades fetched:', data?.length || 0, 'ciudades');
        setCiudades(data || []);
        setReady(true);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('❌ Error in fetchCiudades:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar ciudades';
        setError(errorMessage);
        setReady(true);
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    };

    fetchCiudades();
  }, [estadoId]); // ✅ Solo estadoId como dependencia - sin loading para evitar loops

  return { ciudades, loading, error, ready, refetch };
};

export const useZonasTrabajo = (ciudadId: string | null) => {
  const [zonas, setZonas] = useState<ZonaTrabajo[]>([]);
  // ✅ FIX: Loading debe iniciar como true si hay ciudadId válido
  const [loading, setLoading] = useState(!!ciudadId && isValidUUID(ciudadId));
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  
  const prevCiudadIdRef = useRef<string | null>(undefined as any);
  const fetchInProgressRef = useRef(false);

  // ✅ Función refetch expuesta para reintentos manuales
  const refetch = useCallback(() => {
    if (ciudadId && isValidUUID(ciudadId)) {
      console.log('🔄 useZonasTrabajo: Manual refetch triggered for ciudadId:', ciudadId);
      prevCiudadIdRef.current = null;
      fetchInProgressRef.current = false;
      setReady(false);
      setLoading(true);
      setError(null);
    }
  }, [ciudadId]);

  useEffect(() => {
    const isSameAsPrevious = ciudadId === prevCiudadIdRef.current;
    const hasDataAlready = zonas.length > 0 && ready;
    
    if (isSameAsPrevious && hasDataAlready) {
      console.log('⏭️ useZonasTrabajo: Skipping fetch - same ciudadId and data already loaded');
      return;
    }
    
    prevCiudadIdRef.current = ciudadId;

    // ✅ FIX: Setear loading=true ANTES de cualquier return early
    setReady(false);
    setLoading(true);

    if (!ciudadId) {
      setZonas([]);
      setLoading(false);
      setReady(true);
      return;
    }

    if (!isValidUUID(ciudadId)) {
      console.warn('⚠️ useZonasTrabajo: ciudadId inválido (no es UUID):', ciudadId);
      setZonas([]);
      setLoading(false);
      setReady(true);
      return;
    }

    // Prevent duplicate fetches
    if (fetchInProgressRef.current) {
      console.log('⏳ useZonasTrabajo: Fetch already in progress, skipping');
      return;
    }

    const fetchZonas = async () => {
      fetchInProgressRef.current = true;
      
      // ✅ Timeout de seguridad: 10 segundos máximo
      const timeoutId = setTimeout(() => {
        if (fetchInProgressRef.current) {
          console.error('⏰ useZonasTrabajo: Fetch timeout after 10s for ciudad:', ciudadId);
          setLoading(false);
          setReady(true); // Marcar como ready para desbloquear UI
          setError('Tiempo de espera agotado. Puedes seleccionar "Sin zona específica".');
          fetchInProgressRef.current = false;
        }
      }, 10000);
      
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 Fetching zonas for ciudad:', ciudadId);
        
        // Usar la función segura que creamos con tipo explícito
        const { data, error } = await supabase.rpc('get_zonas_trabajo_safe', {
          ciudad_uuid: ciudadId
        }) as {
          data: ZonaTrabajo[] | null;
          error: any;
        };
        
        clearTimeout(timeoutId); // Limpiar timeout si completa antes
        
        if (error) {
          console.error('❌ Error fetching zonas:', error);
          setError(error.message);
          setReady(true); // Marcar ready para permitir "Sin zona específica"
          return;
        }
        
        console.log('✅ Zonas fetched:', data?.length || 0, 'zonas');
        setZonas(data || []);
        setReady(true);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('❌ Error in fetchZonas:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar zonas';
        setError(errorMessage);
        setReady(true); // Marcar ready para permitir "Sin zona específica"
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    };

    fetchZonas();
  }, [ciudadId]); // ✅ Solo ciudadId como dependencia - sin loading para evitar loops

  return { zonas, loading, error, ready, refetch };
};
