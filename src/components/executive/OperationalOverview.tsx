import React from 'react';
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

export const OperationalOverview = () => {
  const { data: metrics, isLoading } = useOperationalMetrics();

  if (isLoading || !metrics || !metrics.comparatives) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const kpiCards = [
    {
      title: 'Servicios Este Mes',
      value: metrics.comparatives.servicesThisMonth.current.toLocaleString(),
      description: 'Septiembre 2025',
      icon: Clock,
      trend: `${metrics.comparatives.servicesThisMonth.changePercent >= 0 ? '+' : ''}${metrics.comparatives.servicesThisMonth.changePercent}%`,
      trendPositive: metrics.comparatives.servicesThisMonth.changePercent >= 0,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Servicios YTD',
      value: metrics.comparatives.servicesYTD.current.toLocaleString(),
      description: 'vs mismo período año anterior',
      icon: Target,
      trend: `${metrics.comparatives.servicesYTD.changePercent >= 0 ? '+' : ''}${metrics.comparatives.servicesYTD.changePercent}%`,
      trendPositive: metrics.comparatives.servicesYTD.changePercent >= 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Tasa de Cumplimiento',
      value: `${metrics.comparatives.completionRate.current}%`,
      description: 'Este mes vs anterior',
      icon: CheckCircle,
      trend: `${metrics.comparatives.completionRate.changePercent >= 0 ? '+' : ''}${metrics.comparatives.completionRate.changePercent}%`,
      trendPositive: metrics.comparatives.completionRate.changePercent >= 0,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Custodios Activos Este Mes',
      value: metrics.comparatives.activeCustodiansMonth.current.toLocaleString(),
      description: 'Con servicios este mes',
      icon: Users,
      trend: `${metrics.comparatives.activeCustodiansMonth.changePercent >= 0 ? '+' : ''}${metrics.comparatives.activeCustodiansMonth.changePercent}%`,
      trendPositive: metrics.comparatives.activeCustodiansMonth.changePercent >= 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'GMV Este Mes',
      value: formatCurrency(metrics.comparatives.totalGMV.current),
      description: 'vs mes anterior',
      icon: DollarSign,
      trend: `${metrics.comparatives.totalGMV.changePercent >= 0 ? '+' : ''}${metrics.comparatives.totalGMV.changePercent}%`,
      trendPositive: metrics.comparatives.totalGMV.changePercent >= 0,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'AOV Este Mes',
      value: formatCurrency(metrics.comparatives.averageAOV.current),
      description: 'Valor promedio por orden',
      icon: TrendingUp,
      trend: `${metrics.comparatives.averageAOV.changePercent >= 0 ? '+' : ''}${metrics.comparatives.averageAOV.changePercent}%`,
      trendPositive: metrics.comparatives.averageAOV.changePercent >= 0,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Custodios Este Trimestre',
      value: metrics.comparatives.activeCustodiansQuarter.current.toLocaleString(),
      description: 'Q3 vs Q2',
      icon: Users,
      trend: `${metrics.comparatives.activeCustodiansQuarter.changePercent >= 0 ? '+' : ''}${metrics.comparatives.activeCustodiansQuarter.changePercent}%`,
      trendPositive: metrics.comparatives.activeCustodiansQuarter.changePercent >= 0,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'KM Promedio Este Mes',
      value: `${metrics.comparatives.averageKmPerService.current}`,
      description: 'Kilómetros por servicio',
      icon: Route,
      trend: `${metrics.comparatives.averageKmPerService.changePercent >= 0 ? '+' : ''}${metrics.comparatives.averageKmPerService.changePercent}%`,
      trendPositive: metrics.comparatives.averageKmPerService.changePercent >= 0,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          
          return (
            <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mb-2">
                  {kpi.description}
                </p>
                <div className="flex items-center gap-1">
                  <Badge 
                    className={`text-xs px-2 py-0 ${
                      kpi.trendPositive 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {kpi.trend}
                  </Badge>
                  <span className="text-xs text-muted-foreground">vs mes anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Services Distribution and Top Custodians */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Distribución de Servicios
            </CardTitle>
            <CardDescription>
              Estado actual de los servicios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Completados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metrics.servicesDistribution.completed}%</span>
                  <div className="w-24">
                    <Progress value={metrics.servicesDistribution.completed} className="h-2" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Pendientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metrics.servicesDistribution.pending}%</span>
                  <div className="w-24">
                    <Progress value={metrics.servicesDistribution.pending} className="h-2" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Cancelados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metrics.servicesDistribution.cancelled}%</span>
                  <div className="w-24">
                    <Progress value={metrics.servicesDistribution.cancelled} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {metrics.completedServices.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Completados</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">
                    {metrics.pendingServices.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Pendientes</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {metrics.cancelledServices.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Cancelados</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Custodians */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Custodios
            </CardTitle>
            <CardDescription>
              Custodios con mejor rendimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topCustodians.slice(0, 5).map((custodian, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
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