import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUnifiedRecruitmentMetrics } from './useUnifiedRecruitmentMetrics';
import { useFinancialSystem } from './useFinancialSystem';
import { useCohortAnalytics } from './useCohortAnalytics';
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

  // Obtener gastos reales de la base de datos para calcular CPA
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

  const kpis = useMemo(() => {
    if (unifiedLoading || financialSystem.loading || cohortAnalytics.realRotationLoading || gastosLoading) {
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

    // Calcular CPA con datos reales de gastos
    let staffCost = 0;
    let technologyCost = 0; // GPS + PLATAFORMA
    let recruitmentCost = 0; // TOXICOLOGÍA + EVALUACIONES
    let marketingCost = 0; // FACEBOOK

    if (gastosReales && gastosReales.length > 0) {
      gastosReales.forEach(gasto => {
        const monto = Number(gasto.monto) || 0;
        switch (gasto.concepto) {
          case 'STAFF':
            staffCost += monto;
            break;
          case 'GPS':
          case 'PLATAFORMA':
            technologyCost += monto;
            break;
          case 'TOXICOLOGÍA':
          case 'EVALUACIONES':
            recruitmentCost += monto;
            break;
          case 'FACEBOOK':
            marketingCost += monto;
            break;
        }
      });
    }

    // CPA: (Costo total de adquisición) / Número de nuevos afiliados
    const totalAcquisitionCost = staffCost + technologyCost + recruitmentCost + marketingCost;
    const newAffiliates = unifiedMetrics?.activeCustodians.total || 1;
    const cpa = totalAcquisitionCost / newAffiliates;

    // CRATE: (Número de Nuevos Afiliados / Total de Leads) x 100
    const totalLeads = 500; // Placeholder - debería venir de sistema de leads
    const crate = (newAffiliates / totalLeads) * 100;

    // LTV: Valor de vida del cliente (ya calculado)  
    const ltv = 135000; // Placeholder - valor estándar desde KPI definición

    // RRATE: Tasa de retención (95% - ya existente en metrics)
    const rrate = 95; // Placeholder - debería calcularse desde rotación real

    // ARATE: Tasa de activación (95% - ya existente en metrics)
    const arate = 95; // Placeholder - debería calcularse desde datos de activación

    // NPS Afiliación: Net Promoter Score
    const nps = 65; // Placeholder - debería venir de encuestas

    // Supply Growth: (Afiliados Nuevos - Afiliados Perdidos) / Afiliados al Inicio del Período x 100
    const lostAffiliates = cohortAnalytics.realRotation?.retiredCustodiansCount || 0;
    const initialAffiliates = 500; // Placeholder - debería venir de datos históricos
    const supplyGrowth = ((newAffiliates - lostAffiliates) / initialAffiliates) * 100;

    // Engagement: Servicios promedio por custodio por mes
    const totalServices = unifiedMetrics?.activeCustodians.total * 10 || 0; // Estimación
    const activeCustodians = unifiedMetrics?.activeCustodians.total || 1;
    const engagement = totalServices / activeCustodians;

    // ROI MKT: (Ingresos generados por marketing - Inversión marketing) / Inversión marketing x 100
    const marketingRevenue = ltv * newAffiliates * 0.3; // 30% atribuible a marketing
    const roiMkt = ((marketingRevenue - marketingCost) / marketingCost) * 100;

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
      roiMkt: Math.round(roiMkt * 100) / 100,
      onboardingTime: Math.round(onboardingTime * 100) / 100,
    };
  }, [unifiedMetrics, financialSystem, cohortAnalytics, unifiedLoading, gastosReales]);

  return {
    kpis,
    loading: unifiedLoading || financialSystem.loading || cohortAnalytics.realRotationLoading || gastosLoading,
    refreshData: fetchAll,
  };
};