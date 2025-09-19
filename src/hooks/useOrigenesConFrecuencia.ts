import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OrigenConFrecuencia {
  origen: string;
  frecuencia: number;
  ultimoUso?: string;
}

export const useOrigenesConFrecuencia = (clienteNombre?: string) => {
  return useQuery({
    queryKey: ['origenes-con-frecuencia', clienteNombre],
    queryFn: async (): Promise<OrigenConFrecuencia[]> => {
      if (!clienteNombre) return [];

      // Obtener orígenes disponibles en pricing
      const { data: origenesPrecios, error: errorPrecios } = await supabase
        .from('matriz_precios_rutas')
        .select('origen_texto')
        .eq('activo', true)
        .eq('cliente_nombre', clienteNombre);

      if (errorPrecios) throw errorPrecios;

      const origenesUnicos = Array.from(new Set(origenesPrecios?.map(row => row.origen_texto) || []));

      // Obtener frecuencia histórica para cada origen
      const origenesConFrecuencia: OrigenConFrecuencia[] = [];

      for (const origen of origenesUnicos) {
        // Buscar frecuencia en servicios históricos
        const { data: frecuenciaData, error: errorFrecuencia } = await supabase
          .from('servicios_custodia')
          .select('fecha_hora_cita')
          .eq('nombre_cliente', clienteNombre)
          .eq('origen', origen)
          .order('fecha_hora_cita', { ascending: false });

        if (errorFrecuencia) {
          console.warn(`Error fetching frequency for ${origen}:`, errorFrecuencia);
        }

        const frecuencia = frecuenciaData?.length || 0;
        const ultimoUso = frecuenciaData?.[0]?.fecha_hora_cita;

        origenesConFrecuencia.push({
          origen,
          frecuencia,
          ultimoUso
        });
      }

      // Ordenar por frecuencia descendente, luego por nombre
      return origenesConFrecuencia.sort((a, b) => {
        if (b.frecuencia !== a.frecuencia) {
          return b.frecuencia - a.frecuencia;
        }
        return a.origen.localeCompare(b.origen);
      });
    },
    enabled: !!clienteNombre,
  });
};