// @ts-nocheck
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EngagementDetails {
  yearlyData: {
    totalServices: number;
    totalActiveCustodians: number;
    avgServicesPerCustodian: number;
    monthlyEvolution: Array<{
      month: string;
      services: number;
      custodians: number;
      engagement: number;
    }>;
  };
  currentMonthData: {
    month: string;
    services: number;
    custodians: number;
    engagement: number;
  };
  overallEngagement: number;
}

export const useEngagementDetails = () => {
  // Obtener servicios por mes
  const { data: serviciosPorMes, isLoading: serviciosLoading } = useQuery({
    queryKey: ['engagement-details-servicios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('nombre_custodio, fecha_hora_cita')
        .gte('fecha_hora_cita', '2025-01-01')
        .lte('fecha_hora_cita', '2025-12-31')
        .not('nombre_custodio', 'is', null)
        .order('fecha_hora_cita', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const engagementDetails = useMemo((): EngagementDetails => {
    if (!serviciosPorMes || serviciosPorMes.length === 0) {
      return {
        yearlyData: {
          totalServices: 0,
          totalActiveCustodians: 0,
          avgServicesPerCustodian: 0,
          monthlyEvolution: []
        },
        currentMonthData: {
          month: new Date().toISOString().substring(0, 7),
          services: 0,
          custodians: 0,
          engagement: 0
        },
        overallEngagement: 0
      };
    }

    // Agrupar servicios por mes
    const serviciosPorMesData = {};
    const custodiosPorMes = {};

    serviciosPorMes.forEach(servicio => {
      const fecha = new Date(servicio.fecha_hora_cita);
      const yearMonth = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      
      // Contar servicios por mes
      if (!serviciosPorMesData[yearMonth]) {
        serviciosPorMesData[yearMonth] = 0;
        custodiosPorMes[yearMonth] = new Set();
      }
      
      serviciosPorMesData[yearMonth]++;
      custodiosPorMes[yearMonth].add(servicio.nombre_custodio);
    });

    // Crear datos de evolución mensual
    const monthlyEvolution = [];
    let totalServices = 0;
    const allCustodians = new Set();

    Object.keys(serviciosPorMesData)
      .sort()
      .forEach(mes => {
        const services = serviciosPorMesData[mes];
        const custodians = custodiosPorMes[mes].size;
        const engagement = custodians > 0 ? services / custodians : 0;

        monthlyEvolution.push({
          month: mes,
          services,
          custodians,
          engagement
        });

        totalServices += services;
        custodiosPorMes[mes].forEach(custodio => allCustodians.add(custodio));
      });

    // Datos del mes actual
    const currentMonth = new Date().toISOString().substring(0, 7);
    const currentMonthServices = serviciosPorMesData[currentMonth] || 0;
    const currentMonthCustodians = custodiosPorMes[currentMonth] ? custodiosPorMes[currentMonth].size : 0;

    const monthNames = {
      '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
      '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
      '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    };

    const overallEngagement = allCustodians.size > 0 ? totalServices / allCustodians.size : 0;

    return {
      yearlyData: {
        totalServices,
        totalActiveCustodians: allCustodians.size,
        avgServicesPerCustodian: overallEngagement,
        monthlyEvolution
      },
      currentMonthData: {
        month: monthNames[currentMonth.split('-')[1]] || currentMonth,
        services: currentMonthServices,
        custodians: currentMonthCustodians,
        engagement: currentMonthCustodians > 0 ? currentMonthServices / currentMonthCustodians : 0
      },
      overallEngagement
    };
  }, [serviciosPorMes]);

  return {
    engagementDetails,
    loading: serviciosLoading
  };
};