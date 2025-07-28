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
        // Obtener leads reales de la tabla leads
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('fecha_creacion')
          .gte('fecha_creacion', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('fecha_creacion', { ascending: true });

        if (leadsError) {
          console.error('Error fetching leads:', leadsError);
        }

        // Obtener custodios que hicieron su primer servicio (datos reales para CPA)
        const { data: custodiosPrimerServicioData, error: custodiosError } = await supabase
          .from('custodios_primer_servicio_zona')
          .select('fecha_primer_servicio, custodio_id')
          .gte('fecha_primer_servicio', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('fecha_primer_servicio', { ascending: true });

        if (custodiosError) {
          console.error('Error fetching custodios primer servicio:', custodiosError);
        }

        // Enriquecer datos ROI con métricas reales de leads y custodios
        const enrichedData = realMonthlyROI.map(monthData => {
          // Parse month from string like "enero 2025" o "jun 2025"
          const [monthName, year] = monthData.mes.split(' ');
          const monthNames = {
            'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
            'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
            'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
          };
          const monthIndex = monthNames[monthName.toLowerCase()] ?? new Date(Date.parse(monthName + " 1, " + year)).getMonth();
          const monthStart = new Date(parseInt(year), monthIndex, 1);
          const monthEnd = new Date(parseInt(year), monthIndex + 1, 0);

          console.log(`Processing month: ${monthData.mes}, parsed as: ${monthIndex} (${monthStart.toISOString()} - ${monthEnd.toISOString()})`);

          // Calcular leads reales del mes (de la tabla leads)
          const leadsDelMes = leadsData?.filter(lead => {
            const leadDate = new Date(lead.fecha_creacion);
            return leadDate >= monthStart && leadDate <= monthEnd;
          }) || [];

          // Calcular custodios que hicieron primer servicio en el mes (para CPA)
          const custodiosNuevosDelMes = custodiosPrimerServicioData?.filter(custodio => {
            const servicioDate = new Date(custodio.fecha_primer_servicio);
            return servicioDate >= monthStart && servicioDate <= monthEnd;
          }) || [];

          const totalLeads = leadsDelMes.length;
          const custodiosNuevos = custodiosNuevosDelMes.length;

          console.log(`Month ${monthData.mes}: totalLeads=${totalLeads}, custodiosNuevos=${custodiosNuevos}, inversion=${monthData.inversion}`);

          // Calcular métricas correctas
          const costoPortLead = totalLeads > 0 ? monthData.inversion / totalLeads : 0;
          const cpa = custodiosNuevos > 0 ? monthData.inversion / custodiosNuevos : 0;
          const tasaAprobacion = totalLeads > 0 ? (custodiosNuevos / totalLeads) * 100 : 0;

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
            aprobados: custodiosNuevos,
            costoPortLead,
            cpa,
            tasaAprobacion
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