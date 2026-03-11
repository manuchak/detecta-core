// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Target, Star, Radio, Loader2 } from 'lucide-react';
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

import { MobileOperationalDashboard } from '@/components/executive/MobileOperationalDashboard';

// StarMap
import { useStarMapKPIs } from '@/hooks/useStarMapKPIs';
import { StarMapVisualization } from '@/components/starmap/StarMapVisualization';
import { PillarDetailPanel } from '@/components/starmap/PillarDetailPanel';
import { DataHealthSummary } from '@/components/starmap/DataHealthSummary';
import { IncidentPanel } from '@/components/starmap/IncidentPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
const StarMapInlineContent = () => {
  const { northStar, pillars, overallScore, overallCoverage, loading } = useStarMapKPIs();
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handlePillarClick = (pillarId: string) => {
    setSelectedPillar(prev => prev === pillarId ? null : pillarId);
  };

  const handleDrawerClose = (open: boolean) => {
    if (!open) {
      setSelectedPillar(null);
      // Vaul body overflow cleanup (per mobile governance memory)
      requestAnimationFrame(() => {
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
      });
    }
  };

  const activePillar = pillars.find(p => p.id === selectedPillar);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Calculando KPIs del StarMap…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* North Star Banner */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="py-3 md:py-4">
          {isMobile ? (
            /* Mobile: stacked layout */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-medium">NORTH STAR — SCNV</p>
                  <p className="text-xs truncate">Completados Netos Validados</p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <div className="text-xl font-bold">
                  {northStar.value !== null ? `${Math.round(northStar.value)}%` : '—'}
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  {northStar.isProxy && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">proxy</span>
                  )}
                  <span className="text-[9px] text-muted-foreground">Score: {overallScore}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Desktop: original horizontal layout */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">NORTH STAR — SCNV</p>
                  <p className="text-sm truncate">Servicios Completados Netos Validados</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold">
                  {northStar.value !== null ? `${Math.round(northStar.value)}%` : '—'}
                </div>
                <div className="flex items-center gap-2 justify-end">
                  {northStar.isProxy && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">proxy</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">Score: {overallScore}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Star Visualization + Detail */}
      {isMobile ? (
        /* Mobile: full-width radar, drawer for detail */
        <>
          <Card>
            <CardContent className="p-3">
              <StarMapVisualization
                pillars={pillars}
                northStar={northStar}
                overallScore={overallScore}
                onPillarClick={handlePillarClick}
                selectedPillar={selectedPillar}
              />
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                Toca un pilar para ver detalle · Últimos 90 días
              </p>
            </CardContent>
          </Card>

          {/* Drawer for pillar detail */}
          <Drawer open={!!activePillar} onOpenChange={handleDrawerClose}>
            <DrawerContent>
              <DrawerTitle className="sr-only">
                {activePillar?.name || 'Detalle del pilar'}
              </DrawerTitle>
              <div className="max-h-[70vh] overflow-y-auto pt-2">
                {activePillar && (
                  <PillarDetailPanel pillar={activePillar} inDrawer />
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        /* Desktop: side-by-side grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardContent className="p-4 md:p-6">
              <StarMapVisualization
                pillars={pillars}
                northStar={northStar}
                overallScore={overallScore}
                onPillarClick={handlePillarClick}
                selectedPillar={selectedPillar}
              />
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Toca un pilar para ver detalle · Datos de los últimos 90 días
              </p>
            </CardContent>
          </Card>

          {activePillar ? (
            <PillarDetailPanel pillar={activePillar} />
          ) : (
            <Card className="flex items-center justify-center">
              <CardContent className="text-center py-12 md:py-16">
                <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Selecciona un pilar del StarMap</p>
                <p className="text-xs text-muted-foreground mt-1">para ver sus KPIs y estado de datos</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* All pillars overview — 1 col on mobile, compact list */}
      {isMobile ? (
        <div className="space-y-2">
          {pillars.map(p => (
            <button
              key={p.id}
              onClick={() => handlePillarClick(p.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                selectedPillar === p.id ? 'border-primary bg-primary/[0.02]' : 'border-border'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <span className="text-lg">{p.icon}</span>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{p.shortName}</span>
                  <span className="text-base font-bold tabular-nums">{p.score}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.coverage}%`, backgroundColor: p.color }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{Math.round(p.coverage)}%</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 shrink-0">
                {p.kpis.map(k => (
                  <div
                    key={k.id}
                    className={`h-1 w-4 rounded-full ${
                      k.status === 'green' ? 'bg-emerald-500' :
                      k.status === 'yellow' ? 'bg-amber-500' :
                      k.status === 'red' ? 'bg-red-500' :
                      'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-4">
          {pillars.map(p => (
            <button
              key={p.id}
              onClick={() => handlePillarClick(p.id)}
              className={`text-left p-3 md:p-4 rounded-lg border transition-all hover:shadow-sm ${
                selectedPillar === p.id ? 'border-primary bg-primary/[0.02]' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium flex items-center gap-1.5">
                  <span>{p.icon}</span>
                  {p.shortName}
                </span>
                <span className="text-base md:text-lg font-bold">{p.score}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${p.coverage}%`,
                      backgroundColor: p.color,
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{Math.round(p.coverage)}%</span>
              </div>
              <div className="flex gap-1 mt-2">
                {p.kpis.map(k => (
                  <div
                    key={k.id}
                    className={`h-1.5 flex-1 rounded-full ${
                      k.status === 'green' ? 'bg-emerald-500' :
                      k.status === 'yellow' ? 'bg-amber-500' :
                      k.status === 'red' ? 'bg-red-500' :
                      'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Incident Panel */}
      <IncidentPanel />

      {/* Data Health Summary — hidden on mobile to reduce scroll */}
      {!isMobile && (
        <DataHealthSummary
          pillars={pillars}
          overallCoverage={overallCoverage}
          overallScore={overallScore}
        />
      )}
    </div>
  );
};

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
    <div className="min-h-full bg-background">
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
        ) : currentTab === 'starmap' ? (
          <StarMapInlineContent />
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
