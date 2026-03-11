import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  Settings,
  Building,
  UserPlus,
  Building2,
  Radio
} from 'lucide-react';
import { useExecutiveDashboardKPIs } from '@/hooks/useExecutiveDashboardKPIs';
import { useDynamicServiceData } from '@/hooks/useDynamicServiceData';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { OperationalOverview } from '@/components/executive/OperationalOverview';
import { AcquisitionOverview } from '@/components/executive/AcquisitionOverview';
import { ExecutiveMetricsGrid } from '@/components/executive/ExecutiveMetricsGrid';
import { ClientAnalytics } from '@/components/executive/ClientAnalytics';
import { DailyLeadsCallsChart } from '@/components/recruitment/DailyLeadsCallsChart';
import { KPIDetailView } from '@/components/executive/KPIDetailView';
import { CustodianEngagementDetailView } from '@/components/executive/details/CustodianEngagementDetailView';
import CalibrationDashboard from '@/components/executive/CalibrationDashboard';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const KPIDashboard = () => {
  const { kpis, loading: kpisLoading, refreshData } = useExecutiveDashboardKPIs();
  const { data: serviceData, isLoading: serviceDataLoading } = useDynamicServiceData();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mobile tab mapping: 4 consolidated tabs
  const MOBILE_TAB_MAP: Record<string, string> = {
    operacional: 'ops',
    adquisicion: 'client',
    clientes: 'client',
    kpis: 'kpis',
    calibracion: 'calibracion',
  };

  // Read active internal tab from URL query params, default to 'operacional'
  const searchParams = new URLSearchParams(location.search);
  const rawTab = searchParams.get('tab') || 'operacional';
  // On mobile, normalize desktop tab values to mobile groups
  const activeTab = useMemo(() => {
    if (isMobile && !['ops', 'client', 'kpis', 'summary'].includes(rawTab)) {
      return MOBILE_TAB_MAP[rawTab] || 'ops';
    }
    return rawTab;
  }, [rawTab, isMobile]);
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [selectedKPITooltip, setSelectedKPITooltip] = useState<React.ReactNode>(null);
  const currentTab = location.pathname === '/dashboard/kpis' ? 'kpis' : 'executive';

  // Dynamic date label for current month
  const now = new Date();
  const currentMonthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const handleTabChange = (value: string) => {
    if (value === 'kpis') {
      navigate('/dashboard/kpis');
    } else {
      navigate('/dashboard');
    }
  };

  const handleInternalTabChange = (newTab: string) => {
    navigate(`/dashboard/kpis?tab=${newTab}`, { replace: true });
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
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuario';
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
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="container mx-auto space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(isMobile ? 4 : 8)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(isMobile ? 2 : 4)].map((_, i) => (
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
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-8">
        {/* Header — hidden on mobile since ExecutiveDashboard provides top-level nav */}
        {isMobile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                KPIs de la Organización
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshData}
                className="h-8 w-8 p-0"
              >
                <RefreshCw size={14} />
              </Button>
            </div>
            <Tabs value="kpis" onValueChange={(val) => {
              const routes: Record<string, string> = {
                executive: '/dashboard',
                plan: '/dashboard/plan',
                starmap: '/dashboard/starmap',
                kpis: '/dashboard/kpis',
                operativo: '/dashboard/operativo',
              };
              if (routes[val]) navigate(routes[val]);
            }}>
              <TabsList className="flex w-auto gap-1">
                <TabsTrigger value="executive" className="flex items-center gap-2 min-h-[44px] shrink-0">
                  <TrendingUp className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="plan" className="flex items-center gap-2 min-h-[44px] shrink-0">
                  <Target className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="starmap" className="flex items-center gap-2 min-h-[44px] shrink-0">
                  <Star className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="kpis" className="flex items-center gap-2 min-h-[44px] shrink-0">
                  <BarChart3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="operativo" className="flex items-center gap-2 min-h-[44px] shrink-0">
                  <Radio className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="space-y-3 md:space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl md:text-3xl font-light tracking-tight text-foreground">
                  {getGreeting()}, {getUserName()}
                </h1>
                <p className="text-muted-foreground">
                  Dashboard ejecutivo completo con métricas operativas, adquisición y KPIs avanzados.
                </p>
              </div>
              
              {/* Navigation Tabs — desktop only */}
              <Tabs value={currentTab} onValueChange={handleTabChange} className="w-fit">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="executive" className="flex items-center gap-2 min-h-[44px] shrink-0">
                    <TrendingUp className="h-4 w-4" />
                    Proyecciones
                  </TabsTrigger>
                  <TabsTrigger value="kpis" className="flex items-center gap-2 min-h-[44px] shrink-0">
                    <BarChart3 className="h-4 w-4" />
                    KPIs
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
        )}

        {/* Executive Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={handleInternalTabChange} className="space-y-4 md:space-y-6">
          {isMobile ? (
            /* ── Mobile: 4 consolidated tabs ── */
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ops" className="flex items-center gap-1 min-h-[44px] text-xs">
                <Activity className="h-3.5 w-3.5" />
                Ops
              </TabsTrigger>
              <TabsTrigger value="client" className="flex items-center gap-1 min-h-[44px] text-xs">
                <Building2 className="h-3.5 w-3.5" />
                Clientes
              </TabsTrigger>
              <TabsTrigger value="kpis" className="flex items-center gap-1 min-h-[44px] text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                KPIs
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-1 min-h-[44px] text-xs">
                <Building className="h-3.5 w-3.5" />
                Resumen
              </TabsTrigger>
            </TabsList>
          ) : (
            /* ── Desktop: 7 tabs ── */
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="operacional" className="flex items-center gap-1.5 min-h-[44px] shrink-0 whitespace-nowrap">
                <Activity className="h-4 w-4" />
                Operacional
              </TabsTrigger>
              <TabsTrigger value="adquisicion" className="flex items-center gap-1.5 min-h-[44px] shrink-0 whitespace-nowrap">
                <UserPlus className="h-4 w-4" />
                Adquisición
              </TabsTrigger>
              <TabsTrigger value="clientes" className="flex items-center gap-1.5 min-h-[44px] shrink-0 whitespace-nowrap">
                <Building2 className="h-4 w-4" />
                Clientes
              </TabsTrigger>
              <TabsTrigger value="kpis" className="flex items-center gap-1.5 min-h-[44px] shrink-0 whitespace-nowrap">
                <BarChart3 className="h-4 w-4" />
                KPIs
              </TabsTrigger>
              <TabsTrigger value="resumen" className="flex items-center gap-1.5 min-h-[44px] shrink-0 whitespace-nowrap">
                <Building className="h-4 w-4" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="calibracion" className="flex items-center gap-1.5 min-h-[44px] shrink-0 whitespace-nowrap">
                <Settings className="h-4 w-4" />
                Calibración
              </TabsTrigger>
            </TabsList>
          )}

          {isMobile ? (
            <>
              {/* ── MOBILE: Ops ── */}
              <TabsContent value="ops" className="space-y-4">
                <OperationalOverview />
              </TabsContent>

              {/* ── MOBILE: Clientes (only ClientAnalytics, no Acquisition) ── */}
              <TabsContent value="client" className="space-y-4">
                <ClientAnalytics />
              </TabsContent>

              {/* ── MOBILE: KPIs ── */}
              <TabsContent value="kpis" className="space-y-4">
                <ExecutiveMetricsGrid kpis={kpis} loading={kpisLoading} onKPIClick={(kpi, tooltip) => { setSelectedKPI(kpi); setSelectedKPITooltip(tooltip || null); }} />
              </TabsContent>

              {/* ── MOBILE: Resumen (Resumen + Calibración) ── */}
              <TabsContent value="summary" className="space-y-4">
                {/* Main KPIs cards */}
                <div className="grid grid-cols-2 gap-3">
                  {mainKPIs.map((kpi, index) => {
                    const Icon = kpi.icon;
                    const isPositive = kpi.trend > 0;
                    return (
                      <Card key={index} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
                          <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.title}</CardTitle>
                          <div className={`p-1.5 rounded-lg ${kpi.bgColor}`}>
                            <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                          </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="text-lg font-bold">{kpi.value}</div>
                          <div className="flex items-center gap-1 text-xs mt-1">
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                              {Math.abs(kpi.trend)}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Service data summary */}
                {serviceData && (
                  <Card>
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Resumen {currentMonthLabel}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Servicios</span>
                        <p className="text-base font-bold text-primary">{serviceData.currentMonth.services.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">GMV</span>
                        <p className="text-base font-bold">${serviceData.currentMonth.gmv.toFixed(1)}M</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">AOV</span>
                        <p className="text-base font-bold">{formatCurrency(serviceData.currentMonth.aov)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Ritmo Diario</span>
                        <p className="text-base font-bold">{serviceData.currentMonth.dailyPace}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Secondary KPIs */}
                <Card>
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-sm">KPIs Principales</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {secondaryKPIs.slice(0, 4).map((kpi, index) => {
                      const Icon = kpi.icon;
                      const progressPercentage = (kpi.progress / kpi.target) * 100;
                      return (
                        <div key={index} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium">{kpi.title}</span>
                            </div>
                            <span className="text-xs font-bold">{kpi.value}</span>
                          </div>
                          <Progress value={Math.min(progressPercentage, 100)} className="h-1.5" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <div className="relative py-2">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs font-medium text-muted-foreground">
                    Calibración
                  </span>
                </div>

                <CalibrationDashboard />
              </TabsContent>
            </>
          ) : (
            <>
              {/* ── DESKTOP: Original 7 TabsContent ── */}
              <TabsContent value="operacional" className="space-y-6">
                <OperationalOverview />
              </TabsContent>

              <TabsContent value="adquisicion" className="space-y-6">
                <AcquisitionOverview />
                <div className="mt-8">
                  <DailyLeadsCallsChart />
                </div>
              </TabsContent>

              <TabsContent value="clientes" className="space-y-6">
                <ClientAnalytics />
              </TabsContent>

              <TabsContent value="kpis" className="space-y-6">
                <ExecutiveMetricsGrid kpis={kpis} loading={kpisLoading} onKPIClick={(kpi, tooltip) => { setSelectedKPI(kpi); setSelectedKPITooltip(tooltip || null); }} />
              </TabsContent>


              <TabsContent value="resumen" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {mainKPIs.map((kpi, index) => {
                    const Icon = kpi.icon;
                    const isPositive = kpi.trend > 0;
                    return (
                      <Card key={index} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                          <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                            <Icon className={`h-4 w-4 ${kpi.color}`} />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{kpi.value}</div>
                          <p className="text-xs text-muted-foreground mb-2">{kpi.description}</p>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Resumen {currentMonthLabel}
                      </CardTitle>
                      <CardDescription>Métricas consolidadas del mes actual</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {serviceData && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-sm">Servicios Totales</span>
                              <span className="text-lg font-bold text-primary">{serviceData.currentMonth.services.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-sm">GMV Acumulado</span>
                              <span className="text-lg font-bold text-green-600">${serviceData.currentMonth.gmv.toFixed(1)}M</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-sm">AOV Promedio</span>
                              <span className="text-lg font-bold text-purple-600">{formatCurrency(serviceData.currentMonth.aov)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-sm">Ritmo Diario</span>
                              <span className="text-lg font-bold text-orange-600">{serviceData.currentMonth.dailyPace}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>KPIs Principales</CardTitle>
                      <CardDescription>Indicadores clave de rendimiento</CardDescription>
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
                            <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="calibracion" className="space-y-6">
                <CalibrationDashboard />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* KPI Detail View Modal */}
        {selectedKPI && (
          <KPIDetailView 
            selectedKPI={selectedKPI as any}
            onClose={() => { setSelectedKPI(null); setSelectedKPITooltip(null); }}
            tooltipContent={selectedKPITooltip}
          />
        )}
      </div>
    </div>
  );
};

export default KPIDashboard;