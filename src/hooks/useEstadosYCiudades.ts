import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);

  // Cargar estados al inicializar
  useEffect(() => {
    fetchEstados();
    fetchCiudades();
  }, []);

  const fetchEstados = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const fetchCiudades = async () => {
    try {
      const { data, error } = await supabase
        .from('ciudades')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setCiudades(data || []);
    } catch (error) {
      console.error('Error fetching ciudades:', error);
      toast.error('Error al cargar ciudades');
    }
  };

  const getCiudadesByEstado = (estadoId: string) => {
    const ciudadesDelEstado = ciudades.filter(ciudad => ciudad.estado_id === estadoId);
    setCiudadesFiltradas(ciudadesDelEstado);
    return ciudadesDelEstado;
  };

  const getEstadoById = (estadoId: string) => {
    return estados.find(estado => estado.id === estadoId);
  };

  const getCiudadById = (ciudadId: string) => {
    return ciudades.find(ciudad => ciudad.id === ciudadId);
  };

  return {
    estados,
    ciudades,
    ciudadesFiltradas,
    loading,
    getCiudadesByEstado,
    getEstadoById,
    getCiudadById,
    fetchEstados,
    fetchCiudades
  };
};