import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouteRiskTrend, TrendPeriod, RouteTrendRow } from '@/hooks/security/useRouteRiskTrend';
import { Route, TrendingDown, TrendingUp, Minus, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// PERIOD SELECTOR
// =============================================================================

function PeriodSelector({ selected, onChange }: { selected: TrendPeriod; onChange: (p: TrendPeriod) => void }) {
  const periods: TrendPeriod[] = ['DoD', 'WoW', 'MoM', 'QoQ', 'YoY'];
  return (
    <div className="flex gap-1">
      {periods.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'px-1.5 py-0.5 text-[10px] rounded-md font-medium transition-colors',
            selected === p
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// SPARKLINE BAR (inline severity visualization)
// =============================================================================

function IncidentRateBar({ rate, max }: { rate: number; max: number }) {
  const pct = max > 0 ? Math.min((rate / max) * 100, 100) : 0;
  const color = rate > 30 ? 'bg-red-500' : rate > 10 ? 'bg-orange-500' : rate > 0 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// =============================================================================
// TREND BADGE
// =============================================================================

function TrendBadge({ direction, change }: { direction: RouteTrendRow['trend']['direction']; change: number }) {
  const config = {
    improving: { icon: TrendingDown, label: 'Mejorando', className: 'text-green-600' },
    worsening: { icon: TrendingUp, label: 'Empeorando', className: 'text-red-600' },
    stable: { icon: Minus, label: 'Estable', className: 'text-muted-foreground' },
  }[direction];

  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-0.5', config.className)}>
      <Icon className="h-3 w-3" />
      <span className="text-[10px] font-medium">
        {change > 0 ? '+' : ''}{change}
      </span>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RouteRiskTrendPanel() {
  const [period, setPeriod] = useState<TrendPeriod>('MoM');
  const { routes, globalIncidentRate, isLoading } = useRouteRiskTrend(period);

  if (isLoading) {
    return <Skeleton className="h-80 rounded-lg" />;
  }

  const maxRate = routes.length > 0 ? Math.max(...routes.map(r => r.incidentRate)) : 1;
  const topRoutes = routes.slice(0, 15);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" />
            Riesgo por Corredor
            <Badge variant="outline" className="text-[10px] ml-1">
              Global: {globalIncidentRate} ×1k
            </Badge>
          </CardTitle>
          <PeriodSelector selected={period} onChange={setPeriod} />
        </div>
      </CardHeader>
      <CardContent>
        {topRoutes.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <div className="text-center">
              <Route className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Sin datos suficientes de rutas</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 pb-2 border-b border-border text-[10px] text-muted-foreground font-medium">
              <div className="col-span-4">Corredor</div>
              <div className="col-span-1 text-right">Svcs</div>
              <div className="col-span-1 text-right">Inc</div>
              <div className="col-span-2 text-right">×1k rate</div>
              <div className="col-span-1 text-center">Ctrl%</div>
              <div className="col-span-3 text-center">Tendencia</div>
            </div>

            {/* Rows */}
            <div className="max-h-[400px] overflow-y-auto">
              {topRoutes.map((route, i) => (
                <div
                  key={route.corridor}
                  className={cn(
                    'grid grid-cols-12 gap-2 py-1.5 items-center border-b border-border/30 last:border-0',
                    i < 3 && route.incidentRate > 0 && 'bg-destructive/5'
                  )}
                >
                  {/* Corridor name */}
                  <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                    {route.criticalIncidents > 0 && (
                      <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                    )}
                    <span className="text-[11px] text-foreground truncate">{route.corridor}</span>
                  </div>

                  {/* Services count */}
                  <div className="col-span-1 text-right text-[11px] text-muted-foreground">
                    {route.totalServices}
                  </div>

                  {/* Incidents count */}
                  <div className="col-span-1 text-right text-[11px] font-medium text-foreground">
                    {route.totalIncidents}
                  </div>

                  {/* Rate with bar */}
                  <div className="col-span-2 flex items-center gap-1 justify-end">
                    <span className="text-[11px] font-medium text-foreground">{route.incidentRate}</span>
                    <IncidentRateBar rate={route.incidentRate} max={maxRate} />
                  </div>

                  {/* Control effectiveness */}
                  <div className="col-span-1 text-center">
                    {route.controlEffectiveness >= 0 ? (
                      <span className={cn(
                        'text-[10px] font-medium',
                        route.controlEffectiveness >= 80 ? 'text-green-600' :
                        route.controlEffectiveness >= 60 ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {route.controlEffectiveness}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Trend */}
                  <div className="col-span-3 flex items-center justify-center gap-1">
                    <TrendBadge direction={route.trend.direction} change={route.trend.change} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
