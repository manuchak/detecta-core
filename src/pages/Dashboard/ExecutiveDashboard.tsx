import React from 'react';
import { MonthClosureCard } from '@/components/executive/MonthClosureCard';
import { YearOverYearCard } from '@/components/executive/YearOverYearCard';
import { PaceAnalysisCard } from '@/components/executive/PaceAnalysisCard';
import { PerformanceAlertsCard } from '@/components/executive/PerformanceAlertsCard';
import { GMVProjectionCard } from '@/components/executive/GMVProjectionCard';

const ExecutiveDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              Dashboard Ejecutivo
            </h1>
            <p className="text-muted-foreground">
              Respuestas directas sobre el cierre de septiembre 2025
            </p>
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