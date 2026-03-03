import React from 'react';
import { useSecurityDashboard, OperativeEvent } from '@/hooks/security/useSecurityDashboard';
import { useDetectaRiskFactor } from '@/hooks/security/useDetectaRiskFactor';
import { useSiniestrosHistorico } from '@/hooks/security/useSiniestrosHistorico';
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
// OPERATIVE EVENTS TICKER
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
  const { fillRate } = useSiniestrosHistorico();

  // Build real DRF sparkline from fill rate monthly data + zone exposure
  // Each month gets a DRF point based on siniestralidad + structural exposure floor
  const dailyDRFScores = React.useMemo(() => {
    if (!fillRate.length) return [];
    // Structural exposure floor (~33 from 95% zones alto/extremo * 35% weight)
    const exposureFloor = 33;
    return fillRate.map(m => {
      const rate = m.servicios_completados > 0
        ? (m.siniestros / m.servicios_completados) * 1000
        : 0;
      // Normalize siniestralidad: 10/1000 = 100 score, weight 30%
      const siniestComponent = Math.min((rate / 10) * 100, 100) * 0.30;
      // Non-critical events add small incident component
      const incidentComponent = m.eventos_no_criticos > 0 ? Math.min(m.eventos_no_criticos * 2, 15) : 0;
      const score = Math.round(Math.min(exposureFloor + siniestComponent + incidentComponent, 100));
      return { date: m.fecha.slice(0, 7), score };
    });
  }, [fillRate]);

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

      {/* Row 1: DRF + Control Effectiveness */}
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
              Cobertura de Controles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{kpis.controlEffectivenessRate}%</span>
              <span className="text-xs text-muted-foreground">cobertura checklist</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {kpis.checklistsCompleted} checklists completados de {kpis.totalServicesInPeriod.toLocaleString()} servicios.
              {' '}El checklist de custodio es el control mitigador ISO 28000 §6.2.
            </p>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  kpis.controlEffectivenessRate >= 50 ? 'bg-green-500' :
                  kpis.controlEffectivenessRate >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(kpis.controlEffectivenessRate, 100)}%` }}
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
          title="Siniestros (90d)"
          value={kpis.operativeCritical}
          icon={AlertTriangle}
          description="siniestros en ventana 90 días"
          variant={kpis.operativeCritical > 2 ? 'danger' : kpis.operativeCritical > 0 ? 'warning' : 'success'}
        />
        <RiskScoreCard
          title="Días sin Siniestro"
          value={kpis.daysSinceLastCritical > 900 ? '—' : kpis.daysSinceLastCritical}
          icon={Timer}
          description="desde último robo/siniestro"
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
        <Card>
          <CardContent className="pt-4 pb-3">
            <IncidentHeatmap dailyData={heatmapData} />
          </CardContent>
        </Card>
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
