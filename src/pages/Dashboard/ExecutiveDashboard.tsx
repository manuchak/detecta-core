import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp } from 'lucide-react';
import { MonthClosureCard } from '@/components/executive/MonthClosureCard';
import { YearOverYearCard } from '@/components/executive/YearOverYearCard';
import { PaceAnalysisCard } from '@/components/executive/PaceAnalysisCard';
import { PerformanceAlertsCard } from '@/components/executive/PerformanceAlertsCard';
import { GMVProjectionCard } from '@/components/executive/GMVProjectionCard';

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentTab = location.pathname === '/dashboard/kpis' ? 'kpis' : 'executive';

  const handleTabChange = (value: string) => {
    if (value === 'kpis') {
      navigate('/dashboard/kpis');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-light tracking-tight text-foreground">
                Dashboard Ejecutivo
              </h1>
              <p className="text-muted-foreground">
                Respuestas directas sobre el cierre de septiembre 2025
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
                  KPIs
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="text-xs text-muted-foreground">
            Última actualización: {new Date().toLocaleTimeString('es-MX')}
          </div>
        </div>

        {/* Main GMV Question */}
        <GMVProjectionCard />

        {/* Secondary Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthClosureCard />
          <YearOverYearCard />
          <PaceAnalysisCard />
          <PerformanceAlertsCard />
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;