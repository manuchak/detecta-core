import React from 'react';
import { KPIHeroCard } from './KPIHeroCard';
import { ExecutiveKPIData } from '@/hooks/useExecutiveDashboardKPIs';
import { useCPADetails } from '@/hooks/useCPADetails';
import { useConversionRateDetails } from '@/hooks/useConversionRateDetails';
import { useLTVDetails } from '@/hooks/useLTVDetails';
import { useRetentionDetails } from '@/hooks/useRetentionDetails';
import { useROIMarketingDetails } from '@/hooks/useROIMarketingDetails';
import { CPATooltip } from './CPATooltip';
import { ConversionRateTooltip } from './ConversionRateTooltip';
import { LTVTooltip } from './LTVTooltip';
import { RetentionTooltip } from './RetentionTooltip';
import { ROIMarketingTooltip } from '../tooltips/ROIMarketingTooltip';

interface ExecutiveMetricsGridProps {
  kpis: ExecutiveKPIData;
  loading?: boolean;
  className?: string;
}

export function ExecutiveMetricsGrid({ kpis, loading = false, className }: ExecutiveMetricsGridProps) {
  const { cpaDetails, loading: cpaLoading } = useCPADetails();
  const conversionRateDetails = useConversionRateDetails();
  const ltvDetails = useLTVDetails();
  const retentionDetails = useRetentionDetails();
  const roiMarketingDetails = useROIMarketingDetails();

  const kpiConfig = [
    {
      title: 'Costo de Adquisición',
      value: kpis.cpa,
      unit: 'MXN',
      trend: 'neutral' as const,
      key: 'cpa'
    },
    {
      title: 'Tasa de Conversión',
      value: conversionRateDetails.yearlyData.overallConversionRate,
      unit: '%',
      trend: 'up' as const,
      key: 'crate'
    },
    {
      title: 'Lifetime Value',
      value: ltvDetails.yearlyData.ltvGeneral / 1000, // Convertir a K para mostrar como 135.0K
      unit: 'K MXN',
      trend: 'up' as const,
      key: 'ltv'
    },
    {
      title: 'Retención',
      value: retentionDetails.yearlyData.retentionPromedio,
      unit: '%',
      trend: retentionDetails.yearlyData.retentionPromedio >= 90 ? 'up' as const : 
             retentionDetails.yearlyData.retentionPromedio >= 80 ? 'neutral' as const : 'down' as const,
      key: 'rrate'
    },
    {
      title: 'Activación Rate',
      value: kpis.arate,
      unit: '%',
      trend: 'neutral' as const,
      key: 'arate'
    },
    {
      title: 'NPS Afiliación',
      value: kpis.nps,
      unit: '',
      trend: 'up' as const,
      key: 'nps'
    },
    {
      title: 'Supply Growth',
      value: kpis.supplyGrowth,
      unit: '%',
      trend: kpis.supplyGrowth > 0 ? 'up' as const : 'down' as const,
      key: 'supplyGrowth'
    },
    {
      title: 'Engagement',
      value: kpis.engagement,
      unit: 'servicios/mes',
      trend: kpis.engagement > 10 ? 'up' as const : 'down' as const,
      key: 'engagement'
    },
    {
      title: 'ROI MKT',
      value: kpis.roiMkt,
      unit: '%',
      trend: kpis.roiMkt > 0 ? 'up' as const : 'down' as const,
      key: 'roiMkt'
    },
    {
      title: 'Tiempo de Onboarding',
      value: kpis.onboardingTime,
      unit: 'días',
      trend: kpis.onboardingTime <= 5 ? 'up' as const : 'down' as const,
      key: 'onboardingTime'
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 ${className}`}>
      {kpiConfig.map((kpi) => (
        <KPIHeroCard
          key={kpi.key}
          title={kpi.title}
          value={kpi.value}
          unit={kpi.unit}
          trend={kpi.trend}
          loading={loading || (kpi.key === 'cpa' && cpaLoading) || (kpi.key === 'crate' && conversionRateDetails.loading) || (kpi.key === 'ltv' && ltvDetails.loading) || (kpi.key === 'rrate' && retentionDetails.loading) || (kpi.key === 'roiMkt' && roiMarketingDetails.loading)}
          tooltip={
            kpi.key === 'cpa' && !cpaLoading ? <CPATooltip cpaDetails={cpaDetails} /> :
            kpi.key === 'crate' && !conversionRateDetails.loading ? <ConversionRateTooltip data={conversionRateDetails} /> :
            kpi.key === 'ltv' && !ltvDetails.loading ? <LTVTooltip data={ltvDetails} /> :
            kpi.key === 'rrate' && !retentionDetails.loading ? <RetentionTooltip data={retentionDetails} /> :
            kpi.key === 'roiMkt' && !roiMarketingDetails.loading ? <ROIMarketingTooltip data={roiMarketingDetails.metrics} /> :
            undefined
          }
        />
      ))}
    </div>
  );
};