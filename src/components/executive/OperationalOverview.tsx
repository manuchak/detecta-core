import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Target
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
  
  // Dynamic date calculations
  const { currentMonthLabel, quarterLabel, mtdLabel, previousMonthLabel } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.ceil((currentMonth + 1) / 3);
    const previousQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
    const currentDay = now.getDate() - 1; // Data con 1 día de retraso
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
        {/* Hero skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        {/* Chart skeleton */}
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
        {/* Grid skeleton */}
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

  // Hero bar metrics
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

  // Secondary KPI cards (simplified from original 8 to 4)
  const secondaryKpis = [
    {
      title: 'Tasa Cumplimiento',
      value: `${metrics.comparatives.completionRate.current}%`,
      trend: `${metrics.comparatives.completionRate.changePercent >= 0 ? '+' : ''}${metrics.comparatives.completionRate.changePercent}%`,
      trendPositive: metrics.comparatives.completionRate.changePercent >= 0,
      icon: CheckCircle,
    },
    {
      title: 'Custodios Activos',
      value: metrics.comparatives.activeCustodiansMonth.current.toLocaleString(),
      trend: `${metrics.comparatives.activeCustodiansMonth.changePercent >= 0 ? '+' : ''}${metrics.comparatives.activeCustodiansMonth.changePercent}%`,
      trendPositive: metrics.comparatives.activeCustodiansMonth.changePercent >= 0,
      icon: Users,
    },
    {
      title: 'AOV',
      value: formatCurrency(metrics.comparatives.averageAOV.current),
      trend: `${metrics.comparatives.averageAOV.changePercent >= 0 ? '+' : ''}${metrics.comparatives.averageAOV.changePercent}%`,
      trendPositive: metrics.comparatives.averageAOV.changePercent >= 0,
      icon: DollarSign,
    },
    {
      title: 'KM Promedio',
      value: metrics.comparatives.averageKmPerService.current.toLocaleString(),
      trend: `${metrics.comparatives.averageKmPerService.changePercent >= 0 ? '+' : ''}${metrics.comparatives.averageKmPerService.changePercent}%`,
      trendPositive: metrics.comparatives.averageKmPerService.changePercent >= 0,
      icon: Route,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: Hero Bar with Semaphores */}
      <OperationalHeroBar
        fillRate={heroMetrics.fillRate}
        onTimePerformance={heroMetrics.onTimePerformance}
        servicesMTD={heroMetrics.servicesMTD}
        gmvMTD={heroMetrics.gmvMTD}
      />

      {/* Section 2: DoD Trend Chart */}
      <DoDTrendChart 
        data={metrics.dailyTrend}
        fillRateTarget={95}
        otpTarget={90}
      />

      {/* Section 3: Secondary Metrics + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Secondary KPIs - 4 cards in 2x2 grid */}
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
                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.title}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Operational Alerts */}
        <div className="lg:col-span-1">
          <OperationalAlerts alerts={metrics.alerts} maxAlerts={4} />
        </div>
      </div>

      {/* Section 4: Services Distribution and Top Custodians */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Distribution */}
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

        {/* Top Custodians */}
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
