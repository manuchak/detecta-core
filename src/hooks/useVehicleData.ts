
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

  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        const { data, error } = await supabase
          .from('marcas_vehiculos')
          .select('id, nombre, pais_origen')
          .eq('activo', true)
          .order('nombre');
        
        if (error) throw error;
        setMarcas(data || []);
      } catch (error) {
        console.error('Error fetching marcas:', error);
      } finally {
        setLoadingMarcas(false);
      }
    };

    fetchMarcas();
  }, []);

  const fetchModelosPorMarca = async (marcaNombre: string): Promise<Modelo[]> => {
    try {
      const { data, error } = await supabase
        .rpc('get_modelos_por_marca', { p_marca_nombre: marcaNombre });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching modelos:', error);
      return [];
    }
  };

  return {
    marcas,
    loadingMarcas,
    fetchModelosPorMarca
  };
};
