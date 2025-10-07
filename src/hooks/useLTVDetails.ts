import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateDynamicRetention } from '@/utils/dynamicRetentionCalculator';

export interface LTVBreakdown {
  month: string;
  custodiosActivos: number;
  ingresosTotales: number;
  ingresoPromedioPorCustodio: number;
  ltvCalculado: number;
}

export interface LTVDetails {
  yearlyData: {
    totalCustodios: number;
    ingresosTotales: number;
    ingresoPromedioPorCustodio: number;
    ltvGeneral: number;
    monthlyBreakdown: LTVBreakdown[];
  };
  currentMonthData: {
    month: string;
    custodiosActivos: number;
    ingresosTotales: number;
    ingresoPromedioPorCustodio: number;
    ltvCalculado: number;
  };
  tiempoVidaPromedio: number;
  loading: boolean;
}

export const useLTVDetails = (): LTVDetails => {
  // Obtener permanencia empírica dinámica
  const { data: dynamicRetention } = useQuery({
    queryKey: ['dynamic-retention-ltv'],
    queryFn: async () => await calculateDynamicRetention(),
    staleTime: 60 * 60 * 1000, // 1 hora
  });

  // Obtener servicios completados por mes para calcular LTV
  const { data: serviciosPorMes, isLoading: serviciosLoading } = useQuery({
    queryKey: ['servicios-ltv-details'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('bypass_rls_get_servicios', { max_records: 10000 });
      
      if (error) throw error;
      
      // Agrupar servicios por mes y custodio
      const serviciosPorMes: { [key: string]: { custodios: Set<string>, ingresos: number } } = {};
      
      if (data && data.length > 0) {
        data
          .filter(servicio => 
            servicio.fecha_hora_cita && 
            servicio.nombre_custodio && 
            servicio.estado?.toLowerCase() === 'finalizado' &&
            servicio.cobro_cliente > 0
          )
          .forEach(servicio => {
            const fecha = new Date(servicio.fecha_hora_cita);
            // Usar el período real de datos (jun-ago 2025)
            if (fecha >= new Date('2025-06-01') && fecha <= new Date('2025-08-31')) {
              const yearMonth = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
              
              if (!serviciosPorMes[yearMonth]) {
                serviciosPorMes[yearMonth] = {
                  custodios: new Set(),
                  ingresos: 0
                };
              }
              
              serviciosPorMes[yearMonth].custodios.add(servicio.nombre_custodio);
              serviciosPorMes[yearMonth].ingresos += Number(servicio.cobro_cliente) || 0;
            }
          });
      }
      
      // Convertir Set a array para facilitar el conteo
      const result: { [key: string]: { custodiosActivos: number, ingresos: number } } = {};
      Object.keys(serviciosPorMes).forEach(mes => {
        result[mes] = {
          custodiosActivos: serviciosPorMes[mes].custodios.size,
          ingresos: serviciosPorMes[mes].ingresos
        };
      });
      
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  const ltvDetails = useMemo(() => {
    // Usar permanencia MEDIANA del calculador dinámico (custodio típico, no promedio inflado)
    const tiempoVidaPromedio = dynamicRetention?.tiempoMedianoPermanencia || 4.83;

    if (serviciosLoading || !serviciosPorMes) {
      return {
        yearlyData: {
          totalCustodios: 0,
          ingresosTotales: 0,
          ingresoPromedioPorCustodio: 0,
          ltvGeneral: 0,
          monthlyBreakdown: [],
        },
        currentMonthData: {
          month: '',
          custodiosActivos: 0,
          ingresosTotales: 0,
          ingresoPromedioPorCustodio: 0,
          ltvCalculado: 0,
        },
        tiempoVidaPromedio: tiempoVidaPromedio,
        loading: true,
      };
    }

    // Obtener todos los meses del período real de datos
    const allMonths = ['2025-06', '2025-07', '2025-08'];
    const monthNames = ['Junio', 'Julio', 'Agosto'];
    
    let totalCustodiosUnicos = new Set<string>();
    let ingresosTotalesAcumulados = 0;
    const monthlyBreakdown: LTVBreakdown[] = [];

    // Calcular datos mensuales y acumular totales
    allMonths.forEach((month, index) => {
      const monthData = serviciosPorMes[month] || { custodiosActivos: 0, ingresos: 0 };
      const ingresoPromedioPorCustodio = monthData.custodiosActivos > 0 ? 
        monthData.ingresos / monthData.custodiosActivos : 0;
      
      // LTV empírico = Ingreso promedio mensual * permanencia empírica dinámica
      const ltvCalculado = Math.round(ingresoPromedioPorCustodio * tiempoVidaPromedio);
      
      ingresosTotalesAcumulados += monthData.ingresos;

      monthlyBreakdown.push({
        month: monthNames[index],
        custodiosActivos: monthData.custodiosActivos,
        ingresosTotales: Math.round(monthData.ingresos),
        ingresoPromedioPorCustodio: Math.round(ingresoPromedioPorCustodio),
        ltvCalculado: ltvCalculado,
      });
    });

    // Calcular totales únicos (para evitar contar el mismo custodio múltiples veces)
    const custodiosUnicosCount = Object.values(serviciosPorMes).reduce((acc, monthData) => {
      return acc + monthData.custodiosActivos;
    }, 0);

    const ingresoPromedioPorCustodioGeneral = custodiosUnicosCount > 0 ? 
      ingresosTotalesAcumulados / custodiosUnicosCount : 0;
    
    // LTV general usando permanencia empírica dinámica
    const ltvGeneral = Math.round(ingresoPromedioPorCustodioGeneral * tiempoVidaPromedio);

    // Datos del mes actual (Agosto 2025)
    const currentMonth = '2025-08';
    const currentMonthData = serviciosPorMes[currentMonth] || { custodiosActivos: 0, ingresos: 0 };
    const currentIngresoPromedio = currentMonthData.custodiosActivos > 0 ? 
      currentMonthData.ingresos / currentMonthData.custodiosActivos : 0;
    const currentLTV = Math.round(currentIngresoPromedio * tiempoVidaPromedio);

    return {
      yearlyData: {
        totalCustodios: custodiosUnicosCount,
        ingresosTotales: Math.round(ingresosTotalesAcumulados),
        ingresoPromedioPorCustodio: Math.round(ingresoPromedioPorCustodioGeneral),
        ltvGeneral: ltvGeneral,
        monthlyBreakdown,
      },
      currentMonthData: {
        month: 'Agosto 2025',
        custodiosActivos: currentMonthData.custodiosActivos,
        ingresosTotales: Math.round(currentMonthData.ingresos),
        ingresoPromedioPorCustodio: Math.round(currentIngresoPromedio),
        ltvCalculado: currentLTV,
      },
      tiempoVidaPromedio: tiempoVidaPromedio,
      loading: false,
    };
  }, [serviciosPorMes, serviciosLoading, dynamicRetention]);

  return {
    ...ltvDetails,
    loading: serviciosLoading,
  };
};