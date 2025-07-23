import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConversionRateBreakdown {
  month: string;
  leads: number;
  newCustodians: number;
  conversionRate: number;
}

export interface ConversionRateDetails {
  yearlyData: {
    totalLeads: number;
    totalNewCustodians: number;
    overallConversionRate: number;
    monthlyBreakdown: ConversionRateBreakdown[];
  };
  currentMonthData: {
    month: string;
    leads: number;
    newCustodians: number;
    conversionRate: number;
  };
  loading: boolean;
}

export const useConversionRateDetails = (): ConversionRateDetails => {
  // Obtener leads por mes desde metricas_canales (datos reales)
  const { data: leadsPorMes, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-por-mes-metricas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metricas_canales')
        .select('periodo_inicio, leads_generados')
        .gte('periodo_inicio', '2025-01-01')
        .lte('periodo_fin', '2025-05-31')
        .order('periodo_inicio', { ascending: true });

      if (error) throw error;
      
      // Agrupar leads por mes
      const leadsPorMes: { [key: string]: number } = {};
      
      if (data && data.length > 0) {
        data.forEach(metrica => {
          const fecha = new Date(metrica.periodo_inicio);
          const yearMonth = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          
          if (!leadsPorMes[yearMonth]) {
            leadsPorMes[yearMonth] = 0;
          }
          leadsPorMes[yearMonth] += metrica.leads_generados || 0;
        });
      }
      
      return leadsPorMes;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Obtener custodios con primer servicio por mes usando función optimizada
  const { data: custodiosNuevosPorMes, isLoading: custodiosLoading } = useQuery({
    queryKey: ['custodios-nuevos-conversion'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_custodios_nuevos_por_mes', {
        fecha_inicio: '2025-01-01',
        fecha_fin: '2025-05-31'
      });
      
      if (error) throw error;
      
      // Convertir a formato esperado (cantidad por mes)
      const custodiosPorMes: { [key: string]: number } = {};
      
      if (data && data.length > 0) {
        data.forEach(item => {
          custodiosPorMes[item.mes] = item.custodios_nuevos;
        });
      }
      
      return custodiosPorMes;
    },
    staleTime: 5 * 60 * 1000,
  });

  const conversionDetails = useMemo(() => {
    if (leadsLoading || custodiosLoading || !leadsPorMes || !custodiosNuevosPorMes) {
      return {
        yearlyData: {
          totalLeads: 0,
          totalNewCustodians: 0,
          overallConversionRate: 0,
          monthlyBreakdown: [],
        },
        currentMonthData: {
          month: '',
          leads: 0,
          newCustodians: 0,
          conversionRate: 0,
        },
        loading: true,
      };
    }

    // Obtener todos los meses del período real de datos
    const allMonths = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05'];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'];
    
    let totalLeads = 0;
    let totalNewCustodians = 0;
    const monthlyBreakdown: ConversionRateBreakdown[] = [];

    allMonths.forEach((month, index) => {
      const leads = leadsPorMes[month] || 0;
      const newCustodians = custodiosNuevosPorMes[month] || 0;
      const conversionRate = leads > 0 ? Math.round((newCustodians / leads) * 100 * 100) / 100 : 0;

      totalLeads += leads;
      totalNewCustodians += newCustodians;

      monthlyBreakdown.push({
        month: monthNames[index],
        leads,
        newCustodians,
        conversionRate,
      });
    });

    const overallConversionRate = totalLeads > 0 ? Math.round((totalNewCustodians / totalLeads) * 100 * 100) / 100 : 0;

    // Datos del mes actual (Mayo 2025 - último mes con datos)
    const currentMonth = '2025-05';
    const currentMonthLeads = leadsPorMes[currentMonth] || 0;
    const currentMonthCustodians = custodiosNuevosPorMes[currentMonth] || 0;
    const currentMonthConversion = currentMonthLeads > 0 ? Math.round((currentMonthCustodians / currentMonthLeads) * 100 * 100) / 100 : 0;

    return {
      yearlyData: {
        totalLeads,
        totalNewCustodians,
        overallConversionRate,
        monthlyBreakdown,
      },
      currentMonthData: {
        month: 'Mayo 2025',
        leads: currentMonthLeads,
        newCustodians: currentMonthCustodians,
        conversionRate: currentMonthConversion,
      },
      loading: false,
    };
  }, [leadsPorMes, custodiosNuevosPorMes, leadsLoading, custodiosLoading]);

  return {
    ...conversionDetails,
    loading: leadsLoading || custodiosLoading,
  };
};