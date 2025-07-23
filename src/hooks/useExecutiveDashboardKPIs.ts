import { useMemo } from 'react';
import { useUnifiedRecruitmentMetrics } from './useUnifiedRecruitmentMetrics';
import { useFinancialSystem } from './useFinancialSystem';
import { useCohortAnalytics } from './useCohortAnalytics';

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

  const kpis = useMemo(() => {
    if (unifiedLoading || financialSystem.loading || cohortAnalytics.realRotationLoading) {
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

    // CPA: (Costo de staff + costo de activos + costo de MKT) / Número de nuevos afiliados
    const staffCost = 150000; // Placeholder - debería venir de datos reales
    const assetsCost = 50000; // Placeholder - debería venir de datos reales
    const marketingCost = financialSystem.gastosTotales || 0;
    const newAffiliates = unifiedMetrics?.activeCustodians.total || 1;
    const cpa = (staffCost + assetsCost + marketingCost) / newAffiliates;

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
  }, [unifiedMetrics, financialSystem, cohortAnalytics, unifiedLoading]);

  return {
    kpis,
    loading: unifiedLoading || financialSystem.loading || cohortAnalytics.realRotationLoading,
    refreshData: fetchAll,
  };
};