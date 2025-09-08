import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  Activity,
  Building,
  UserPlus
} from 'lucide-react';
import { useExecutiveDashboardKPIs } from '@/hooks/useExecutiveDashboardKPIs';
import { useDynamicServiceData } from '@/hooks/useDynamicServiceData';
import { useUserProfile } from '@/hooks/useUserProfile';
import { OperationalOverview } from '@/components/executive/OperationalOverview';
import { AcquisitionOverview } from '@/components/executive/AcquisitionOverview';
import { ExecutiveMetricsGrid } from '@/components/executive/ExecutiveMetricsGrid';

const KPIDashboard = () => {
  const { kpis, loading: kpisLoading, refreshData } = useExecutiveDashboardKPIs();
  const { data: serviceData, isLoading: serviceDataLoading } = useDynamicServiceData();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('operacional');
  const currentTab = location.pathname === '/dashboard/kpis' ? 'kpis' : 'executive';

  const handleTabChange = (value: string) => {
    if (value === 'kpis') {
      navigate('/dashboard/kpis');
    } else {
      navigate('/dashboard');
    }
  };

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

  const getUserName = () => {
    if (profileLoading) return 'Usuario';
    if (userProfile?.display_name) return userProfile.display_name;
    if (userProfile?.email) return userProfile.email.split('@')[0];
    return 'Marbelli';
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

  if (kpisLoading || serviceDataLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto space-y-6">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
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
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-light tracking-tight text-foreground">
                {getGreeting()}, {getUserName()}
              </h1>
              <p className="text-muted-foreground">
                Dashboard ejecutivo completo con métricas operativas, adquisición y KPIs avanzados.
              </p>
            </div>
            
            {/* Navigation Tabs */}
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-fit">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="executive" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Proyecciones
                </TabsTrigger>
                <TabsTrigger value="kpis" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  KPIs Ejecutivos
                </TabsTrigger>
              </TabsList>
            </Tabs>
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

        {/* Executive Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="operacional" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Operacional
            </TabsTrigger>
            <TabsTrigger value="adquisicion" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Adquisición
            </TabsTrigger>
            <TabsTrigger value="kpis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              KPIs Avanzados
            </TabsTrigger>
            <TabsTrigger value="resumen" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Resumen Ejecutivo
            </TabsTrigger>
          </TabsList>

          {/* Operational Overview Tab */}
          <TabsContent value="operacional" className="space-y-6">
            <OperationalOverview />
          </TabsContent>

          {/* Acquisition Overview Tab */}
          <TabsContent value="adquisicion" className="space-y-6">
            <AcquisitionOverview />
          </TabsContent>

          {/* Advanced KPIs Tab */}
          <TabsContent value="kpis" className="space-y-6">
            <ExecutiveMetricsGrid kpis={kpis} loading={kpisLoading} />
          </TabsContent>

          {/* Executive Summary Tab */}
          <TabsContent value="resumen" className="space-y-6">
            {/* Current Month Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Month Summary with Service Data */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Resumen Septiembre 2025
                  </CardTitle>
                  <CardDescription>
                    Métricas consolidadas del mes actual
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {serviceData && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm">Servicios Totales</span>
                          <span className="text-lg font-bold text-primary">
                            {serviceData.currentMonth.services.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm">GMV Acumulado</span>
                          <span className="text-lg font-bold text-green-600">
                            ${serviceData.currentMonth.gmv.toFixed(1)}M
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm">AOV Promedio</span>
                          <span className="text-lg font-bold text-purple-600">
                            {formatCurrency(serviceData.currentMonth.aov)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm">Ritmo Diario</span>
                          <span className="text-lg font-bold text-orange-600">
                            {serviceData.currentMonth.dailyPace}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Key Performance Indicators */}
              <Card>
                <CardHeader>
                  <CardTitle>KPIs Principales</CardTitle>
                  <CardDescription>
                    Indicadores clave de rendimiento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {secondaryKPIs.slice(0, 4).map((kpi, index) => {
                    const Icon = kpi.icon;
                    const progressPercentage = (kpi.progress / kpi.target) * 100;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{kpi.title}</span>
                          </div>
                          <span className="text-sm font-bold">{kpi.value}</span>
                        </div>
                        <Progress 
                          value={Math.min(progressPercentage, 100)} 
                          className="h-2" 
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default KPIDashboard;