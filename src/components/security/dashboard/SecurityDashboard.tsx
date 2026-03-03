import React from 'react';
import { useSecurityDashboard, OperativeEvent } from '@/hooks/security/useSecurityDashboard';
import { DetectaRiskFactorCard } from './DetectaRiskFactorCard';
import { RiskScoreCard } from './RiskScoreCard';
import { SecurityAlertsTicker } from './SecurityAlertsTicker';
import { RiskDistributionChart } from './RiskDistributionChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, MapPin, Timer, TrendingDown, CheckCircle2, Activity, Radio } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// =============================================================================
// OPERATIVE EVENTS TICKER (internal incidents)
// =============================================================================

const sevBadge: Record<string, string> = {
  critica: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  alta: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  media: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  baja: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

function OperativeAlertsTicker({ events }: { events: OperativeEvent[] }) {
  if (!events.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        Sin incidentes operativos recientes
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {events.map((event, i) => (
        <div key={i} className="flex items-center gap-2 py-1 border-b border-border/50 last:border-0">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', sevBadge[event.severidad] || '')}>
            {event.severidad}
          </Badge>
          <span className="text-xs text-foreground flex-1 truncate">
            {event.tipo}
          </span>
          {event.atribuible_operacion && (
            <span className="text-[9px] text-destructive font-medium">ATR</span>
          )}
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {new Date(event.fecha_incidente).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD
// =============================================================================

export function SecurityDashboard() {
  const { kpis, riskDistribution, recentEvents, recentOperative, isLoading } = useSecurityDashboard();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-lg md:col-span-2" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1: DRF (prominent, 2 cols) + Control Effectiveness */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <DetectaRiskFactorCard />
        </div>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              Control Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{kpis.controlEffectivenessRate}%</span>
              <span className="text-xs text-muted-foreground">controles efectivos</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              De incidentes con controles activos documentados.
              {kpis.controlEffectivenessRate >= 80
                ? ' Objetivo ISO 28000 §6.2 cumplido.'
                : kpis.controlEffectivenessRate >= 60
                  ? ' Cercano al objetivo ISO 28000 §6.2.'
                  : ' Por debajo del objetivo ISO 28000 §6.2.'}
            </p>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  kpis.controlEffectivenessRate >= 80 ? 'bg-green-500' :
                  kpis.controlEffectivenessRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${kpis.controlEffectivenessRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: KPI Cards */}
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
          description={`${kpis.operativeCritical} operativos · ${kpis.criticalIncidents} zonas H3`}
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

      {/* Row 3: Distribution + Operative Events + External Events */}
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

        {/* Operative Incidents (own) */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Incidentes Operativos
              <Badge variant="outline" className="text-[9px] ml-auto">{kpis.operativeIncidents}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OperativeAlertsTicker events={recentOperative} />
          </CardContent>
        </Card>

        {/* External Events (H3 zones / RRSS) */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Radio className="h-4 w-4 text-muted-foreground" />
              Inteligencia Externa
              <Badge variant="outline" className="text-[9px] ml-auto">{kpis.totalIncidents}</Badge>
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
