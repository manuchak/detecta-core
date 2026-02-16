import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServicioVinculado {
  id: string;
  id_servicio: string;
  nombre_cliente: string | null;
  custodio_asignado: string | null;
  custodio_id: string | null;
  origen: string | null;
  destino: string | null;
  tipo_servicio: string | null;
  auto: string | null;
  placa: string | null;
  tarifa_acordada: number | null;
  armado_asignado: string | null;
  fecha_hora_cita: string | null;
}

export function useServicioLookup() {
  const [isSearching, setIsSearching] = useState(false);
  const [servicio, setServicio] = useState<ServicioVinculado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buscarServicio = useCallback(async (idServicio: string) => {
    if (!idServicio.trim()) {
      setServicio(null);
      setError(null);
      return null;
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('servicios_planificados')
        .select('id, id_servicio, nombre_cliente, custodio_asignado, custodio_id, origen, destino, tipo_servicio, auto, placa, tarifa_acordada, armado_asignado, fecha_hora_cita')
        .eq('id_servicio', idServicio.trim())
        .limit(1)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        setError('No se encontró servicio con ese ID');
        setServicio(null);
        return null;
      }

      const result: ServicioVinculado = data as any;
      setServicio(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Error al buscar servicio');
      setServicio(null);
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const limpiar = useCallback(() => {
    setServicio(null);
    setError(null);
  }, []);

  return { servicio, isSearching, error, buscarServicio, limpiar };
}
