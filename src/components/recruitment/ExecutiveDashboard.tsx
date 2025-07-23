import React from "react";
import { ExecutiveMetricsGrid } from '@/components/executive/ExecutiveMetricsGrid';
import { FinancialPerformancePanel } from '@/components/executive/FinancialPerformancePanel';
import { ConsolidatedAnalyticsPanel } from '@/components/executive/ConsolidatedAnalyticsPanel';
import { SmartActionsPanel } from '@/components/executive/SmartActionsPanel';
import { useExecutiveDashboardKPIs } from '@/hooks/useExecutiveDashboardKPIs';

export const ExecutiveDashboard = () => {
  const { kpis, loading, refreshData } = useExecutiveDashboardKPIs();

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
              Vista consolidada de métricas clave y performance del negocio
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="btn-apple px-4 py-2 text-sm bg-secondary hover:bg-secondary/80"
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
            <div className="text-xs text-muted-foreground">
              Última actualización: {new Date().toLocaleTimeString('es-MX')}
            </div>
          </div>
        </div>

        {/* KPIs Hero Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">KPIs Principales</h2>
          <ExecutiveMetricsGrid kpis={kpis} loading={loading} />
        </section>

        {/* Financial Performance Section */}
        <section className="space-y-4">
          <FinancialPerformancePanel />
        </section>

        {/* Consolidated Analytics Section */}
        <section className="space-y-4">
          <ConsolidatedAnalyticsPanel />
        </section>

        {/* Smart Actions Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Acciones Inteligentes</h2>
            <div className="text-sm text-muted-foreground">
              Basado en análisis automático de datos
            </div>
          </div>
          <SmartActionsPanel />
        </section>
      </div>
    </div>
  );
};
