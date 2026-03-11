import React, { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePerformanceHistorico } from '@/hooks/usePerformanceHistorico';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Route,
  Target,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { useOperationalMetrics } from '@/hooks/useOperationalMetrics';
import { OperationalHeroBar } from './OperationalHeroBar';
import { DoDTrendChart } from './DoDTrendChart';
import { OperationalAlerts } from './OperationalAlerts';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const OperationalOverview = () => {
  const { data: metrics, isLoading } = useOperationalMetrics();
  const { data: historicoData } = usePerformanceHistorico();
  const isMobile = useIsMobile();

  const realTrendData = useMemo(() => {
    if (!historicoData?.daily) return [];
    return historicoData.daily.map(d => ({
      fecha: d.label,
      fechaLabel: d.label,
      solicitados: d.total,
      realizados: Math.round(d.total * d.fillRate / 100),
      fillRate: d.fillRate,
      aTiempo: Math.round(d.total * d.onTimeRate / 100),
      conRetraso: Math.round(d.total * (100 - d.onTimeRate) / 100),
      otpRate: d.onTimeRate,
    }));
  }, [historicoData?.daily]);
  
  const { currentMonthLabel, quarterLabel, mtdLabel, previousMonthLabel } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.ceil((currentMonth + 1) / 3);
    const previousQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
    const currentDay = now.getDate() - 1;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    return {
      currentMonthLabel: `${MONTH_NAMES[currentMonth]} ${currentYear}`,
      quarterLabel: `Q${currentQuarter} vs Q${previousQuarter}`,
      mtdLabel: `MTD día ${currentDay}`,
      previousMonthLabel: MONTH_NAMES[prevMonth]
    };
  }, []);

  if (isLoading || !metrics || !metrics.comparatives || metrics.servicesDistribution?.completedCount === undefined) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const heroMetrics = {
    fillRate: {
      label: 'Fill Rate MTD',
      value: `${metrics.fillRate.mtd}%`,
      actual: metrics.fillRate.mtd,
      target: metrics.fillRate.target,
      change: metrics.fillRate.changeVsPrevMonth,
      changeLabel: `vs ${previousMonthLabel}`,
    },
    onTimePerformance: {
      label: 'On-Time MTD',
      value: `${metrics.onTimePerformance.mtd}%`,
      actual: metrics.onTimePerformance.mtd,
      target: metrics.onTimePerformance.target,
      change: metrics.onTimePerformance.changePercent,
      changeLabel: `vs ${previousMonthLabel}`,
    },
    servicesMTD: {
      label: 'Servicios MTD',
      value: metrics.comparatives.servicesThisMonth.current.toLocaleString(),
      actual: metrics.comparatives.servicesThisMonth.current,
      change: metrics.comparatives.servicesThisMonth.changePercent,
      changeLabel: `vs ${previousMonthLabel}`,
    },
    gmvMTD: {
      label: 'GMV MTD',
      value: formatCurrency(metrics.comparatives.totalGMV.current),
      actual: metrics.comparatives.totalGMV.current,
      change: metrics.comparatives.totalGMV.changePercent,
      changeLabel: `vs ${previousMonthLabel}`,
    },
  };

  const secondaryKpis = [
    {
      title: 'Cmpl',
      fullTitle: 'Tasa Cumplimiento',
      value: `${metrics.comparatives.completionRate.current}%`,
      trend: `${metrics.comparatives.completionRate.changePercent >= 0 ? '+' : ''}${metrics.comparatives.completionRate.changePercent}%`,
      trendPositive: metrics.comparatives.completionRate.changePercent >= 0,
      icon: CheckCircle,
    },
    {
      title: 'Cust',
      fullTitle: 'Custodios Activos',
      value: metrics.comparatives.activeCustodiansMonth.current.toLocaleString(),
      trend: `${metrics.comparatives.activeCustodiansMonth.changePercent >= 0 ? '+' : ''}${metrics.comparatives.activeCustodiansMonth.changePercent}%`,
      trendPositive: metrics.comparatives.activeCustodiansMonth.changePercent >= 0,
      icon: Users,
    },
    {
      title: 'AOV',
      fullTitle: 'AOV',
      value: formatCurrency(metrics.comparatives.averageAOV.current),
      trend: `${metrics.comparatives.averageAOV.changePercent >= 0 ? '+' : ''}${metrics.comparatives.averageAOV.changePercent}%`,
      trendPositive: metrics.comparatives.averageAOV.changePercent >= 0,
      icon: DollarSign,
    },
    {
      title: 'KM',
      fullTitle: 'KM Promedio',
      value: metrics.comparatives.averageKmPerService.current.toLocaleString(),
      trend: `${metrics.comparatives.averageKmPerService.changePercent >= 0 ? '+' : ''}${metrics.comparatives.averageKmPerService.changePercent}%`,
      trendPositive: metrics.comparatives.averageKmPerService.changePercent >= 0,
      icon: Route,
    },
  ];

  // Mobile compact alert banner
  const criticalCount = metrics.alerts.filter(a => a.type === 'critical').length;
  const warningCount = metrics.alerts.filter(a => a.type === 'warning').length;

  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Section 1: Hero Bar */}
        <OperationalHeroBar
          fillRate={heroMetrics.fillRate}
          onTimePerformance={heroMetrics.onTimePerformance}
          servicesMTD={heroMetrics.servicesMTD}
          gmvMTD={heroMetrics.gmvMTD}
        />

        {/* Section 2: Secondary KPIs as compact pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {secondaryKpis.map((kpi, index) => (
            <div
              key={index}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-border/50"
            >
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-foreground leading-tight">{kpi.value}</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{kpi.title}</span>
              </div>
              <span className={`text-[10px] font-medium ${
                kpi.trendPositive 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-destructive'
              }`}>
                {kpi.trend}
              </span>
            </div>
          ))}
        </div>

        {/* Section 3: Alert banner (1 line) */}
        {(criticalCount > 0 || warningCount > 0) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                <AlertCircle className="h-3 w-3" />
                {criticalCount} crítica{criticalCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-warning">
                <AlertTriangle className="h-3 w-3" />
                {warningCount} aviso{warningCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Section 4: Compact 7d Trend Chart */}
        <DoDTrendChart 
          data={realTrendData}
          fillRateTarget={95}
          otpTarget={95}
        />

        {/* Section 5: Services inline */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-card border border-border/50">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.servicesDistribution.completedCount.toLocaleString()}
            </span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {metrics.servicesDistribution.pendingCount.toLocaleString()}
            </span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-sm font-bold text-destructive">
              {metrics.servicesDistribution.cancelledCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Section 6: Top 3 Custodians compact */}
        <Card>
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-3.5 w-3.5" />
              Top 3 Custodios
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-1.5">
              {metrics.topCustodians.slice(0, 3).map((custodian, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between py-1.5 px-2 rounded-md ${
                    index === 0 
                      ? 'bg-amber-50 dark:bg-amber-950/20' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-4 text-center ${
                      index === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-xs font-medium truncate max-w-[120px]">{custodian.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{custodian.services}sv</span>
                    <span className="font-medium text-foreground">{formatCurrency(custodian.gmv)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Desktop layout (unchanged)
  return (
    <div className="space-y-6">
      <OperationalHeroBar
        fillRate={heroMetrics.fillRate}
        onTimePerformance={heroMetrics.onTimePerformance}
        servicesMTD={heroMetrics.servicesMTD}
        gmvMTD={heroMetrics.gmvMTD}
      />

      <DoDTrendChart 
        data={metrics.dailyTrend}
        fillRateTarget={95}
        otpTarget={90}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {secondaryKpis.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Badge 
                        className={`text-xs px-1.5 py-0 ${
                          kpi.trendPositive 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {kpi.trend}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.fullTitle}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          <OperationalAlerts alerts={metrics.alerts} maxAlerts={4} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Estado de Servicios MTD
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">Completados</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    className={`text-xs px-1.5 py-0 ${
                      metrics.servicesDistribution.completedChange >= 0 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {metrics.servicesDistribution.completedChange >= 0 ? '+' : ''}{metrics.servicesDistribution.completedChange}%
                  </Badge>
                  <span className="text-sm font-medium">{metrics.servicesDistribution.completed}%</span>
                  <div className="w-20">
                    <Progress value={metrics.servicesDistribution.completed} className="h-2" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Pendientes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    className={`text-xs px-1.5 py-0 ${
                      metrics.servicesDistribution.pendingChange <= 0 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {metrics.servicesDistribution.pendingChange >= 0 ? '+' : ''}{metrics.servicesDistribution.pendingChange}%
                  </Badge>
                  <span className="text-sm font-medium">{metrics.servicesDistribution.pending}%</span>
                  <div className="w-20">
                    <Progress value={metrics.servicesDistribution.pending} className="h-2" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Cancelados</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    className={`text-xs px-1.5 py-0 ${
                      metrics.servicesDistribution.cancelledChange <= 0 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {metrics.servicesDistribution.cancelledChange >= 0 ? '+' : ''}{metrics.servicesDistribution.cancelledChange}%
                  </Badge>
                  <span className="text-sm font-medium">{metrics.servicesDistribution.cancelled}%</span>
                  <div className="w-20">
                    <Progress value={metrics.servicesDistribution.cancelled} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {metrics.servicesDistribution.completedCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Completados</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {metrics.servicesDistribution.pendingCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Pendientes</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {metrics.servicesDistribution.cancelledCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Cancelados</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Top 5 Custodios del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topCustodians.slice(0, 5).map((custodian, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                    index === 0 
                      ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{custodian.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {custodian.services} servicios
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      {formatCurrency(custodian.gmv)}
                    </div>
                    <div className="text-xs text-muted-foreground">GMV</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
