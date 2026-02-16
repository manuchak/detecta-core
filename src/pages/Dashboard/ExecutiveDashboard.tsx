// @ts-nocheck
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Target, Star } from 'lucide-react';
import { UnifiedGMVDashboard } from '@/components/executive/UnifiedGMVDashboard';
import { AnnualComparisonCard } from '@/components/executive/AnnualComparisonCard';
import { CriticalAlertsBar } from '@/components/executive/CriticalAlertsBar';
import { AdvancedForecastDashboard } from '@/components/advanced/AdvancedForecastDashboard';
import { ExecutiveKPIsBar } from '@/components/executive/ExecutiveKPIsBar';
import { TopClientsMTD } from '@/components/executive/TopClientsMTD';
import { ServiceDistributionChart } from '@/components/executive/ServiceDistributionChart';
import { FinancialSummaryPanel } from '@/components/executive/FinancialSummaryPanel';
import { QuarterlyServicesChart } from '@/components/executive/QuarterlyServicesChart';
import { StrategicPlanTracker } from '@/components/executive/StrategicPlanTracker';
import { getCurrentMonthInfo } from '@/utils/dynamicDateUtils';

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
    if (value === 'kpis') {
      navigate('/dashboard/kpis');
    } else if (value === 'plan') {
      navigate('/dashboard/plan');
    } else if (value === 'starmap') {
      navigate('/dashboard/starmap');
    } else {
      navigate('/dashboard');
    }
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
            
            {/* Navigation Tabs */}
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-fit">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="executive" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Proyecciones
                </TabsTrigger>
                <TabsTrigger value="plan" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Plan 2026
                </TabsTrigger>
                <TabsTrigger value="starmap" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  StarMap
                </TabsTrigger>
                <TabsTrigger value="kpis" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  KPIs
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="text-xs text-muted-foreground">
            Última actualización: {new Date().toLocaleTimeString('es-MX')}
          </div>
        </div>

        {/* Conditional content based on tab */}
        {currentTab === 'plan' ? (
          <StrategicPlanTracker />
        ) : (
          <>
            {/* NEW: Executive KPIs Bar (Looker Style - Page 1) */}
            <ExecutiveKPIsBar />

            {/* Barra de Alertas Críticas */}
            <CriticalAlertsBar />

            {/* Componente Principal Unificado */}
            <UnifiedGMVDashboard />

            {/* NEW: Grid de 3 columnas con nuevos componentes (Looker Style) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TopClientsMTD />
              <ServiceDistributionChart />
              <QuarterlyServicesChart />
            </div>

            {/* NEW: Panel de Finanzas (Looker Style - Page 3) */}
            <FinancialSummaryPanel />

            {/* Grid Secundario - Existente */}
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