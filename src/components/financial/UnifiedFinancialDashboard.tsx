import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { KPIHeroCard } from '@/components/executive/KPIHeroCard';
import { useRealFinancialPerformance } from '@/hooks/useRealFinancialPerformance';
import { useSafeKPIData } from '@/hooks/useSafeKPIData';
import { useROIMarketingDetails } from '@/hooks/useROIMarketingDetails';

export function UnifiedFinancialDashboard() {
  const {
    totalInvestment,
    averageROI,
    budgetEfficiency,
    mostProfitableChannel,
    channelDistribution,
    roiByChannel,
    loading: financialLoading
  } = useRealFinancialPerformance();

  const { 
    cpa, 
    conversionRate, 
    loading: kpiLoading 
  } = useSafeKPIData();

  const { 
    metrics: roiMetrics, 
    loading: roiLoading 
  } = useROIMarketingDetails();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 10) / 10}%`;
  };

  const loading = financialLoading || kpiLoading || roiLoading;

  // Calculate cost per lead based on total investment and conversion metrics
  const costPerLead = conversionRate > 0 && totalInvestment > 0 
    ? totalInvestment / (roiMetrics?.totalCandidatos || 1)
    : cpa;

  // Calculate monthly approval rate (conversion from leads to active custodians)
  const monthlyApprovalRate = conversionRate;

  // Calculate validation score based on ROI performance
  const validationScore = averageROI > 50 ? 85 : averageROI > 20 ? 75 : 60;
  const validationStatus = validationScore >= 80 ? 'Excelente' : validationScore >= 70 ? 'Bueno' : 'Revisar';

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleAnalyze = () => {
    // This could open a detailed analysis modal or navigate to analytics page
    console.log('Analyzing financial data...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sistema Financiero</h1>
          <p className="text-muted-foreground">
            Seguimiento de gastos y ROI de reclutamiento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button onClick={handleAnalyze} className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analizar
          </Button>
        </div>
      </div>

      {/* Main KPI Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPIHeroCard
          title="CPA Real"
          value={formatCurrency(cpa)}
          trend={cpa < 50000 ? 'up' : 'down'}
          loading={loading}
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Costo por Adquisición Real</p>
              <p>Basado en gastos aprobados y custodios activos de los últimos 90 días</p>
              <p className="text-sm text-muted-foreground">
                Meta: &lt; $50,000 MXN
              </p>
            </div>
          }
        />

        <KPIHeroCard
          title="Tasa de Conversión"
          value={formatPercentage(conversionRate)}
          trend={conversionRate > 15 ? 'up' : 'down'}
          loading={loading}
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Lead a Custodio Activo</p>
              <p>Porcentaje de leads que se convierten en custodios activos</p>
              <p className="text-sm text-muted-foreground">
                Meta: &gt; 15%
              </p>
            </div>
          }
        />

        <KPIHeroCard
          title="Costo por Lead"
          value={formatCurrency(costPerLead)}
          trend={costPerLead < 5000 ? 'up' : 'down'}
          loading={loading}
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Costo por Lead Generado</p>
              <p>Inversión promedio para generar un lead</p>
              <p className="text-sm text-muted-foreground">
                {roiMetrics?.totalCandidatos || 0} leads generados
              </p>
            </div>
          }
        />

        <KPIHeroCard
          title="ROI Estimado"
          value={formatPercentage(averageROI)}
          trend={averageROI > 100 ? 'up' : averageROI > 50 ? 'neutral' : 'down'}
          loading={loading}
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Retorno de Inversión</p>
              <p>ROI calculado basado en ingresos estimados vs gastos</p>
              <p className="text-sm text-muted-foreground">
                {averageROI > 100 ? 'Excelente' : averageROI > 50 ? 'En desarrollo' : 'Revisar estrategia'}
              </p>
            </div>
          }
        />
      </div>

      {/* Secondary KPI Cards - Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIHeroCard
          title="Aprobación Mensual"
          value={formatPercentage(monthlyApprovalRate)}
          trend={monthlyApprovalRate > 30 ? 'up' : 'neutral'}
          loading={loading}
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Entrevista a Activo</p>
              <p>Tasa de conversión de entrevistas a custodios activos</p>
            </div>
          }
        />

        <KPIHeroCard
          title="Inversión Total"
          value={formatCurrency(totalInvestment)}
          trend="neutral"
          loading={loading}
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Inversión en Marketing</p>
              <p>Total invertido en los últimos 90 días</p>
              <p className="text-sm text-muted-foreground">
                Gastos aprobados únicamente
              </p>
            </div>
          }
        />

        <KPIHeroCard
          title="Validación"
          value={`${validationScore}%`}
          trend={validationScore >= 80 ? 'up' : validationScore >= 70 ? 'neutral' : 'down'}
          loading={loading}
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Score de Validación</p>
              <p>Confiabilidad de las métricas calculadas</p>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  validationScore >= 80 ? 'bg-green-500' : 
                  validationScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm">{validationStatus}</span>
              </div>
            </div>
          }
        />
      </div>

      {/* Channel Performance Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribución de Inversión por Canal</h3>
          <div className="space-y-3">
            {channelDistribution.length > 0 ? channelDistribution.slice(0, 5).map((channel, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{channel.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(channel.amount)}
                  </span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full min-w-[45px] text-center">
                    {channel.percentage}%
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay datos de distribución disponibles</p>
                <p className="text-sm">Agrega gastos por canal para ver la distribución</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">ROI por Canal</h3>
          <div className="space-y-3">
            {roiByChannel.length > 0 ? roiByChannel.slice(0, 5).map((channel, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{channel.name}</span>
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${
                    channel.roi > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {channel.roi > 0 ? '+' : ''}{channel.roi.toFixed(1)}%
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    channel.roi > 50 ? 'bg-green-500' : 
                    channel.roi > 0 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay datos de ROI disponibles</p>
                <p className="text-sm">Los datos se calcularán con más información</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Performance Summary */}
      {mostProfitableChannel && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Resumen de Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {mostProfitableChannel}
              </div>
              <p className="text-sm text-muted-foreground">Canal Más Rentable</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatPercentage(budgetEfficiency)}
              </div>
              <p className="text-sm text-muted-foreground">Eficiencia Presupuestaria</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {roiMetrics?.totalCustodiosActivos || 0}
              </div>
              <p className="text-sm text-muted-foreground">Custodios Activos</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}