import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyRecruitmentMetrics {
  mes: string;
  inversion: number;
  totalLeads: number;
  aprobados: number;
  costoPortLead: number;
  cpa: number;
  tasaAprobacion: number;
}

export const useRecruitmentMonthlyMetrics = () => {
  const {
    data: monthlyData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['recruitment-monthly-metrics'],
    queryFn: async () => {
      try {
        // Obtener gastos de marketing de los últimos 6 meses
        const { data: gastosData, error: gastosError } = await supabase
          .from('gastos_externos')
          .select('fecha_gasto, monto, canal_reclutamiento_id')
          .eq('estado', 'aprobado')
          .not('canal_reclutamiento_id', 'is', null)
          .gte('fecha_gasto', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('fecha_gasto', { ascending: true });

        if (gastosError) {
          console.error('Error fetching gastos:', gastosError);
        }

        // Obtener candidatos de los últimos 6 meses
        const { data: candidatosData, error: candidatosError } = await supabase
          .from('candidatos_custodios')
          .select('created_at, nombre, estado_proceso')
          .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true });

        if (candidatosError) {
          console.error('Error fetching candidatos:', candidatosError);
        }

        // Obtener servicios para calcular custodios activos (aprobados efectivos)
        const { data: serviciosData, error: serviciosError } = await supabase
          .from('servicios_custodia')
          .select('nombre_custodio, fecha_hora_cita, estado')
          .gte('fecha_hora_cita', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
          .in('estado', ['finalizado', 'completado', 'Finalizado', 'Completado'])
          .not('nombre_custodio', 'is', null);

        if (serviciosError) {
          console.error('Error fetching servicios:', serviciosError);
        }

        const monthlyResults: MonthlyRecruitmentMetrics[] = [];
        
        // Calcular datos para los últimos 6 meses
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const year = date.getFullYear();
          const month = date.getMonth();
          
          const monthStart = new Date(year, month, 1);
          const monthEnd = new Date(year, month + 1, 0);
          
          // Calcular inversión del mes
          const inversionMes = gastosData
            ?.filter(gasto => {
              const gastoDate = new Date(gasto.fecha_gasto);
              return gastoDate >= monthStart && gastoDate <= monthEnd;
            })
            .reduce((total, gasto) => total + (gasto.monto || 0), 0) || 0;
          
          // Calcular leads del mes
          const leadsDelMes = candidatosData
            ?.filter(candidato => {
              const candidatoDate = new Date(candidato.created_at);
              return candidatoDate >= monthStart && candidatoDate <= monthEnd;
            }) || [];

          const totalLeads = leadsDelMes.length;
          
          // Calcular aprobados (candidatos que han completado al menos un servicio)
          const custodiosActivosEnMes = new Set();
          serviciosData?.forEach(servicio => {
            const servicioDate = new Date(servicio.fecha_hora_cita);
            if (servicioDate >= monthStart && servicioDate <= monthEnd) {
              custodiosActivosEnMes.add(servicio.nombre_custodio);
            }
          });
          
          // Contar aprobados
          const aprobadosDelMes = Array.from(custodiosActivosEnMes).length;
          
          // Calcular métricas
          const costoPortLead = totalLeads > 0 ? inversionMes / totalLeads : 0;
          const cpa = aprobadosDelMes > 0 ? inversionMes / aprobadosDelMes : 0;
          const tasaAprobacion = totalLeads > 0 ? (aprobadosDelMes / totalLeads) * 100 : 0;
          
          monthlyResults.push({
            mes: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
            inversion: inversionMes,
            totalLeads,
            aprobados: aprobadosDelMes,
            costoPortLead,
            cpa,
            tasaAprobacion
          });
        }

        console.log('Monthly recruitment metrics:', monthlyResults);
        return monthlyResults;
      } catch (error) {
        console.error('Error in recruitment monthly metrics:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 10 * 60 * 1000
  });

  return {
    monthlyData: monthlyData || [],
    loading: isLoading,
    error,
    refetch
  };
};