import React from 'react';
import { HistoricalReportData } from '@/types/reports';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  DollarSign, 
  Users, 
  Target, 
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface ExecutiveSummaryProps {
  data: HistoricalReportData;
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: React.ReactNode;
  trendIsGood?: boolean;
}

function KPICard({ title, value, subtitle, trend, trendValue, icon, trendIsGood = true }: KPICardProps) {
  const getTrendColor = () => {
    if (!trend || trend === 'stable') return 'text-muted-foreground';
    const isPositive = trend === 'up' ? trendIsGood : !trendIsGood;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className="report-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
              <TrendIcon className="h-3 w-3" />
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(amount);

  // Extract key metrics
  const cpa = data.cpa?.yearlyData.cpaPromedio ?? 0;
  const ltv = data.ltv?.yearlyData.ltvGeneral ?? 0;
  const ltvCpaRatio = cpa > 0 ? ltv / cpa : 0;
  const retention = data.retention?.yearlyData.retentionPromedio ?? 0;
  const gmv = data.operational?.gmv.total ?? 0;
  const services = data.operational?.services.total ?? 0;
  const custodians = data.retention?.yearlyData.totalCustodiosRetenidos ?? 0;
  const growthRate = data.supplyGrowth?.summary.crecimientoPromedioMensual ?? 0;
  const conversionRate = data.conversion?.yearlyData.conversionRate ?? 0;

  // Determine highlights and alerts
  const highlights: { text: string; type: 'success' | 'warning' | 'info' }[] = [];
  
  if (ltvCpaRatio >= 3) {
    highlights.push({ text: `Ratio LTV/CPA saludable: ${ltvCpaRatio.toFixed(1)}x`, type: 'success' });
  } else if (ltvCpaRatio > 0 && ltvCpaRatio < 3) {
    highlights.push({ text: `Ratio LTV/CPA bajo: ${ltvCpaRatio.toFixed(1)}x (objetivo: ≥3x)`, type: 'warning' });
  }
  
  if (retention >= 80) {
    highlights.push({ text: `Retención excelente: ${retention.toFixed(1)}%`, type: 'success' });
  } else if (retention < 70) {
    highlights.push({ text: `Retención por debajo del objetivo: ${retention.toFixed(1)}%`, type: 'warning' });
  }

  if (growthRate > 5) {
    highlights.push({ text: `Crecimiento mensual sólido: ${growthRate.toFixed(1)}%`, type: 'success' });
  } else if (growthRate < 0) {
    highlights.push({ text: `Decrecimiento en supply: ${growthRate.toFixed(1)}%`, type: 'warning' });
  }

  return (
    <div className="executive-summary space-y-6 p-6 bg-background print:break-after-page">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Resumen Ejecutivo
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Métricas clave del período {data.periodLabel}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.cpa && (
          <KPICard
            title="CPA Promedio"
            value={formatCurrency(cpa)}
            icon={<DollarSign className="h-4 w-4 text-primary" />}
            trend={cpa > 0 ? 'stable' : undefined}
          />
        )}
        
        {data.ltv && (
          <KPICard
            title="LTV"
            value={formatCurrency(ltv)}
            subtitle={`Ratio LTV/CPA: ${ltvCpaRatio.toFixed(1)}x`}
            icon={<Target className="h-4 w-4 text-primary" />}
            trend={data.ltv.momComparison?.tendencia}
            trendValue={data.ltv.momComparison ? `${data.ltv.momComparison.cambioRelativo.toFixed(1)}%` : undefined}
          />
        )}
        
        {data.retention && (
          <KPICard
            title="Retención"
            value={`${retention.toFixed(1)}%`}
            subtitle={`${custodians.toLocaleString()} custodios activos`}
            icon={<Users className="h-4 w-4 text-primary" />}
            trend={retention >= 80 ? 'up' : retention < 70 ? 'down' : 'stable'}
          />
        )}
        
        {data.operational && (
          <KPICard
            title="GMV Total"
            value={formatCurrency(gmv)}
            subtitle={`${services.toLocaleString()} servicios`}
            icon={<BarChart3 className="h-4 w-4 text-primary" />}
            trend={data.operational.comparatives.gmvThisMonth.changePercent > 0 ? 'up' : 
                   data.operational.comparatives.gmvThisMonth.changePercent < 0 ? 'down' : 'stable'}
            trendValue={`${data.operational.comparatives.gmvThisMonth.changePercent.toFixed(1)}%`}
          />
        )}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.supplyGrowth && (
          <KPICard
            title="Crecimiento Mensual"
            value={`${growthRate.toFixed(1)}%`}
            subtitle={`${data.supplyGrowth.summary.custodiosActivosActuales} activos`}
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            trend={growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable'}
          />
        )}
        
        {data.conversion && (
          <KPICard
            title="Tasa Conversión"
            value={`${conversionRate.toFixed(1)}%`}
            subtitle={`${data.conversion.yearlyData.totalNewCustodians} nuevos`}
            icon={<Target className="h-4 w-4 text-primary" />}
          />
        )}
        
        {data.operational && (
          <KPICard
            title="Ticket Promedio"
            value={formatCurrency(data.operational.gmv.aov)}
            icon={<DollarSign className="h-4 w-4 text-primary" />}
            trend={data.operational.comparatives.aovThisMonth.changePercent > 0 ? 'up' : 
                   data.operational.comparatives.aovThisMonth.changePercent < 0 ? 'down' : 'stable'}
            trendValue={`${data.operational.comparatives.aovThisMonth.changePercent.toFixed(1)}%`}
          />
        )}
        
        {data.retention && (
          <KPICard
            title="Permanencia Promedio"
            value={`${data.retention.yearlyData.tiempoPromedioPermanenciaGeneral.toFixed(1)} meses`}
            icon={<Users className="h-4 w-4 text-primary" />}
          />
        )}
      </div>

      {/* Highlights & Alerts */}
      {highlights.length > 0 && (
        <Card className="report-card">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Puntos Destacados
            </h3>
            <div className="space-y-2">
              {highlights.map((highlight, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-2 text-sm ${
                    highlight.type === 'success' ? 'text-green-600' : 
                    highlight.type === 'warning' ? 'text-amber-600' : 
                    'text-muted-foreground'
                  }`}
                >
                  {highlight.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  ) : highlight.type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <Minus className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{highlight.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
