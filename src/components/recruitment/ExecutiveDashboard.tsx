
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyMetricsCards } from './MonthlyMetricsCards';
import { IntelligentAlerts } from './IntelligentAlerts';
import { LeadsAnalyticsSection } from './LeadsAnalyticsSection';
import { TrendingUp, Users, AlertTriangle } from 'lucide-react';

export const ExecutiveDashboard = () => {
  // Calcular rango de fechas para el mes hasta la fecha
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const dateFrom = firstDayOfMonth.toISOString().split('T')[0];
  const dateTo = today.toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      {/* KPIs Principales */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">KPIs Principales</h2>
        <p className="text-muted-foreground">
          Métricas clave del proceso de reclutamiento
        </p>
      </div>
      
      <MonthlyMetricsCards />

      {/* Análisis de Actividad Diaria */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Análisis de Actividad</h2>
            <p className="text-muted-foreground">
              Actividad diaria de leads y performance de analistas
            </p>
          </div>
        </div>
        
        <LeadsAnalyticsSection 
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </div>

      {/* Alertas Inteligentes */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Sistema de Alertas</h2>
            <p className="text-muted-foreground">
              Alertas críticas y preventivas del sistema
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <IntelligentAlerts />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
