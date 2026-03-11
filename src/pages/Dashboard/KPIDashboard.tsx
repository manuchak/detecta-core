import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  BarChart3, 
  RefreshCw,
  Activity,
  Settings,
  UserPlus,
  Building2,
  Radio,
  Target,
  Star
} from 'lucide-react';
import { useExecutiveDashboardKPIs } from '@/hooks/useExecutiveDashboardKPIs';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { OperationalOverview } from '@/components/executive/OperationalOverview';
import { AcquisitionOverview } from '@/components/executive/AcquisitionOverview';
import { ExecutiveMetricsGrid } from '@/components/executive/ExecutiveMetricsGrid';
import { ClientAnalytics } from '@/components/executive/ClientAnalytics';
import { DailyLeadsCallsChart } from '@/components/recruitment/DailyLeadsCallsChart';
import { KPIDetailView } from '@/components/executive/KPIDetailView';
import CalibrationDashboard from '@/components/executive/CalibrationDashboard';

const KPIDashboard = () => {
  const { kpis, loading: kpisLoading, refreshData } = useExecutiveDashboardKPIs();
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
    if (isMobile && !['ops', 'client', 'kpis', 'calibracion'].includes(rawTab)) {
      return MOBILE_TAB_MAP[rawTab] || 'ops';
    }
    return rawTab;
  }, [rawTab, isMobile]);
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [selectedKPITooltip, setSelectedKPITooltip] = useState<React.ReactNode>(null);
  const currentTab = location.pathname === '/dashboard/kpis' ? 'kpis' : 'executive';

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

  if (kpisLoading) {
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
              <TabsTrigger value="calibracion" className="flex items-center gap-1 min-h-[44px] text-xs">
                <Settings className="h-3.5 w-3.5" />
                Calibración
              </TabsTrigger>
            </TabsList>
          ) : (
            /* ── Desktop: 7 tabs ── */
            <TabsList className="grid w-full grid-cols-5">
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

              {/* ── MOBILE: Calibración ── */}
              <TabsContent value="calibracion" className="space-y-4">
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