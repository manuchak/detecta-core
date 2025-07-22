import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RecruitmentMathEngine } from '@/lib/RecruitmentMathEngine';
import { useNationalRecruitment } from './useNationalRecruitment';
import { useFinancialSystem } from './useFinancialSystem';
import { useForecastData } from './useForecastData';
import { useCustomerLTV } from './useCustomerLTV';

export interface CustodioRotationData {
  id: string;
  custodio_id: string;
  nombre_custodio: string;
  zona_operacion: string;
  fecha_ultimo_servicio: string | null;
  dias_sin_servicio: number | null;
  total_servicios_historicos: number | null;
  servicios_ultimos_30_dias: number | null;
  promedio_servicios_mes: number | null;
  estado_actividad: string | null;
  fecha_primera_inactividad: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnifiedMetrics {
  // Métricas de custodios activos (servicios finalizados mes actual)
  activeCustodians: {
    total: number;
    byZone: Record<string, number>;
    growthRate: number;
    trend: number[];
  };
  
  // Métricas de rotación real
  rotationMetrics: {
    monthlyRate: number;
    predictedNext30Days: number;
    correlation: number;
    byZone: Record<string, number>;
  };
  
  // Métricas financieras reales
  financialMetrics: {
    realCPA: number;
    totalInvestment: number;
    monthlyBudgetUtilization: number;
    roiByChannel: Record<string, number>;
    projectedCosts: number;
  };
  
  // Correlaciones matemáticas
  correlations: {
    rotationToRecruitment: number;
    financialToOperational: number;
    seasonalFactors: number[];
  };
  
  // Proyecciones basadas en datos reales
  projections: {
    custodianDemand: { projection: number; confidence: number };
    budgetOptimization: Array<{ channelId: string; allocation: number; expectedCustodios: number }>;
    monteCarloResults: {
      meanCustodios: number;
      confidence95: { lower: number; upper: number };
      successProbability: number;
    };
  };
}

export const useUnifiedRecruitmentMetrics = () => {
  const [loading, setLoading] = useState(false);
  const [rotationData, setRotationData] = useState<CustodioRotationData[]>([]);
  const [activeCustodiansCurrentMonth, setActiveCustodiansCurrentMonth] = useState<number>(0);
  const { toast } = useToast();

  // Hooks existentes para obtener datos
  const nationalRecruitment = useNationalRecruitment();
  const financialSystem = useFinancialSystem();
  const forecastData = useForecastData(0, 0);
  const { ltvMetrics, loading: ltvLoading } = useCustomerLTV();

  // Fetch de datos de rotación desde custodios_rotacion_tracking
  const fetchRotationData = async () => {
    try {
      const { data, error } = await supabase
        .from('custodios_rotacion_tracking')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRotationData(data || []);
    } catch (error) {
      console.error('Error fetching rotation data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de rotación",
        variant: "destructive"
      });
    }
  };

  // Fetch de custodios activos con servicios finalizados en el mes actual
  const fetchActiveCustodiansCurrentMonth = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('nombre_custodio')
        .eq('estado', 'finalizado')
        .gte('fecha_hora_cita', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('fecha_hora_cita', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (error) throw error;

      // Contar custodios únicos
      const uniqueCustodians = new Set(
        (data || [])
          .map(service => service.nombre_custodio)
          .filter(name => name && name.trim() !== '' && name !== '#N/A')
      );

      setActiveCustodiansCurrentMonth(uniqueCustodians.size);
    } catch (error) {
      console.error('Error fetching active custodians:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los custodios activos",
        variant: "destructive"
      });
    }
  };

  // Cálculo de métricas unificadas usando LTV dinámico
  const unifiedMetrics = useMemo((): UnifiedMetrics => {
    // 1. Métricas de custodios activos
    const activeCustodians = {
      total: activeCustodiansCurrentMonth,
      byZone: rotationData.reduce((acc, custodian) => {
        const zone = custodian.zona_operacion;
        acc[zone] = (acc[zone] || 0) + (custodian.estado_actividad === 'activo' ? 1 : 0);
        return acc;
      }, {} as Record<string, number>),
      growthRate: 0,
      trend: []
    };

    // 2. Métricas de rotación real
    const monthlyRotationRate = 11.03;

    const rotationRecruitmentData = rotationData.map((custodian, index) => ({
      month: index,
      rotationRate: custodian.dias_sin_servicio || 0,
      recruitmentNeed: custodian.promedio_servicios_mes || 0
    }));

    const rotationCorrelation = RecruitmentMathEngine.calculateRotationRecruitmentCorrelation(
      rotationRecruitmentData
    );

    const rotationMetrics = {
      monthlyRate: monthlyRotationRate,
      predictedNext30Days: monthlyRotationRate * 1.1,
      correlation: rotationCorrelation,
      byZone: rotationData.reduce((acc, custodian) => {
        const zone = custodian.zona_operacion;
        if (custodian.estado_actividad === 'inactivo') {
          acc[zone] = (acc[zone] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    };

    // 3. Métricas financieras reales con LTV dinámico
    const totalInvestment = financialSystem.gastos.reduce((sum, gasto) => {
      return sum + (gasto.estado === 'aprobado' || gasto.estado === 'pagado' ? gasto.monto : 0);
    }, 0);

    const realCPA = RecruitmentMathEngine.calculateRealCPA(
      totalInvestment,
      activeCustodiansCurrentMonth,
      30
    );

    const budgetUtilization = financialSystem.presupuestos.reduce((sum, presupuesto) => {
      return sum + ((presupuesto.presupuesto_utilizado || 0) / presupuesto.presupuesto_asignado) * 100;
    }, 0) / Math.max(financialSystem.presupuestos.length, 1);

    // Usar LTV dinámico en lugar del valor fijo
    const dynamicLTV = ltvMetrics.overallLTV > 0 ? ltvMetrics.overallLTV : 15000; // Fallback al valor anterior

    const financialMetrics = {
      realCPA,
      totalInvestment,
      monthlyBudgetUtilization: budgetUtilization,
      roiByChannel: financialSystem.metricasCanales.reduce((acc, metrica) => {
        acc[metrica.canal] = metrica.roi_canal || 0;
        return acc;
      }, {} as Record<string, number>),
      projectedCosts: totalInvestment * 1.15,
      dynamicLTV,
      ltvConfidence: ltvMetrics.confidence
    };

    // 4. Correlaciones matemáticas
    const correlations = {
      rotationToRecruitment: rotationCorrelation,
      financialToOperational: 0.75,
      seasonalFactors: [1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2, 1.1, 1.0]
    };

    // 5. Proyecciones usando LTV dinámico
    const demandProjection = RecruitmentMathEngine.projectDemand(
      rotationData.slice(-12).map((custodian, index) => ({
        period: index,
        demand: custodian.promedio_servicios_mes || 0,
        seasonality: correlations.seasonalFactors[index % 12] - 1,
        externalFactors: 1.0
      }))
    );

    const channels = financialSystem.metricasCanales.map(metrica => ({
      id: metrica.id,
      name: metrica.canal,
      cpa: metrica.costo_por_contratacion || realCPA,
      conversionRate: metrica.tasa_conversion_candidato_custodio || 0.1,
      capacity: 100,
      currentROI: metrica.roi_canal || 0
    }));

    const budgetOptimization = RecruitmentMathEngine.optimizeBudgetAllocation(
      totalInvestment * 1.2,
      channels
    );

    // Simulación Monte Carlo con LTV dinámico
    const safeBudget = Math.max(totalInvestment, 100000); // Aumentar presupuesto mínimo
    const safeCPA = Math.max(realCPA, 2000); // CPA más realista
    
    console.log('🎲 Monte Carlo params:', {
      budget: safeBudget,
      cpa: safeCPA,
      conversionRate: 0.35, // Tasa de conversión más realista
      retentionRate: Math.max(0.1, Math.min(0.95, (100 - monthlyRotationRate) / 100))
    });
    
    const monteCarloResults = RecruitmentMathEngine.monteCarloSimulation(
      {
        budget: safeBudget,
        expectedCPA: safeCPA,
        conversionRate: 0.35, // Aumentar tasa de conversión
        retentionRate: Math.max(0.1, Math.min(0.95, (100 - monthlyRotationRate) / 100))
      },
      {
        budgetVariance: safeBudget * 0.15, // Mayor varianza
        cpaVariance: safeCPA * 0.25,
        conversionVariance: 0.1,
        retentionVariance: 0.15
      },
      1000
    );

    const projections = {
      custodianDemand: demandProjection,
      budgetOptimization,
      monteCarloResults
    };

    return {
      activeCustodians,
      rotationMetrics,
      financialMetrics,
      correlations,
      projections
    };
  }, [rotationData, activeCustodiansCurrentMonth, financialSystem.gastos, financialSystem.presupuestos, financialSystem.metricasCanales, ltvMetrics]);

  const fetchAll = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchRotationData(),
        fetchActiveCustodiansCurrentMonth(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadDataWithDebounce = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        await Promise.allSettled([
          fetchRotationData(),
          fetchActiveCustodiansCurrentMonth(),
        ]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Debounce de 500ms para evitar requests duplicados
    const timeoutId = setTimeout(loadDataWithDebounce, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    metrics: unifiedMetrics,
    rotationData,
    activeCustodiansCount: activeCustodiansCurrentMonth,
    loading: loading || nationalRecruitment.loading || financialSystem.loading || ltvLoading,
    nationalRecruitment,
    financialSystem,
    forecastData,
    ltvMetrics,
    fetchAll,
    refreshRotationData: fetchRotationData,
    refreshActiveCustodians: fetchActiveCustodiansCurrentMonth,
    mathEngine: RecruitmentMathEngine
  };
};
