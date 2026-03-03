import React from 'react';
import { useSecurityDashboard, OperativeEvent } from '@/hooks/security/useSecurityDashboard';
import { useDetectaRiskFactor } from '@/hooks/security/useDetectaRiskFactor';
import { useSiniestrosHistorico } from '@/hooks/security/useSiniestrosHistorico';
import { DRFPeriodCards } from './DRFPeriodCards';
import { PostureBanner } from './PostureBanner';
import { IncidentHeatmap } from './IncidentHeatmap';
import { ActionableRecommendations } from './ActionableRecommendations';
import { SecurityAlertsTicker } from './SecurityAlertsTicker';
import { RiskDistributionChart } from './RiskDistributionChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Radio } from 'lucide-react';
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
  const { currentDRF, riskLevel, trends } = useDetectaRiskFactor('MoM');

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Row 0: Compact Posture Banner with inline KPIs */}
      <PostureBanner kpis={kpis} drfScore={currentDRF} drfLevel={riskLevel} />

      {/* Row 1: DRF Period Cards (5 cards with historical bars) */}
      <DRFPeriodCards trends={trends} />

      {/* Row 2: Heatmap + Distribution + Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <IncidentHeatmap dailyData={heatmapData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              Cobertura de Riesgo — Red Nacional
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

      {/* Row 3: Operative Events + External Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
