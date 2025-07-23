import { useMemo } from 'react';
import { useAuthenticatedQuery } from './useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';

export interface RetentionBreakdown {
  month: string;
  monthName: string;
  custodiosAnterior: number;
  custodiosActual: number;
  custodiosRetenidos: number;
  custodiosNuevos: number;
  custodiosPerdidos: number;
  tasaRetencion: number;
}

export interface RetentionYearlyData {
  retentionPromedio: number;
  totalCustodiosRetenidos: number;
  totalCustodiosAnteriores: number;
  mesesConDatos: number;
}

export interface RetentionCurrentData {
  custodiosAnterior: number;
  custodiosActual: number;
  custodiosRetenidos: number;
  custodiosNuevos: number;
  custodiosPerdidos: number;
  tasaRetencion: number;
}

export interface RetentionDetailsData {
  yearlyData: RetentionYearlyData;
  currentMonthData: RetentionCurrentData;
  monthlyBreakdown: RetentionBreakdown[];
  loading: boolean;
}

export function useRetentionDetails(): RetentionDetailsData {
  const { data: retentionData, isLoading } = useAuthenticatedQuery(
    ['retention-details'],
    async () => {
      console.log('🔄 Obteniendo datos de retención...');
      
      const { data, error } = await supabase
        .from('metricas_retencion_mensual')
        .select('*')
        .order('mes', { ascending: false })
        .limit(12); // Últimos 12 meses
      
      if (error) {
        console.error('❌ Error al obtener datos de retención:', error);
        throw error;
      }
      
      console.log('✅ Datos de retención obtenidos:', data?.length, 'registros');
      return data || [];
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
    }
  );

  return useMemo(() => {
    if (isLoading || !retentionData) {
      return {
        yearlyData: {
          retentionPromedio: 0,
          totalCustodiosRetenidos: 0,
          totalCustodiosAnteriores: 0,
          mesesConDatos: 0,
        },
        currentMonthData: {
          custodiosAnterior: 0,
          custodiosActual: 0,
          custodiosRetenidos: 0,
          custodiosNuevos: 0,
          custodiosPerdidos: 0,
          tasaRetencion: 0,
        },
        monthlyBreakdown: [],
        loading: true,
      };
    }

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Procesar datos mensuales
    const monthlyBreakdown: RetentionBreakdown[] = retentionData.map(item => ({
      month: item.mes,
      monthName: monthNames[new Date(item.mes).getMonth()],
      custodiosAnterior: item.custodios_mes_anterior,
      custodiosActual: item.custodios_mes_actual,
      custodiosRetenidos: item.custodios_retenidos,
      custodiosNuevos: item.custodios_nuevos,
      custodiosPerdidos: item.custodios_perdidos,
      tasaRetencion: Number(item.tasa_retencion),
    }));

    // Calcular métricas anuales
    const mesesConDatos = retentionData.length;
    const totalCustodiosRetenidos = retentionData.reduce((sum, item) => sum + item.custodios_retenidos, 0);
    const totalCustodiosAnteriores = retentionData.reduce((sum, item) => sum + item.custodios_mes_anterior, 0);
    const retentionPromedio = mesesConDatos > 0 ? 
      retentionData.reduce((sum, item) => sum + Number(item.tasa_retencion), 0) / mesesConDatos : 0;

    // Datos del mes actual (el más reciente)
    const currentMonth = retentionData[0];
    const currentMonthData: RetentionCurrentData = {
      custodiosAnterior: currentMonth?.custodios_mes_anterior || 0,
      custodiosActual: currentMonth?.custodios_mes_actual || 0,
      custodiosRetenidos: currentMonth?.custodios_retenidos || 0,
      custodiosNuevos: currentMonth?.custodios_nuevos || 0,
      custodiosPerdidos: currentMonth?.custodios_perdidos || 0,
      tasaRetencion: Number(currentMonth?.tasa_retencion || 0),
    };

    return {
      yearlyData: {
        retentionPromedio: Math.round(retentionPromedio * 100) / 100,
        totalCustodiosRetenidos,
        totalCustodiosAnteriores,
        mesesConDatos,
      },
      currentMonthData,
      monthlyBreakdown: monthlyBreakdown.reverse(), // Mostrar cronológicamente
      loading: false,
    };
  }, [retentionData, isLoading]);
}