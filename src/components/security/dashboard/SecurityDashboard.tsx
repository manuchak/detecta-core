import React from 'react';
import { useSecurityDashboard, OperativeEvent } from '@/hooks/security/useSecurityDashboard';
import { useDetectaRiskFactor } from '@/hooks/security/useDetectaRiskFactor';
import { DetectaRiskFactorCard } from './DetectaRiskFactorCard';
import { PostureBanner } from './PostureBanner';
import { DRFSparkline } from './DRFSparkline';
import { IncidentHeatmap } from './IncidentHeatmap';
import { ActionableRecommendations } from './ActionableRecommendations';
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
  const { kpis, riskDistribution, intelByLevel, heatmapData, recentEvents, recentOperative, isLoading } = useSecurityDashboard();
  const { trends } = useDetectaRiskFactor('MoM');

  // Build daily DRF scores from trends data (simplified: use MoM current as baseline)
  // For sparkline, we use heatmap data as proxy with inverse scoring
  const dailyDRFScores = heatmapData.map(d => {
    const sevWeight: Record<string, number> = { critica: 30, critico: 30, alta: 20, alto: 20, media: 10, medio: 10, baja: 5, bajo: 5 };
    const baseScore = Math.min(d.count * (sevWeight[d.maxSeverity] || 5), 100);
    return { date: d.date.slice(5), score: baseScore };
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 rounded-lg" />
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
      {/* Row 0: Posture Banner */}
      <PostureBanner kpis={kpis} />

      {/* Row 1: DRF (prominent, 2 cols) + Control Effectiveness */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-2">
          <DetectaRiskFactorCard />
          <Card>
            <CardContent className="pt-3 pb-2 px-4">
              <DRFSparkline dailyScores={dailyDRFScores} />
            </CardContent>
          </Card>
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

      {/* Row 3: Heatmap + Distribution + Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Heatmap */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <IncidentHeatmap dailyData={heatmapData} />
          </CardContent>
        </Card>

        {/* Risk Distribution (enriched) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              Distribución de Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart distribution={riskDistribution} intelByLevel={intelByLevel} />
          </CardContent>
        </Card>

        {/* Actionable Recommendations */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <ActionableRecommendations kpis={kpis} />
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Operative Events + External Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
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

        <Card>
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
