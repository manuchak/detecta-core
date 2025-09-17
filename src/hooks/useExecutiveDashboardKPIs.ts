// @ts-nocheck
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUnifiedRecruitmentMetrics } from './useUnifiedRecruitmentMetrics';
import { useFinancialSystem } from './useFinancialSystem';
import { useCohortAnalytics } from './useCohortAnalytics';
import { useSafeKPIData } from './useSafeKPIData';
import { supabase } from '@/integrations/supabase/client';

export interface ExecutiveKPIData {
  cpa: number;
  crate: number;
  ltv: number;
  rrate: number;
  arate: number;
  nps: number;
  supplyGrowth: number;
  engagement: number;
  roiMkt: number;
  onboardingTime: number;
}

export interface ExecutiveKPIMetrics {
  kpis: ExecutiveKPIData;
  loading: boolean;
  refreshData: () => void;
}

export const useExecutiveDashboardKPIs = (): ExecutiveKPIMetrics => {
  const { metrics: unifiedMetrics, loading: unifiedLoading, fetchAll } = useUnifiedRecruitmentMetrics();
  const financialSystem = useFinancialSystem();
  const cohortAnalytics = useCohortAnalytics();
  const safeKPIs = useSafeKPIData();

  // Obtener gastos reales de la base de datos para calcular CPA mensual
  const { data: gastosReales, isLoading: gastosLoading } = useQuery({
    queryKey: ['gastos-reales-cpa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos_externos')
        .select('concepto, monto, fecha_gasto')
        .gte('fecha_gasto', '2025-01-01')
        .lte('fecha_gasto', '2025-05-31')
        .order('fecha_gasto', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Obtener custodios que hicieron su primer servicio por mes
  const { data: custodiosNuevosPorMes, isLoading: custodiosLoading } = useQuery({
    queryKey: ['custodios-nuevos-por-mes'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_custodios_nuevos_por_mes', {
        fecha_inicio: '2025-01-01',
        fecha_fin: '2025-05-31'
      });
      
      if (error) throw error;
      
      // Convertir a formato esperado por el resto del código
      const custodiosPorMes = {};
      
      if (data && data.length > 0) {
        data.forEach(item => {
          custodiosPorMes[item.mes] = item.nombres_custodios;
        });
      }
      
      return custodiosPorMes;
    },
    staleTime: 5 * 60 * 1000,
  });

  const kpis = useMemo(() => {
    // Usar datos seguros cuando estén disponibles
    if (safeKPIs && !safeKPIs.loading) {
      return {
        cpa: safeKPIs.cpa,
        crate: safeKPIs.conversionRate,
        ltv: safeKPIs.ltv,
        rrate: safeKPIs.retentionRate,
        arate: safeKPIs.activationRate,
        nps: 65,
        supplyGrowth: safeKPIs.supplyGrowth || 12.5,
        engagement: 8.2,
        roiMkt: safeKPIs.roiMarketing || 45.2,
        onboardingTime: 5,
      };
    }
    
    if (unifiedLoading || financialSystem.loading || cohortAnalytics.realRotationLoading || gastosLoading || custodiosLoading) {
      return {
        cpa: 0,
        crate: 0,
        ltv: 0,
        rrate: 0,
        arate: 0,
        nps: 0,
        supplyGrowth: 0,
        engagement: 0,
        roiMkt: 0,
        onboardingTime: 0,
      };
    }

    // Calcular CPA mensual basado en custodios que hicieron su primer servicio cada mes
    let cpaPromedioPonderado = 0;

    if (gastosReales && gastosReales.length > 0 && custodiosNuevosPorMes) {
      // Agrupar gastos por mes
      const gastosPorMes = {};
      
      gastosReales.forEach(gasto => {
        const fecha = new Date(gasto.fecha_gasto);
        const yearMonth = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        
        if (!gastosPorMes[yearMonth]) {
          gastosPorMes[yearMonth] = 0;
        }
        gastosPorMes[yearMonth] += Number(gasto.monto) || 0;
      });

      // Calcular CPA mensual y promedio ponderado
      let totalCostoPonderado = 0;
      let totalCustodiosNuevos = 0;
      let cpaMensual = [];

      Object.keys(gastosPorMes).forEach(mes => {
        const gastosMes = gastosPorMes[mes];
        const custodiosNuevosMes = custodiosNuevosPorMes[mes] ? custodiosNuevosPorMes[mes].length : 0;
        
        if (custodiosNuevosMes > 0) {
          const cpaDelMes = gastosMes / custodiosNuevosMes;
          cpaMensual.push({
            mes,
            cpa: cpaDelMes,
            gastos: gastosMes,
            custodios: custodiosNuevosMes
          });
          
          totalCostoPonderado += gastosMes;
          totalCustodiosNuevos += custodiosNuevosMes;
        }
      });

      // CPA promedio ponderado: Total de costos / Total de custodios nuevos
      cpaPromedioPonderado = totalCustodiosNuevos > 0 ? totalCostoPonderado / totalCustodiosNuevos : 0;
    }

    const cpa = cpaPromedioPonderado;

    // Calcular total de custodios nuevos para otros cálculos
    const totalCustodiosNuevos = custodiosNuevosPorMes ? 
      Object.values(custodiosNuevosPorMes).reduce((total: number, custodios: any) => total + (custodios?.length || 0), 0) : 
      (unifiedMetrics?.activeCustodians.total || 1);

    // Calcular marketing cost total para ROI
    const marketingCost = gastosReales ? 
      gastosReales.filter(g => g.concepto === 'FACEBOOK' || g.concepto === 'INDEED').reduce((sum, g) => sum + (Number(g.monto) || 0), 0) : 
      0;

    // CRATE: (Número de Nuevos Afiliados / Total de Leads) x 100
    const totalLeads = 500; // Placeholder - debería venir de sistema de leads
    const crate = (Number(totalCustodiosNuevos) / totalLeads) * 100;

    // LTV: Valor de vida del cliente (ya calculado)  
    const ltv = 135000; // Placeholder - valor estándar desde KPI definición

    // RRATE: Tasa de retención (95% - ya existente en metrics)
    const rrate = 95; // Placeholder - debería calcularse desde rotación real

    // ARATE: Tasa de activación (95% - ya existente en metrics)
    const arate = 95; // Placeholder - debería calcularse desde datos de activación

    // NPS Afiliación: Net Promoter Score
    const nps = 65; // Placeholder - debería venir de encuestas

    // Supply Growth: (Afiliados Nuevos - Afiliados Perdidos) / Afiliados al Inicio del Período x 100
    const lostAffiliates = Number(cohortAnalytics.realRotation?.retiredCustodiansCount) || 0;
    const initialAffiliates = 500; // Placeholder - debería venir de datos históricos
    const supplyGrowth = ((Number(totalCustodiosNuevos) - lostAffiliates) / initialAffiliates) * 100;

    // Engagement: Servicios promedio por custodio por mes
    const totalServices = (unifiedMetrics?.activeCustodians.total || 0) * 10; // Estimación
    const activeCustodians = unifiedMetrics?.activeCustodians.total || 1;
    const engagement = totalServices / activeCustodians;

    // ROI MKT: Usar datos reales de la función SQL
    const roiMkt = safeKPIs.roiMarketing || 285;

    // Onboarding Time: Tiempo promedio de incorporación en días
    const onboardingTime = 5; // Placeholder - debería venir de datos de proceso

    return {
      cpa: Math.round(cpa),
      crate: Math.round(crate * 100) / 100,
      ltv: Math.round(ltv),
      rrate: Math.round(rrate * 100) / 100,
      arate: Math.round(arate * 100) / 100,
      nps: Math.round(nps),
      supplyGrowth: Math.round(supplyGrowth * 100) / 100,
      engagement: Math.round(engagement * 100) / 100,
      roiMkt: Math.round(roiMkt * 10) / 10,
      onboardingTime: Math.round(onboardingTime * 100) / 100,
    };
  }, [unifiedMetrics, financialSystem, cohortAnalytics, unifiedLoading, gastosReales, custodiosNuevosPorMes, safeKPIs]);

  return {
    kpis,
    loading: (unifiedLoading || financialSystem.loading || cohortAnalytics.realRotationLoading || gastosLoading || custodiosLoading) && safeKPIs.loading,
    refreshData: fetchAll,
  };
};