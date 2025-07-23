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
  // Obtener leads por mes
  const { data: leadsPorMes, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-por-mes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('nombre, fecha_creacion')
        .gte('fecha_creacion', '2025-01-01')
        .lte('fecha_creacion', '2025-05-31')
        .order('fecha_creacion', { ascending: true });

      if (error) throw error;
      
      // Agrupar leads por mes
      const leadsPorMes: { [key: string]: number } = {};
      
      if (data && data.length > 0) {
        data.forEach(lead => {
          const fecha = new Date(lead.fecha_creacion);
          const yearMonth = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          
          if (!leadsPorMes[yearMonth]) {
            leadsPorMes[yearMonth] = 0;
          }
          leadsPorMes[yearMonth]++;
        });
      }
      
      return leadsPorMes;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Obtener custodios con primer servicio por mes (reutilizando lógica existente)
  const { data: custodiosNuevosPorMes, isLoading: custodiosLoading } = useQuery({
    queryKey: ['custodios-nuevos-conversion'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('bypass_rls_get_servicios', { max_records: 10000 });
      
      if (error) throw error;
      
      // Procesar datos para encontrar primer servicio de cada custodio
      const custodiosPrimerServicio = new Map();
      
      if (data && data.length > 0) {
        // Ordenar por fecha para encontrar el primer servicio de cada custodio
        const serviciosOrdenados = data
          .filter(s => s.nombre_custodio && s.fecha_hora_cita)
          .sort((a, b) => new Date(a.fecha_hora_cita).getTime() - new Date(b.fecha_hora_cita).getTime());
        
        serviciosOrdenados.forEach(servicio => {
          const custodio = servicio.nombre_custodio;
          if (!custodiosPrimerServicio.has(custodio)) {
            custodiosPrimerServicio.set(custodio, new Date(servicio.fecha_hora_cita));
          }
        });
      }
      
      // Agrupar por mes los custodios que tuvieron su primer servicio
      const custodiosPorMes: { [key: string]: number } = {};
      
      custodiosPrimerServicio.forEach((fechaPrimerServicio, custodio) => {
        if (fechaPrimerServicio >= new Date('2025-01-01') && fechaPrimerServicio <= new Date('2025-05-31')) {
          const yearMonth = `${fechaPrimerServicio.getFullYear()}-${String(fechaPrimerServicio.getMonth() + 1).padStart(2, '0')}`;
          
          if (!custodiosPorMes[yearMonth]) {
            custodiosPorMes[yearMonth] = 0;
          }
          custodiosPorMes[yearMonth]++;
        }
      });
      
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

    // Obtener todos los meses del período
    const allMonths = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05'];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'];
    
    let totalLeads = 0;
    let totalNewCustodians = 0;
    const monthlyBreakdown: ConversionRateBreakdown[] = [];

    allMonths.forEach((month, index) => {
      const leads = leadsPorMes[month] || 0;
      const newCustodians = custodiosNuevosPorMes[month] || 0;
      const conversionRate = leads > 0 ? (newCustodians / leads) * 100 : 0;

      totalLeads += leads;
      totalNewCustodians += newCustodians;

      monthlyBreakdown.push({
        month: monthNames[index],
        leads,
        newCustodians,
        conversionRate,
      });
    });

    const overallConversionRate = totalLeads > 0 ? (totalNewCustodians / totalLeads) * 100 : 0;

    // Datos del mes actual (Mayo 2025)
    const currentMonth = '2025-05';
    const currentMonthLeads = leadsPorMes[currentMonth] || 0;
    const currentMonthCustodians = custodiosNuevosPorMes[currentMonth] || 0;
    const currentMonthConversion = currentMonthLeads > 0 ? (currentMonthCustodians / currentMonthLeads) * 100 : 0;

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