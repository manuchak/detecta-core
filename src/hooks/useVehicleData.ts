
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Marca {
  id: string;
  nombre: string;
  pais_origen: string;
}

interface Modelo {
  id: string;
  nombre: string;
  tipo_vehiculo: string;
}

export const useVehicleData = () => {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loadingMarcas, setLoadingMarcas] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchMarcas = async () => {
      try {
        console.log('Fetching marcas...');
        setLoadingMarcas(true);
        setError(null);
        
        const { data, error } = await supabase.rpc('get_marcas_vehiculos_safe') as {
          data: Marca[] | null;
          error: any;
        };
        
        if (error) {
          console.error('Error fetching marcas:', error);
          if (isMounted) {
            setError(error.message);
          }
          return;
        }
        
        console.log('Marcas fetched successfully:', data);
        if (isMounted) {
          setMarcas(data || []);
        }
      } catch (err) {
        console.error('Error in fetchMarcas:', err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Error al cargar marcas';
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoadingMarcas(false);
        }
      }
    };

    fetchMarcas();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchModelosPorMarca = async (marcaNombre: string): Promise<Modelo[]> => {
    try {
      console.log('Fetching modelos for marca:', marcaNombre);
      
      if (!marcaNombre || marcaNombre.trim() === '') {
        console.log('No marca provided, returning empty array');
        return [];
      }
      
      const { data, error } = await supabase.rpc('get_modelos_por_marca_safe', {
        p_marca_nombre: marcaNombre.trim()
      }) as { data: Modelo[] | null; error: any };
      
      if (error) {
        console.error('Error fetching modelos:', error);
        return [];
      }
      
      console.log('Modelos fetched successfully:', data);
      return data || [];
    } catch (error) {
      console.error('Error in fetchModelosPorMarca:', error);
      return [];
    }
  };

  return {
    marcas,
    loadingMarcas,
    error,
    fetchModelosPorMarca
  };
};
