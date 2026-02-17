/**
 * Hook centralizado para consultar armados asignados a un servicio.
 * Fuente de verdad: tabla `asignacion_armados`.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ArmadoAsignado {
  id: string;
  armado_id: string | null;
  armado_nombre_verificado: string | null;
  tipo_asignacion: string;
  estado_asignacion: string;
  proveedor_armado_id: string | null;
  punto_encuentro: string | null;
  hora_encuentro: string | null;
  tarifa_acordada: number | null;
  estado_pago: string | null;
  confirmado_por_armado: boolean | null;
  observaciones: string | null;
}

export function useArmadosDelServicio(servicioId: string | null | undefined) {
  return useQuery({
    queryKey: ['armados-del-servicio', servicioId],
    queryFn: async (): Promise<ArmadoAsignado[]> => {
      if (!servicioId) return [];

      const { data, error } = await supabase
        .from('asignacion_armados')
        .select(
          'id, armado_id, armado_nombre_verificado, tipo_asignacion, estado_asignacion, proveedor_armado_id, punto_encuentro, hora_encuentro, tarifa_acordada, estado_pago, confirmado_por_armado, observaciones'
        )
        .eq('servicio_custodia_id', servicioId)
        .not('estado_asignacion', 'eq', 'cancelado')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as ArmadoAsignado[]) || [];
    },
    enabled: !!servicioId,
    staleTime: 30_000,
  });
}

/**
 * Utility function (non-hook) to count armados for a service.
 * Useful inside mutation callbacks where hooks can't be used.
 */
export async function countArmadosAsignados(servicioId: string): Promise<number> {
  const { count, error } = await supabase
    .from('asignacion_armados')
    .select('id', { count: 'exact', head: true })
    .eq('servicio_custodia_id', servicioId)
    .not('estado_asignacion', 'eq', 'cancelado');

  if (error) {
    console.error('[countArmadosAsignados] Error:', error);
    return 0;
  }
  return count || 0;
}
