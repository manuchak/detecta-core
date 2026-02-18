import React from 'react';
import { useSecurityDashboard } from '@/hooks/security/useSecurityDashboard';
import { RiskScoreCard } from './RiskScoreCard';
import { SecurityAlertsTicker } from './SecurityAlertsTicker';
import { RiskDistributionChart } from './RiskDistributionChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, MapPin, Timer, TrendingDown, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function SecurityDashboard() {
  const { kpis, riskDistribution, recentEvents, isLoading } = useSecurityDashboard();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RiskScoreCard
          title="Score Promedio"
          value={kpis.avgRiskScore}
          maxValue={100}
          icon={Shield}
          description="Zonas monitoreadas"
          variant={kpis.avgRiskScore > 60 ? 'danger' : kpis.avgRiskScore > 30 ? 'warning' : 'success'}
        />
        <RiskScoreCard
          title="Incidentes Críticos"
          value={kpis.criticalIncidents}
          icon={AlertTriangle}
          description={`de ${kpis.totalIncidents} totales`}
          variant={kpis.criticalIncidents > 10 ? 'danger' : kpis.criticalIncidents > 3 ? 'warning' : 'success'}
        />
        <RiskScoreCard
          title="Días sin Crítico"
          value={kpis.daysSinceLastCritical > 900 ? '—' : kpis.daysSinceLastCritical}
          icon={Timer}
          description="desde último incidente"
          variant={kpis.daysSinceLastCritical < 7 ? 'danger' : kpis.daysSinceLastCritical < 30 ? 'warning' : 'success'}
        />
        <RiskScoreCard
          title="Puntos Verificados"
          value={kpis.safePointsVerified}
          icon={CheckCircle2}
          description="puntos seguros activos"
          variant="neutral"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Distribution */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              Distribución de Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart distribution={riskDistribution} />
          </CardContent>
        </Card>

        {/* Zones overview */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Zonas por Nivel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Extremo', count: riskDistribution.extremo, color: 'bg-red-500' },
                { label: 'Alto', count: riskDistribution.alto, color: 'bg-orange-500' },
                { label: 'Medio', count: riskDistribution.medio, color: 'bg-yellow-500' },
                { label: 'Bajo', count: riskDistribution.bajo, color: 'bg-green-500' },
              ].map(item => {
                const total = Object.values(riskDistribution).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (item.count / total) * 100 : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
                    <span className="text-xs font-medium text-foreground">{item.count}</span>
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent alerts */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Últimos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SecurityAlertsTicker events={recentEvents} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
