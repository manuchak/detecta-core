import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CasetaServicio {
  id: number;
  id_servicio: string;
  cliente: string | null;
  fecha_servicio: string | null;
  casetas: number;
  custodio_asignado: string | null;
  estado: string;
}

export function useCasetasReembolso() {
  return useQuery({
    queryKey: ['casetas-reembolso'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('id, id_servicio, cliente, fecha_servicio, casetas, custodio_asignado, estado')
        .gt('casetas', 0)
        .eq('estado', 'completado')
        .order('fecha_servicio', { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data || []) as CasetaServicio[];
    },
    staleTime: 60_000,
  });
}
