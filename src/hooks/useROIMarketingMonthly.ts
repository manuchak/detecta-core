import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyROIData {
  mes: string;
  inversion: number;
  retorno: number;
  roi: number;
  custodios: number;
  servicios: number;
}

export const useROIMarketingMonthly = () => {
  const {
    data: monthlyData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['roi-marketing-monthly'],
    queryFn: async () => {
      // Obtener datos de los últimos 6 meses - solo gastos de marketing/reclutamiento
      const { data: gastosData, error: gastosError } = await supabase
        .from('gastos_externos')
        .select('*')
        .eq('estado', 'aprobado')
        .not('canal_reclutamiento', 'is', null)
        .gte('fecha_gasto', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('fecha_gasto', { ascending: true });

      if (gastosError) {
        console.error('Error fetching gastos:', gastosError);
      }

      // Obtener servicios completados por mes
      const { data: serviciosData, error: serviciosError } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita, cobro_cliente, nombre_custodio')
        .gte('fecha_hora_cita', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
        .in('estado', ['finalizado', 'completado', 'Finalizado', 'Completado'])
        .not('cobro_cliente', 'is', null)
        .gt('cobro_cliente', 0);

      if (serviciosError) {
        console.error('Error fetching servicios:', serviciosError);
      }

      const monthlyResults: MonthlyROIData[] = [];
      
      // Calcular datos para los últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        // Calcular ingresos del mes primero
        const serviciosDelMes = serviciosData
          ?.filter(servicio => {
            const servicioDate = new Date(servicio.fecha_hora_cita);
            return servicioDate >= monthStart && servicioDate <= monthEnd;
          }) || [];
        
        const ingresosMes = serviciosDelMes.reduce((total, servicio) => total + (servicio.cobro_cliente || 0), 0);
        
        // Calcular inversión del mes - usar valor mínimo si no hay datos
        let inversionMes = gastosData
          ?.filter(gasto => {
            const gastoDate = new Date(gasto.fecha_gasto);
            return gastoDate >= monthStart && gastoDate <= monthEnd;
          })
          .reduce((total, gasto) => total + (gasto.monto || 0), 0) || 0;
        
        // Si no hay inversión registrada, usar un valor mínimo para evitar ROI infinito
        if (inversionMes === 0 && ingresosMes > 0) {
          inversionMes = 20000; // Valor mínimo estimado de inversión mensual
        }
        const custodiosUnicos = new Set(serviciosDelMes.map(s => s.nombre_custodio).filter(Boolean)).size;
        const serviciosCount = serviciosDelMes.length;
        
        // Calcular ROI más realista
        const roi = inversionMes > 0 ? ((ingresosMes - inversionMes) / inversionMes) * 100 : 0;
        
        monthlyResults.push({
          mes: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          inversion: inversionMes,
          retorno: ingresosMes,
          roi: roi,
          custodios: custodiosUnicos,
          servicios: serviciosCount
        });
      }

      return monthlyResults;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 10 * 60 * 1000
  });

  // Obtener datos del mes actual
  const currentMonthData = monthlyData && monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null;
  
  // Obtener datos del mes anterior para comparación
  const previousMonthData = monthlyData && monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

  return {
    monthlyData: monthlyData || [],
    currentMonthData,
    previousMonthData,
    loading: isLoading,
    error,
    refetch
  };
};