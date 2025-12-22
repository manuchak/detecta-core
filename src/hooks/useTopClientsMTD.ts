import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentMTDRange, getPreviousMTDRange } from '@/utils/mtdDateUtils';

export interface ClientGMVData {
  cliente: string;
  gmvActual: number;
  gmvAnterior: number;
  variacion: number;
  servicios: number;
}

export function useTopClientsMTD() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['top-clients-mtd'],
    queryFn: async () => {
      const now = new Date();
      const currentRange = getCurrentMTDRange(now);
      const prevRange = getPreviousMTDRange(now);

      // Get current month services (MTD)
      const { data: currentMonth, error: currentError } = await supabase
        .from('servicios_custodia')
        .select('nombre_cliente, cobro_cliente, fecha_hora_cita')
        .gte('fecha_hora_cita', currentRange.start)
        .lte('fecha_hora_cita', currentRange.end)
        .not('estado', 'eq', 'cancelado');

      if (currentError) throw currentError;

      // Get previous month services (MTD - same day range)
      const { data: previousMonth, error: prevError } = await supabase
        .from('servicios_custodia')
        .select('nombre_cliente, cobro_cliente')
        .gte('fecha_hora_cita', prevRange.start)
        .lte('fecha_hora_cita', prevRange.end)
        .not('estado', 'eq', 'cancelado');

      if (prevError) throw prevError;

      // Aggregate by client - current month
      const currentByClient: Record<string, { gmv: number; count: number }> = {};
      (currentMonth || []).forEach(s => {
        const cliente = s.nombre_cliente || 'Sin nombre';
        const monto = parseFloat(String(s.cobro_cliente || 0));
        if (!currentByClient[cliente]) {
          currentByClient[cliente] = { gmv: 0, count: 0 };
        }
        currentByClient[cliente].gmv += monto;
        currentByClient[cliente].count += 1;
      });

      // Aggregate by client - previous month
      const previousByClient: Record<string, number> = {};
      (previousMonth || []).forEach(s => {
        const cliente = s.nombre_cliente || 'Sin nombre';
        const monto = parseFloat(String(s.cobro_cliente || 0));
        previousByClient[cliente] = (previousByClient[cliente] || 0) + monto;
      });

      // Build result
      const clients: ClientGMVData[] = Object.entries(currentByClient)
        .map(([cliente, data]) => {
          const gmvAnterior = previousByClient[cliente] || 0;
          const variacion = gmvAnterior > 0 
            ? ((data.gmv - gmvAnterior) / gmvAnterior) * 100 
            : 0;
          return {
            cliente,
            gmvActual: data.gmv,
            gmvAnterior,
            variacion,
            servicios: data.count
          };
        })
        .sort((a, b) => b.gmvActual - a.gmvActual)
        .slice(0, 10);

      const totalGMV = clients.reduce((sum, c) => sum + c.gmvActual, 0);

      return { clients, totalGMV };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    clients: data?.clients || [],
    totalGMV: data?.totalGMV || 0,
    loading: isLoading,
    error
  };
}
