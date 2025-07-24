import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useROIMarketingMonthly } from './useROIMarketingMonthly';
import { useROIMarketingDetails } from './useROIMarketingDetails';

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
  // Usar datos reales existentes
  const { monthlyData: realMonthlyROI, loading: roiLoading, currentMonthData, previousMonthData } = useROIMarketingMonthly();
  const { metrics: roiDetails, loading: detailsLoading } = useROIMarketingDetails();

  const {
    data: enrichedMonthlyData,
    isLoading: queryLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['recruitment-monthly-metrics-enriched', realMonthlyROI],
    queryFn: async () => {
      if (!realMonthlyROI || realMonthlyROI.length === 0) {
        return [];
      }

      try {
        // Obtener candidatos para calcular leads y tasa de aprobación
        const { data: candidatosData, error: candidatosError } = await supabase
          .from('candidatos_custodios')
          .select('created_at, nombre, estado_proceso')
          .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true });

        if (candidatosError) {
          console.error('Error fetching candidatos:', candidatosError);
        }

        // Enriquecer datos ROI con métricas de candidatos
        const enrichedData = realMonthlyROI.map(monthData => {
          // Parse month from string like "enero 2025"
          const [monthName, year] = monthData.mes.split(' ');
          const monthIndex = new Date(Date.parse(monthName + " 1, " + year)).getMonth();
          const monthStart = new Date(parseInt(year), monthIndex, 1);
          const monthEnd = new Date(parseInt(year), monthIndex + 1, 0);

          // Calcular leads del mes
          const leadsDelMes = candidatosData?.filter(candidato => {
            const candidatoDate = new Date(candidato.created_at);
            return candidatoDate >= monthStart && candidatoDate <= monthEnd;
          }) || [];

          const totalLeads = leadsDelMes.length;
          const aprobados = leadsDelMes.filter(c => 
            c.estado_proceso === 'aprobado' || c.estado_proceso === 'activo'
          ).length;

          // Calcular métricas
          const costoPortLead = totalLeads > 0 ? monthData.inversion / totalLeads : 0;
          const cpa = aprobados > 0 ? monthData.inversion / aprobados : 0;
          const tasaAprobacion = totalLeads > 0 ? (aprobados / totalLeads) * 100 : 0;

          return {
            mes: monthData.mes.replace(/(\w+) (\d+)/, (_, month, year) => {
              const months = {
                'enero': 'ene', 'febrero': 'feb', 'marzo': 'mar', 'abril': 'abr',
                'mayo': 'may', 'junio': 'jun', 'julio': 'jul', 'agosto': 'ago',
                'septiembre': 'sep', 'octubre': 'oct', 'noviembre': 'nov', 'diciembre': 'dic'
              };
              return `${months[month.toLowerCase()] || month} ${year}`;
            }),
            inversion: monthData.inversion,
            totalLeads,
            aprobados,
            costoPortLead,
            cpa: cpa > 0 ? cpa : (monthData.custodios > 0 ? monthData.inversion / monthData.custodios : 0),
            tasaAprobacion: tasaAprobacion > 0 ? tasaAprobacion : (totalLeads > 0 ? (monthData.custodios / totalLeads) * 100 : 0)
          };
        });

        console.log('Enriched monthly recruitment metrics:', enrichedData);
        return enrichedData;
      } catch (error) {
        console.error('Error enriching recruitment monthly metrics:', error);
        // Fallback to basic ROI data
        return realMonthlyROI.map(monthData => ({
          mes: monthData.mes.replace(/(\w+) (\d+)/, (_, month, year) => {
            const months = {
              'enero': 'ene', 'febrero': 'feb', 'marzo': 'mar', 'abril': 'abr',
              'mayo': 'may', 'junio': 'jun', 'julio': 'jul', 'agosto': 'ago',
              'septiembre': 'sep', 'octubre': 'oct', 'noviembre': 'nov', 'diciembre': 'dic'
            };
            return `${months[month.toLowerCase()] || month} ${year}`;
          }),
          inversion: monthData.inversion,
          totalLeads: 0,
          aprobados: monthData.custodios,
          costoPortLead: 0,
          cpa: monthData.custodios > 0 ? monthData.inversion / monthData.custodios : 0,
          tasaAprobacion: 0
        }));
      }
    },
    enabled: !roiLoading && realMonthlyROI && realMonthlyROI.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 10 * 60 * 1000
  });

  const loading = roiLoading || detailsLoading || queryLoading;

  return {
    monthlyData: enrichedMonthlyData || [],
    loading,
    error,
    refetch: () => {
      refetch();
    }
  };
};