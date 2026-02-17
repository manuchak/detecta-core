// @ts-nocheck
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Target, Star } from 'lucide-react';
import { CriticalAlertsBar } from '@/components/executive/CriticalAlertsBar';
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

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getInitialTab = () => {
    if (location.pathname === '/dashboard/kpis') return 'kpis';
    if (location.pathname === '/dashboard/plan') return 'plan';
    if (location.pathname === '/dashboard/starmap') return 'starmap';
    return 'executive';
  };
  
  const currentTab = getInitialTab();

  const handleTabChange = (value: string) => {
    if (value === 'kpis') navigate('/dashboard/kpis');
    else if (value === 'plan') navigate('/dashboard/plan');
    else if (value === 'starmap') navigate('/dashboard/starmap');
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-light tracking-tight text-foreground">
                Dashboard Ejecutivo
              </h1>
              <p className="text-muted-foreground">
                Respuestas directas sobre el cierre de {getCurrentMonthInfo().fullName}
              </p>
            </div>
            
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-fit">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="executive" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />Proyecciones
                </TabsTrigger>
                <TabsTrigger value="plan" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />Plan 2026
                </TabsTrigger>
                <TabsTrigger value="starmap" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />StarMap
                </TabsTrigger>
                <TabsTrigger value="kpis" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />KPIs
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="text-xs text-muted-foreground">
            Última actualización: {new Date().toLocaleTimeString('es-MX')}
          </div>
        </div>

        {currentTab === 'plan' ? (
          <StrategicPlanTracker />
        ) : (
          <>
            {/* KPIs Bar (8 metrics) */}
            <ExecutiveKPIsBar />
            <CriticalAlertsBar />

            {/* BLOQUE 1: GMV Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GmvDailyChart />
              <div className="lg:col-span-2">
                <GmvMoMChart />
              </div>
            </div>

            {/* BLOQUE 2: GMV Desgloses */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GmvAccumulatedCard />
              <GmvClientDonut />
              <GmvByYearChart />
            </div>

            {/* BLOQUE 2b: GMV Trimestral */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GmvByQuarterChart />
            </div>

            {/* BLOQUE 3: Servicios */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QuarterlyServicesChart />
              <ServicesMoMChart />
              <DailyServicesChart />
            </div>

            {/* BLOQUE 4: Servicios Avanzado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ServicesYoYChart />
              <WeekdayComparisonChart />
              <CriticalEventsChart />
            </div>

            {/* BLOQUE 5: AOV y Clientes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AovMoMChart />
              <AovByClientChart />
              <ClientServiceDonut />
            </div>

            {/* BLOQUE 6: Operacional */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LocalForaneoMoMChart />
              <ArmedServicesMoMChart />
            </div>

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
