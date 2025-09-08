import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  UserCheck, 
  Star, 
  BarChart3, 
  Clock, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { useExecutiveDashboardKPIs } from '@/hooks/useExecutiveDashboardKPIs';
import { useDynamicServiceData } from '@/hooks/useDynamicServiceData';

const KPIDashboard = () => {
  const { kpis, loading: kpisLoading, refreshData } = useExecutiveDashboardKPIs();
  const { data: serviceData, isLoading: serviceDataLoading } = useDynamicServiceData();

  const currentTime = new Date().toLocaleTimeString('es-MX', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const mainKPIs = [
    {
      title: 'CPA',
      value: formatCurrency(kpis.cpa),
      description: 'Costo por Adquisición',
      trend: -5.2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: DollarSign
    },
    {
      title: 'LTV',
      value: formatCurrency(kpis.ltv),
      description: 'Valor de Vida del Cliente',
      trend: 8.5,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: TrendingUp
    },
    {
      title: 'ROI Marketing',
      value: formatPercentage(kpis.roiMkt),
      description: 'Retorno de Inversión',
      trend: 12.3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: BarChart3
    }
  ];

  const secondaryKPIs = [
    {
      title: 'CRATE',
      value: formatPercentage(kpis.crate),
      description: 'Tasa de Conversión',
      progress: kpis.crate,
      target: 15,
      icon: Target
    },
    {
      title: 'RRATE',
      value: formatPercentage(kpis.rrate),
      description: 'Tasa de Retención',
      progress: kpis.rrate,
      target: 100,
      icon: UserCheck
    },
    {
      title: 'NPS',
      value: kpis.nps.toString(),
      description: 'Net Promoter Score',
      progress: kpis.nps,
      target: 70,
      icon: Star
    },
    {
      title: 'Supply Growth',
      value: formatPercentage(kpis.supplyGrowth),
      description: 'Crecimiento de Oferta',
      progress: Math.abs(kpis.supplyGrowth),
      target: 20,
      icon: Users
    }
  ];

  const operationalMetrics = [
    {
      label: 'Engagement Score',
      value: kpis.engagement.toFixed(1),
      unit: 'pts',
      trend: 2.1
    },
    {
      label: 'Onboarding Time',
      value: kpis.onboardingTime.toString(),
      unit: 'días',
      trend: -0.5
    },
    {
      label: 'ARATE',
      value: formatPercentage(kpis.arate),
      unit: '',
      trend: 1.2
    }
  ];

  const recentActivities = [
    {
      id: 'KPI001',
      activity: 'Actualización CPA',
      value: formatCurrency(kpis.cpa),
      status: 'Completado',
      time: '2 min ago'
    },
    {
      id: 'KPI002', 
      activity: 'Análisis ROI Marketing',
      value: formatPercentage(kpis.roiMkt),
      status: 'En Progreso',
      time: '5 min ago'
    },
    {
      id: 'KPI003',
      activity: 'Reporte NPS',
      value: kpis.nps.toString(),
      status: 'Completado',
      time: '10 min ago'
    }
  ];

  if (kpisLoading || serviceDataLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto space-y-6">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              {getGreeting()}, Ejecutivo
            </h1>
            <p className="text-muted-foreground">
              Mantente al día con tus KPIs, monitorea el progreso y haz seguimiento del estado.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              className="gap-2"
            >
              <RefreshCw size={16} />
              Actualizar
            </Button>
            <div className="text-xs text-muted-foreground">
              Última actualización: {currentTime}
            </div>
          </div>
        </div>

        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mainKPIs.map((kpi, index) => {
            const Icon = kpi.icon;
            const isPositive = kpi.trend > 0;
            
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {kpi.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(kpi.trend)}%
                    </span>
                    <span className="text-muted-foreground">vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Secondary KPIs and Current Month */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Secondary KPIs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {secondaryKPIs.map((kpi, index) => {
                const Icon = kpi.icon;
                const progressPercentage = (kpi.progress / kpi.target) * 100;
                
                return (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {kpi.title}
                        </CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold mb-1">{kpi.value}</div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {kpi.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progreso vs Meta</span>
                          <span className="font-medium">
                            {Math.min(progressPercentage, 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(progressPercentage, 100)} 
                          className="h-2" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Current Month Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumen Septiembre
              </CardTitle>
              <CardDescription>
                Métricas del mes actual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {serviceData && (
                <>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Servicios</span>
                    <span className="text-sm font-medium">
                      {serviceData.currentMonth.services.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">GMV</span>
                    <span className="text-sm font-medium">
                      ${serviceData.currentMonth.gmv.toFixed(1)}M
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">AOV</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(serviceData.currentMonth.aov)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Ritmo Diario</span>
                    <span className="text-sm font-medium">
                      {serviceData.currentMonth.dailyPace} srv/día
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Operational Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Métricas Operacionales
            </CardTitle>
            <CardDescription>
              Indicadores de rendimiento operativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {operationalMetrics.map((metric, index) => {
                const isPositive = metric.trend > 0;
                
                return (
                  <div key={index} className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">
                      {metric.value}
                      {metric.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{metric.label}</div>
                    <div className="flex items-center justify-center gap-1 text-xs">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(metric.trend)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Actividades Recientes</CardTitle>
                <CardDescription>
                  Últimas actualizaciones de KPIs
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar..." 
                    className="pl-8 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">{activity.id}</div>
                    <div>
                      <div className="text-sm font-medium">{activity.activity}</div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold">{activity.value}</div>
                    <Badge 
                      variant={activity.status === 'Completado' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {activity.status}
                    </Badge>
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

export default KPIDashboard;