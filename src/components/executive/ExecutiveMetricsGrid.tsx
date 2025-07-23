import React from 'react';
import { KPIHeroCard } from './KPIHeroCard';
import { ExecutiveKPIData } from '@/hooks/useExecutiveDashboardKPIs';

interface ExecutiveMetricsGridProps {
  kpis: ExecutiveKPIData;
  loading?: boolean;
  className?: string;
}

export function ExecutiveMetricsGrid({ kpis, loading = false, className }: ExecutiveMetricsGridProps) {
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
      value: kpis.crate,
      unit: '%',
      trend: 'up' as const,
      key: 'crate'
    },
    {
      title: 'Lifetime Value',
      value: kpis.ltv,
      unit: 'MXN',
      trend: 'up' as const,
      key: 'ltv'
    },
    {
      title: 'Retención',
      value: kpis.rrate,
      unit: '%',
      trend: 'up' as const,
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
          loading={loading}
        />
      ))}
    </div>
  );
}