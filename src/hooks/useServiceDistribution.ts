import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentMTDRange, getPreviousMTDRange } from '@/utils/mtdDateUtils';

export interface DistributionData {
  tipo: string;
  cantidad: number;
  porcentaje: number;
  gmv: number;
  cantidadAnterior: number;
  variacion: number;
}

export function useServiceDistribution() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['service-distribution'],
    queryFn: async () => {
      const now = new Date();
      const currentRange = getCurrentMTDRange(now);
      const prevRange = getPreviousMTDRange(now);

      // Get current month services with route type info (MTD)
      const { data: currentMonth, error: currentError } = await supabase
        .from('servicios_custodia')
        .select('tipo_servicio, cobro_cliente')
        .gte('fecha_hora_cita', currentRange.start)
        .lte('fecha_hora_cita', currentRange.end)
        .not('estado', 'eq', 'cancelado');

      if (currentError) throw currentError;

      // Get previous month services (MTD - same day range)
      const { data: previousMonth, error: prevError } = await supabase
        .from('servicios_custodia')
        .select('tipo_servicio')
        .gte('fecha_hora_cita', prevRange.start)
        .lte('fecha_hora_cita', prevRange.end)
        .not('estado', 'eq', 'cancelado');

      if (prevError) throw prevError;

      // Classify services by type
      const classifyService = (tipo: string | null): string => {
        if (!tipo) return 'Local';
        const tipoLower = tipo.toLowerCase();
        if (tipoLower.includes('reparto')) return 'Reparto';
        if (tipoLower.includes('foráneo') || tipoLower.includes('foraneo')) return 'Foráneo';
        return 'Local';
      };

      // Aggregate current month
      const currentByType: Record<string, { count: number; gmv: number }> = {};
      (currentMonth || []).forEach(s => {
        const tipo = classifyService(s.tipo_servicio);
        if (!currentByType[tipo]) {
          currentByType[tipo] = { count: 0, gmv: 0 };
        }
        currentByType[tipo].count += 1;
        currentByType[tipo].gmv += parseFloat(String(s.cobro_cliente || 0));
      });

      // Aggregate previous month
      const previousByType: Record<string, number> = {};
      (previousMonth || []).forEach(s => {
        const tipo = classifyService(s.tipo_servicio);
        previousByType[tipo] = (previousByType[tipo] || 0) + 1;
      });

      const totalCurrent = Object.values(currentByType).reduce((sum, d) => sum + d.count, 0);

      // Build distribution data
      const distribution: DistributionData[] = Object.entries(currentByType)
        .map(([tipo, data]) => {
          const cantidadAnterior = previousByType[tipo] || 0;
          const variacion = cantidadAnterior > 0 
            ? ((data.count - cantidadAnterior) / cantidadAnterior) * 100 
            : 0;
          return {
            tipo,
            cantidad: data.count,
            porcentaje: totalCurrent > 0 ? (data.count / totalCurrent) * 100 : 0,
            gmv: data.gmv,
            cantidadAnterior,
            variacion
          };
        })
        .sort((a, b) => b.cantidad - a.cantidad);

      return { distribution, total: totalCurrent };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    distribution: data?.distribution || [],
    total: data?.total || 0,
    loading: isLoading,
    error
  };
}
