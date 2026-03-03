import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DRFTrend, DRFHistoryPoint, RiskLevel } from '@/hooks/security/useDetectaRiskFactor';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

// =============================================================================
// HELPERS
// =============================================================================

const PERIOD_TITLES: Record<string, string> = {
  DoD: 'Día',
  WoW: 'Semana',
  MoM: 'Mes',
  QoQ: 'Trimestre',
  YoY: 'Año',
};

const riskBarColor: Record<RiskLevel, string> = {
  bajo: 'bg-success',
  medio: 'bg-warning',
  alto: 'bg-[hsl(var(--chart-4))]',
  critico: 'bg-destructive',
};

const riskTextColor: Record<RiskLevel, string> = {
  bajo: 'text-success',
  medio: 'text-warning',
  alto: 'text-[hsl(var(--chart-4))]',
  critico: 'text-destructive',
};

const directionConfig = {
  improving: { label: 'Mejorando', Icon: ArrowDown, color: 'text-success' },
  stable: { label: 'Estable', Icon: Minus, color: 'text-muted-foreground' },
  worsening: { label: 'Empeorando', Icon: ArrowUp, color: 'text-destructive' },
};

// =============================================================================
// SINGLE PERIOD CARD
// =============================================================================

function PeriodCard({ trend }: { trend: DRFTrend }) {
  const { Icon, label: dirLabel, color: dirColor } = directionConfig[trend.direction];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-1.5 pt-3 px-3">
        <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          {PERIOD_TITLES[trend.period] ?? trend.period}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-1.5">
        {/* Bars */}
        {trend.history.map((point, idx) => (
          <HistoryBar key={idx} point={point} isFirst={idx === 0} opacity={1 - idx * 0.15} />
        ))}

        {/* Delta footer */}
        <div className={cn('flex items-center gap-1 pt-1 border-t border-border/50', dirColor)}>
          <Icon className="h-3 w-3" />
          <span className="text-[11px] font-medium">
            {trend.change > 0 ? '+' : ''}{trend.change} pts
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto">{dirLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// SINGLE BAR
// =============================================================================

function HistoryBar({ point, isFirst, opacity }: { point: DRFHistoryPoint; isFirst: boolean; opacity: number }) {
  const width = Math.max(point.score, 2); // minimum visible width

  return (
    <div className="flex items-center gap-1.5" style={{ opacity: Math.max(opacity, 0.4) }}>
      <span className={cn(
        'text-[10px] w-[52px] text-right shrink-0 truncate',
        isFirst ? 'font-semibold text-foreground' : 'text-muted-foreground'
      )}>
        {point.label}
      </span>
      <div className="flex-1 h-4 bg-muted/40 rounded-sm overflow-hidden relative">
        <div
          className={cn('h-full rounded-sm transition-all duration-500', riskBarColor[point.riskLevel])}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={cn(
        'text-[11px] w-7 text-right tabular-nums shrink-0',
        isFirst ? 'font-bold' : 'font-medium',
        riskTextColor[point.riskLevel]
      )}>
        {Math.round(point.score)}
      </span>
    </div>
  );
}

// =============================================================================
// MAIN GRID
// =============================================================================

export function DRFPeriodCards({ trends }: { trends: DRFTrend[] }) {
  if (!trends.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {trends.map(trend => (
        <PeriodCard key={trend.period} trend={trend} />
      ))}
    </div>
  );
}
