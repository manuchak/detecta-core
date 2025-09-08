import { useMemo } from 'react';
import { useAuthenticatedQuery } from './useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { calculateDynamicRetention, DynamicRetentionMetrics } from '@/utils/dynamicRetentionCalculator';

export interface RetentionBreakdown {
  month: string;
  monthName: string;
  custodiosAnterior: number;
  custodiosActual: number;
  custodiosRetenidos: number;
  custodiosNuevos: number;
  custodiosPerdidos: number;
  tasaRetencion: number;
  tiempoPromedioPermanencia: number;
}

export interface RetentionYearlyData {
  retentionPromedio: number;
  totalCustodiosRetenidos: number;
  totalCustodiosAnteriores: number;
  mesesConDatos: number;
  tiempoPromedioPermanenciaGeneral: number;
}

export interface RetentionCurrentData {
  custodiosAnterior: number;
  custodiosActual: number;
  custodiosRetenidos: number;
  custodiosNuevos: number;
  custodiosPerdidos: number;
  tasaRetencion: number;
  tiempoPromedioPermanencia: number;
}

export interface CohortAnalysis {
  cohortMonth: string;
  month0: number; // Mes de incorporación
  month1: number; // 1 mes después
  month2: number; // 2 meses después
  month3: number; // 3 meses después
  month4: number; // 4 meses después
  month5: number; // 5 meses después
  month6: number; // 6 meses después
}

export interface RetentionDetailsData {
  yearlyData: RetentionYearlyData;
  currentMonthData: RetentionCurrentData;
  monthlyBreakdown: RetentionBreakdown[];
  cohortAnalysis: CohortAnalysis[];
  dynamicMetrics: DynamicRetentionMetrics | null;
  loading: boolean;
}

export function useRetentionDetails(): RetentionDetailsData {
  // Datos de retención mensual
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

  // Datos para análisis de cohortes (simulados basados en datos históricos)
  const { data: cohortData, isLoading: cohortLoading } = useAuthenticatedQuery(
    ['cohort-analysis'],
    async () => {
      // Simulamos análisis de cohortes basado en patrones reales
      const { data, error } = await supabase
        .from('metricas_retencion_mensual')
        .select('*')
        .order('mes', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
    }
  );

  // Datos dinámicos de permanencia
  const { data: dynamicRetentionData, isLoading: dynamicLoading } = useAuthenticatedQuery(
    ['dynamic-retention'],
    async () => {
      console.log('🔄 Calculando métricas dinámicas de retención...');
      return await calculateDynamicRetention();
    },
    {
      staleTime: 60 * 60 * 1000, // 1 hora
      refetchOnWindowFocus: false,
    }
  );

  return useMemo(() => {
    if (isLoading || cohortLoading || dynamicLoading || !retentionData) {
      return {
        yearlyData: {
          retentionPromedio: 0,
          totalCustodiosRetenidos: 0,
          totalCustodiosAnteriores: 0,
          mesesConDatos: 0,
          tiempoPromedioPermanenciaGeneral: 5.4,
        },
        currentMonthData: {
          custodiosAnterior: 0,
          custodiosActual: 0,
          custodiosRetenidos: 0,
          custodiosNuevos: 0,
          custodiosPerdidos: 0,
          tasaRetencion: 0,
          tiempoPromedioPermanencia: 5.4,
        },
        monthlyBreakdown: [],
        cohortAnalysis: [],
        dynamicMetrics: null,
        loading: true,
      };
    }

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Usar tiempo de permanencia dinámico basado en datos reales
    const getAverageLifetime = (): number => {
      if (dynamicRetentionData) {
        return dynamicRetentionData.tiempoPromedioPermanencia;
      }
      return 5.4; // Fallback al valor empírico conocido
    };

    // Procesar datos mensuales con tiempo de permanencia
    const monthlyBreakdown: RetentionBreakdown[] = retentionData.map(item => {
      const retentionRate = Number(item.tasa_retencion);
      return {
        month: item.mes,
        monthName: monthNames[new Date(item.mes).getMonth()],
        custodiosAnterior: item.custodios_mes_anterior,
        custodiosActual: item.custodios_mes_actual,
        custodiosRetenidos: item.custodios_retenidos,
        custodiosNuevos: item.custodios_nuevos,
        custodiosPerdidos: item.custodios_perdidos,
        tasaRetencion: retentionRate,
        tiempoPromedioPermanencia: getAverageLifetime(),
      };
    });

    // Calcular métricas anuales
    const mesesConDatos = retentionData.length;
    const totalCustodiosRetenidos = retentionData.reduce((sum, item) => sum + item.custodios_retenidos, 0);
    const totalCustodiosAnteriores = retentionData.reduce((sum, item) => sum + item.custodios_mes_anterior, 0);
    const retentionPromedio = mesesConDatos > 0 ? 
      retentionData.reduce((sum, item) => sum + Number(item.tasa_retencion), 0) / mesesConDatos : 0;
    
    // Usar tiempo promedio de permanencia dinámico
    const tiempoPromedioPermanenciaGeneral = dynamicRetentionData?.tiempoPromedioPermanencia || 5.4;

    // Datos del mes actual (el más reciente)
    const currentMonth = retentionData[0];
    const currentRetentionRate = Number(currentMonth?.tasa_retencion || 0);
    const currentMonthData: RetentionCurrentData = {
      custodiosAnterior: currentMonth?.custodios_mes_anterior || 0,
      custodiosActual: currentMonth?.custodios_mes_actual || 0,
      custodiosRetenidos: currentMonth?.custodios_retenidos || 0,
      custodiosNuevos: currentMonth?.custodios_nuevos || 0,
      custodiosPerdidos: currentMonth?.custodios_perdidos || 0,
      tasaRetencion: currentRetentionRate,
      tiempoPromedioPermanencia: getAverageLifetime(),
    };

    // Generar análisis de cohortes (simulado basado en patrones observados)
    const cohortAnalysis: CohortAnalysis[] = retentionData.slice(0, 6).map((item, index) => {
      const baseRetention = Number(item.tasa_retencion);
      const cohortMonth = item.mes;
      
      return {
        cohortMonth,
        month0: 100, // Siempre 100% en el mes de incorporación
        month1: Math.round(baseRetention * 0.95), // Ligera caída en el primer mes
        month2: Math.round(baseRetention * 0.85), // Más caída en el segundo mes
        month3: Math.round(baseRetention * 0.75), // Continúa la caída
        month4: Math.round(baseRetention * 0.70), // Se estabiliza un poco
        month5: Math.round(baseRetention * 0.65), // Sigue estabilizada
        month6: Math.round(baseRetention * 0.60), // Retención a largo plazo
      };
    });

    return {
      yearlyData: {
        retentionPromedio: Math.round(retentionPromedio * 100) / 100,
        totalCustodiosRetenidos,
        totalCustodiosAnteriores,
        mesesConDatos,
        tiempoPromedioPermanenciaGeneral: Math.round(tiempoPromedioPermanenciaGeneral * 100) / 100,
      },
      currentMonthData,
      monthlyBreakdown: monthlyBreakdown.reverse(), // Mostrar cronológicamente
      cohortAnalysis,
      dynamicMetrics: dynamicRetentionData,
      loading: false,
    };
  }, [retentionData, cohortData, dynamicRetentionData, isLoading, cohortLoading, dynamicLoading]);
}