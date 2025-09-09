import React from 'react';
import { KPIHeroCard } from './KPIHeroCard';
import { ExecutiveKPIData } from '@/hooks/useExecutiveDashboardKPIs';
import { useCPADetails } from '@/hooks/useCPADetails';
import { useConversionRateDetails } from '@/hooks/useConversionRateDetails';
import { useLTVDetails } from '@/hooks/useLTVDetails';
import { useRetentionDetails } from '@/hooks/useRetentionDetails';
import { useROIMarketingDetails } from '@/hooks/useROIMarketingDetails';
import { useROIMarketingMonthly } from '@/hooks/useROIMarketingMonthly';
import { useEngagementDetails } from '@/hooks/useEngagementDetails';
import { useSupplyGrowthDetails } from '@/hooks/useSupplyGrowthDetails';
import { useServiceCapacity } from '@/hooks/useServiceCapacity';
import { CPATooltip } from './CPATooltip';
import { ConversionRateTooltip } from './ConversionRateTooltip';
import { LTVTooltip } from './LTVTooltip';
import { RetentionTooltip } from './RetentionTooltip';
import { ROIMarketingTooltip } from '../tooltips/ROIMarketingTooltip';
import { EngagementTooltip } from './EngagementTooltip';
import { SupplyGrowthTooltip } from './SupplyGrowthTooltip';
import { ServiceCapacityTooltip } from './ServiceCapacityTooltip';

interface ExecutiveMetricsGridProps {
  kpis: ExecutiveKPIData;
  loading?: boolean;
  className?: string;
  onKPIClick?: (kpiType: string) => void;
}

export function ExecutiveMetricsGrid({ kpis, loading = false, className, onKPIClick }: ExecutiveMetricsGridProps) {
  const { cpaDetails, loading: cpaLoading } = useCPADetails();
  const conversionRateDetails = useConversionRateDetails();
  const ltvDetails = useLTVDetails();
  const retentionDetails = useRetentionDetails();
  const roiMarketingDetails = useROIMarketingDetails();
  const roiMarketingMonthly = useROIMarketingMonthly();
  const engagementDetails = useEngagementDetails();
  const supplyGrowthDetails = useSupplyGrowthDetails();
  const { capacityData, loading: capacityLoading } = useServiceCapacity();

  const kpiConfig = [
    {
      title: 'Costo de Adquisición',
      value: cpaDetails?.currentMonthData?.newCustodians > 0 ? 
        cpaDetails.currentMonthData.cpa : 
        kpis.cpa,
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
      value: supplyGrowthDetails.monthlyData[0]?.crecimientoPorcentual || kpis.supplyGrowth,
      unit: '%',
      trend: (supplyGrowthDetails.monthlyData[0]?.crecimientoPorcentual || kpis.supplyGrowth) > 0 ? 'up' as const : 'down' as const,
      key: 'supplyGrowth'
    },
    {
      title: 'Engagement',
      value: engagementDetails.engagementDetails?.currentMonthData?.engagement || kpis.engagement,
      unit: 'servicios/mes',
      trend: (engagementDetails.engagementDetails?.currentMonthData?.engagement || kpis.engagement) > 10 ? 'up' as const : 'down' as const,
      key: 'engagement'
    },
    {
      title: 'ROI MKT',
      value: roiMarketingMonthly.currentMonthData?.roi || kpis.roiMkt,
      unit: '%',
      trend: (roiMarketingMonthly.currentMonthData?.roi || kpis.roiMkt) > 0 ? 'up' as const : 'down' as const,
      key: 'roiMkt'
    },
    {
      title: 'Tiempo de Onboarding',
      value: kpis.onboardingTime,
      unit: 'días',
      trend: kpis.onboardingTime <= 5 ? 'up' as const : 'down' as const,
      key: 'onboardingTime'
    },
    {
      title: 'Capacidad Diaria',
      value: capacityData.dailyCapacity.total,
      unit: 'servicios',
      trend: capacityData.utilizationMetrics.current <= 75 ? 'up' as const : 
             capacityData.utilizationMetrics.current <= 85 ? 'neutral' as const : 'down' as const,
      key: 'dailyCapacity'
    },
    {
      title: 'Capacidad Mensual',
      value: Math.round(capacityData.monthlyCapacity.total / 1000 * 10) / 10,
      unit: 'K servicios',
      trend: capacityData.alerts.type === 'healthy' ? 'up' as const : 
             capacityData.alerts.type === 'warning' ? 'neutral' as const : 'down' as const,
      key: 'monthlyCapacity'
    },
    {
      title: 'Utilización Saludable',
      value: capacityData.utilizationMetrics.current,
      unit: '%',
      trend: capacityData.utilizationMetrics.current <= 75 ? 'up' as const : 
             capacityData.utilizationMetrics.current <= 85 ? 'neutral' as const : 'down' as const,
      key: 'healthyUtilization'
    },
    {
      title: 'Gap vs Forecast',
      value: Math.abs(capacityData.monthlyCapacity.total - (capacityData.recentServices.total / 3)),
      unit: 'servicios',
      trend: capacityData.monthlyCapacity.total > (capacityData.recentServices.total / 3) ? 'up' as const : 'down' as const,
      key: 'gapForecast'
    },
    {
      title: 'Eficiencia de Flota',
      value: Math.round((capacityData.recentServices.total / 3) / capacityData.monthlyCapacity.total * 100),
      unit: '%',
      trend: (capacityData.recentServices.total / 3) / capacityData.monthlyCapacity.total > 0.6 ? 'up' as const : 'down' as const,
      key: 'fleetEfficiency'
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
          loading={loading || (kpi.key === 'cpa' && cpaLoading) || (kpi.key === 'crate' && conversionRateDetails.loading) || (kpi.key === 'ltv' && ltvDetails.loading) || (kpi.key === 'rrate' && retentionDetails.loading) || (kpi.key === 'roiMkt' && roiMarketingMonthly.loading) || (kpi.key === 'engagement' && engagementDetails.loading) || (kpi.key === 'supplyGrowth' && supplyGrowthDetails.loading) || (['dailyCapacity', 'monthlyCapacity', 'healthyUtilization', 'gapForecast', 'fleetEfficiency'].includes(kpi.key) && capacityLoading)}
          onClick={() => {
            const kpiTypeMap: Record<string, string> = {
              'cpa': 'cpa',
              'crate': 'conversion', 
              'ltv': 'ltv',
              'rrate': 'retention',
              'roiMkt': 'roi',
              'engagement': 'engagement',
              'supplyGrowth': 'supply_growth',
              'dailyCapacity': 'daily_capacity',
              'monthlyCapacity': 'monthly_capacity',
              'healthyUtilization': 'healthy_utilization',
              'gapForecast': 'gap_forecast',
              'fleetEfficiency': 'fleet_efficiency'
            };
            onKPIClick?.(kpiTypeMap[kpi.key] || kpi.key);
          }}
          tooltip={
            kpi.key === 'cpa' && !cpaLoading ? <CPATooltip cpaDetails={cpaDetails} /> :
            kpi.key === 'crate' && !conversionRateDetails.loading ? <ConversionRateTooltip data={conversionRateDetails} /> :
            kpi.key === 'ltv' && !ltvDetails.loading ? <LTVTooltip data={ltvDetails} /> :
            kpi.key === 'rrate' && !retentionDetails.loading ? <RetentionTooltip data={retentionDetails} /> :
            kpi.key === 'roiMkt' && !roiMarketingMonthly.loading ? <ROIMarketingTooltip data={roiMarketingDetails.metrics} /> :
            kpi.key === 'engagement' && !engagementDetails.loading ? <EngagementTooltip data={engagementDetails.engagementDetails} /> :
            kpi.key === 'supplyGrowth' && !supplyGrowthDetails.loading ? <SupplyGrowthTooltip data={supplyGrowthDetails} /> :
            (['dailyCapacity', 'monthlyCapacity', 'healthyUtilization', 'gapForecast', 'fleetEfficiency'].includes(kpi.key) && !capacityLoading) ? <ServiceCapacityTooltip data={capacityData} kpiType={kpi.key} /> :
            undefined
          }
        />
      ))}
    </div>
  );
};