import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Calendar, Target } from 'lucide-react';
import { useQuarterlyAnnualProgress, MetricProgress } from '@/hooks/useQuarterlyAnnualProgress';
import { cn } from '@/lib/utils';
import { formatNumber, formatGMV, formatPercent } from '@/utils/formatUtils';
import { useIsMobile } from '@/hooks/use-mobile';

const STATUS_CONFIG = {
  on_track: { label: 'En Meta', variant: 'success' as const, bgClass: 'bg-emerald-500' },
  at_risk: { label: 'En Riesgo', variant: 'default' as const, bgClass: 'bg-amber-500' },
  off_track: { label: 'Fuera de Meta', variant: 'destructive' as const, bgClass: 'bg-red-500' },
};

function getBarColor(status: 'on_track' | 'at_risk' | 'off_track') {
  if (status === 'on_track') return 'bg-emerald-500';
  if (status === 'at_risk') return 'bg-amber-500';
  return 'bg-red-500';
}

function ProgressBar({ percent, status }: { percent: number; status: 'on_track' | 'at_risk' | 'off_track' }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-out', getBarColor(status))}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

interface MetricColumnProps {
  title: string;
  metric: MetricProgress;
  formatActual: (v: number) => string;
  formatTarget: (v: number) => string;
  formatPace?: (v: number) => string;
  formatProjection?: (v: number) => string;
  showPace?: boolean;
}

function MetricColumn({ title, metric, formatActual, formatTarget, formatPace, formatProjection, showPace = true }: MetricColumnProps) {
  const cfg = STATUS_CONFIG[metric.status];
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
      <p className="text-lg font-bold">
        {formatActual(metric.actual)}{' '}
        <span className="text-xs sm:text-sm font-normal text-muted-foreground">/ {formatTarget(metric.target)}</span>
      </p>
      <ProgressBar percent={metric.percent} status={metric.status} />
      <p className="text-xs text-muted-foreground">{metric.percent}% completado</p>
      {showPace && (
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">
            Ritmo: {formatPace ? formatPace(metric.dailyPace) : metric.dailyPace}/día
          </p>
          <p className="text-xs text-muted-foreground">
            Proy: {formatProjection ? formatProjection(metric.projection) : formatNumber(metric.projection)}
          </p>
        </div>
      )}
      <Badge variant={cfg.variant} className="text-xs">
        {cfg.label}
      </Badge>
    </div>
  );
}

export const QuarterlyAnnualScorecard: React.FC = () => {
  const { quarterProgress, annualProgress, isLoading } = useQuarterlyAnnualProgress();
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Quarterly Scorecard */}
      {quarterProgress && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                Trimestral — {quarterProgress.quarterLabel}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] sm:text-xs gap-1 w-fit">
                <Calendar className="h-3 w-3" />
                {isMobile 
                  ? `D${quarterProgress.daysElapsed}/${quarterProgress.totalDays}`
                  : `Día ${quarterProgress.daysElapsed} de ${quarterProgress.totalDays} · ${quarterProgress.daysRemaining} restantes`
                }
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn("gap-4 md:gap-6", isMobile ? "grid grid-cols-1 divide-y divide-border/50 [&>*:not(:first-child)]:pt-4" : "grid grid-cols-2")}>
              <MetricColumn
                title="Servicios"
                metric={quarterProgress.services}
                formatActual={formatNumber}
                formatTarget={formatNumber}
                formatPace={(v) => `${v}`}
                formatProjection={formatNumber}
              />
              <MetricColumn
                title="GMV"
                metric={quarterProgress.gmv}
                formatActual={formatGMV}
                formatTarget={formatGMV}
                formatPace={(v) => `$${(v / 1000).toFixed(0)}K`}
                formatProjection={formatGMV}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Annual Scorecard */}
      {annualProgress && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Anual {annualProgress.year}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] sm:text-xs gap-1 w-fit">
                <Calendar className="h-3 w-3" />
                {isMobile 
                  ? `D${annualProgress.daysElapsed}/${annualProgress.totalDays}`
                  : `Día ${annualProgress.daysElapsed} de ${annualProgress.totalDays}`
                }
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn("gap-4 md:gap-6", isMobile ? "grid grid-cols-1 divide-y divide-border/50 [&>*:not(:first-child)]:pt-4" : "grid grid-cols-2")}>
              <MetricColumn
                title="Servicios"
                metric={annualProgress.services}
                formatActual={formatNumber}
                formatTarget={formatNumber}
                formatPace={(v) => `${v}`}
                formatProjection={(v) => formatNumber(v)}
              />
              <MetricColumn
                title="GMV"
                metric={annualProgress.gmv}
                formatActual={formatGMV}
                formatTarget={formatGMV}
                formatPace={(v) => `$${(v / 1000).toFixed(0)}K`}
                formatProjection={formatGMV}
              />
            </div>

            {/* YoY Comparison — stack on mobile */}
            {(annualProgress.prevYearServices > 0 || annualProgress.prevYearGmv > 0) && (
              <div className={cn(
                "mt-4 pt-4 border-t border-border/50",
                isMobile ? "space-y-3" : "grid grid-cols-2 gap-6"
              )}>
                <div>
                  <p className="text-xs text-muted-foreground">vs {annualProgress.year - 1}</p>
                  <p className={cn(
                    'text-sm font-semibold',
                    annualProgress.services.projection > annualProgress.prevYearServices ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {formatNumber(annualProgress.services.projection)} vs {formatNumber(annualProgress.prevYearServices)}
                    {' '}
                    ({annualProgress.prevYearServices > 0
                      ? formatPercent(((annualProgress.services.projection - annualProgress.prevYearServices) / annualProgress.prevYearServices) * 100)
                      : '—'})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">vs {annualProgress.year - 1}</p>
                  <p className={cn(
                    'text-sm font-semibold',
                    annualProgress.gmv.projection > annualProgress.prevYearGmv ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {formatGMV(annualProgress.gmv.projection)} vs {formatGMV(annualProgress.prevYearGmv)}
                    {' '}
                    ({annualProgress.prevYearGmv > 0
                      ? formatPercent(((annualProgress.gmv.projection - annualProgress.prevYearGmv) / annualProgress.prevYearGmv) * 100)
                      : '—'})
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
