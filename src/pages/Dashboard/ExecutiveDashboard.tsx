// @ts-nocheck
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Target, Star, Radio } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { CriticalAlertsBar } from '@/components/executive/CriticalAlertsBar';
import { MobileChartBlock } from '@/components/executive/MobileChartBlock';
import { ExecutiveKPIsBar } from '@/components/executive/ExecutiveKPIsBar';
import { StrategicPlanTracker } from '@/components/executive/StrategicPlanTracker';
import { getCurrentMonthInfo } from '@/utils/dynamicDateUtils';

// GMV Block
import { GmvDailyChart } from '@/components/executive/GmvDailyChart';
import { GmvAccumulatedCard } from '@/components/executive/GmvAccumulatedCard';
import { GmvMoMChart } from '@/components/executive/GmvMoMChart';
import { GmvClientDonut } from '@/components/executive/GmvClientDonut';
import { GmvByYearChart } from '@/components/executive/GmvByYearChart';
import { GmvByQuarterChart } from '@/components/executive/GmvByQuarterChart';

// Services Block
import { QuarterlyServicesChart } from '@/components/executive/QuarterlyServicesChart';
import { ServicesMoMChart } from '@/components/executive/ServicesMoMChart';
import { DailyServicesChart } from '@/components/executive/DailyServicesChart';
import { ServicesYoYChart } from '@/components/executive/ServicesYoYChart';
import { WeekdayComparisonChart } from '@/components/executive/WeekdayComparisonChart';
import { CriticalEventsChart } from '@/components/executive/CriticalEventsChart';

// AOV & Clients Block
import { AovMoMChart } from '@/components/executive/AovMoMChart';
import { AovByClientChart } from '@/components/executive/AovByClientChart';
import { ClientServiceDonut } from '@/components/executive/ClientServiceDonut';

// Operational Block
import { LocalForaneoMoMChart } from '@/components/executive/LocalForaneoMoMChart';
import { ArmedServicesMoMChart } from '@/components/executive/ArmedServicesMoMChart';

// Existing
import { FinancialSummaryPanel } from '@/components/executive/FinancialSummaryPanel';
import { AnnualComparisonCard } from '@/components/executive/AnnualComparisonCard';
import { AdvancedForecastDashboard } from '@/components/advanced/AdvancedForecastDashboard';
import { MobileOperationalDashboard } from '@/components/executive/MobileOperationalDashboard';

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const getInitialTab = () => {
    if (location.pathname === '/dashboard/kpis') return 'kpis';
    if (location.pathname === '/dashboard/plan') return 'plan';
    if (location.pathname === '/dashboard/starmap') return 'starmap';
    if (location.pathname === '/dashboard/operativo') return 'operativo';
    return 'executive';
  };
  
  const rawTab = getInitialTab();
  
  // Redirect desktop users away from mobile-only "operativo" tab
  React.useEffect(() => {
    if (!isMobile && rawTab === 'operativo') {
      navigate('/dashboard', { replace: true });
    }
  }, [isMobile, rawTab, navigate]);
  
  const currentTab = (!isMobile && rawTab === 'operativo') ? 'executive' : rawTab;

  const handleTabChange = (value: string) => {
    if (value === 'kpis') navigate('/dashboard/kpis');
    else if (value === 'plan') navigate('/dashboard/plan');
    else if (value === 'starmap') navigate('/dashboard/starmap');
    else if (value === 'operativo') navigate('/dashboard/operativo');
    else navigate('/dashboard');
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 py-4 md:px-6 md:py-8 space-y-4 md:space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="space-y-3 md:space-y-4 flex-1 min-w-0">
            <div className="space-y-1">
              <h1 className="text-xl md:text-3xl font-light tracking-tight text-foreground">
                Dashboard Ejecutivo
              </h1>
              <p className="text-sm md:text-base text-muted-foreground truncate">
                Respuestas directas sobre el cierre de {getCurrentMonthInfo().fullName}
              </p>
            </div>
            
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-fit">
              <TabsList className={isMobile ? "flex w-auto gap-1" : "grid w-full grid-cols-4"}>
                <TabsTrigger value="executive" className="flex items-center gap-2 min-h-[44px] shrink-0">
                  <TrendingUp className="h-4 w-4" />{!isMobile && 'Proyecciones'}
                </TabsTrigger>
                <TabsTrigger value="plan" className="flex items-center gap-2 min-h-[44px] shrink-0">
                  <Target className="h-4 w-4" />{!isMobile && 'Plan 2026'}
                </TabsTrigger>
                <TabsTrigger value="starmap" className="flex items-center gap-2 min-h-[44px] shrink-0">
                  <Star className="h-4 w-4" />{!isMobile && 'StarMap'}
                </TabsTrigger>
                <TabsTrigger value="kpis" className="flex items-center gap-2 min-h-[44px] shrink-0">
                  <BarChart3 className="h-4 w-4" />{!isMobile && 'KPIs'}
                </TabsTrigger>
                {isMobile && (
                  <TabsTrigger value="operativo" className="flex items-center gap-2 min-h-[44px] shrink-0">
                    <Radio className="h-4 w-4" />
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>
          <div className="text-xs text-muted-foreground hidden md:block">
            Última actualización: {new Date().toLocaleTimeString('es-MX')}
          </div>
        </div>

        {currentTab === 'operativo' ? (
          <MobileOperationalDashboard />
        ) : currentTab === 'plan' ? (
          <StrategicPlanTracker />
        ) : (
          <>
            {/* KPIs Bar (8 metrics) */}
            <ExecutiveKPIsBar />
            <CriticalAlertsBar />

            {/* BLOQUE 1: GMV Principal */}
            {isMobile ? (
              <MobileChartBlock
                tabs={[
                  { label: 'Diario', content: <GmvDailyChart /> },
                  { label: 'MoM', content: <GmvMoMChart /> },
                ]}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GmvDailyChart />
                <div className="lg:col-span-2">
                  <GmvMoMChart />
                </div>
              </div>
            )}

            {/* BLOQUE 2: GMV Desgloses */}
            {isMobile ? (
              <MobileChartBlock
                tabs={[
                  { label: 'Acumulado', content: <GmvAccumulatedCard /> },
                  { label: 'Clientes', content: <GmvClientDonut /> },
                  { label: 'Anual', content: <GmvByYearChart /> },
                ]}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GmvAccumulatedCard />
                <GmvClientDonut />
                <GmvByYearChart />
              </div>
            )}

            {/* BLOQUE 2b: GMV Trimestral */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GmvByQuarterChart />
            </div>

            {/* BLOQUE 3: Servicios */}
            {isMobile ? (
              <MobileChartBlock
                tabs={[
                  { label: 'Trimestre', content: <QuarterlyServicesChart /> },
                  { label: 'MoM', content: <ServicesMoMChart /> },
                  { label: 'Diario', content: <DailyServicesChart /> },
                ]}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <QuarterlyServicesChart />
                <ServicesMoMChart />
                <DailyServicesChart />
              </div>
            )}

            {/* BLOQUE 4: Servicios Avanzado */}
            {isMobile ? (
              <MobileChartBlock
                tabs={[
                  { label: 'YoY', content: <ServicesYoYChart /> },
                  { label: 'Día Sem.', content: <WeekdayComparisonChart /> },
                  { label: 'Eventos', content: <CriticalEventsChart /> },
                ]}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ServicesYoYChart />
                <WeekdayComparisonChart />
                <CriticalEventsChart />
              </div>
            )}

            {/* BLOQUE 5: AOV y Clientes */}
            {isMobile ? (
              <MobileChartBlock
                tabs={[
                  { label: 'AOV', content: <AovMoMChart /> },
                  { label: 'AOV Cliente', content: <AovByClientChart /> },
                  { label: 'Mix', content: <ClientServiceDonut /> },
                ]}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AovMoMChart />
                <AovByClientChart />
                <ClientServiceDonut />
              </div>
            )}

            {/* BLOQUE 6: Operacional */}
            {isMobile ? (
              <MobileChartBlock
                tabs={[
                  { label: 'Local/Foráneo', content: <LocalForaneoMoMChart /> },
                  { label: 'Armados', content: <ArmedServicesMoMChart /> },
                ]}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LocalForaneoMoMChart />
                <ArmedServicesMoMChart />
              </div>
            )}

            {/* Existentes: Finanzas + Comparativa + Forecast */}
            <FinancialSummaryPanel />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnnualComparisonCard />
              <AdvancedForecastDashboard />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
