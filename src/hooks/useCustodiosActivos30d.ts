import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export interface CustodiosActivosStats {
  activos: number;
  totalPool: number;
}

export const useCustodiosActivos30d = () => {
  return useQuery({
    queryKey: ['custodios-activos-30d'],
    queryFn: async (): Promise<CustodiosActivosStats> => {
      const hace30Dias = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      // Obtener custodios distintos con servicios completados/ejecutados en los últimos 30 días
      const { data: serviciosRecientes, error: errorServicios } = await supabase
        .from('servicios_planificados')
        .select('custodio_asignado')
        .gte('fecha_hora_cita', `${hace30Dias}T00:00:00`)
        .not('custodio_asignado', 'is', null)
        .not('custodio_asignado', 'eq', '');
      
      if (errorServicios) throw errorServicios;
      
      // Contar custodios únicos
      const custodiosUnicos = new Set(
        (serviciosRecientes || [])
          .map(s => s.custodio_asignado?.trim().toLowerCase())
          .filter(Boolean)
      );
      
      // Obtener total del pool de custodios activos
      const { count: totalPool, error: errorPool } = await supabase
        .from('custodios_operativos')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activo');
      
      if (errorPool) throw errorPool;
      
      return {
        activos: custodiosUnicos.size,
        totalPool: totalPool || 0
      };
    },
    staleTime: 300000, // 5 min cache
  });
};
