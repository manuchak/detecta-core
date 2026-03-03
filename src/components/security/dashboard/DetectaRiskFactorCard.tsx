import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDetectaRiskFactor, TrendPeriod, DRFBreakdown } from '@/hooks/security/useDetectaRiskFactor';
import { Shield, TrendingDown, TrendingUp, Minus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// =============================================================================
// GAUGE COMPONENT
// =============================================================================

function DRFGauge({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return 'hsl(0, 72%, 51%)';
    if (s >= 50) return 'hsl(25, 95%, 53%)';
    if (s >= 25) return 'hsl(45, 93%, 47%)';
    return 'hsl(142, 71%, 45%)';
  };

  const color = getColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

// =============================================================================
// PERIOD SELECTOR
// =============================================================================

const PERIOD_LABELS: Record<TrendPeriod, string> = {
  DoD: 'Día',
  WoW: 'Semana',
  MoM: 'Mes',
  QoQ: 'Trimestre',
  YoY: 'Año',
};

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
// BREAKDOWN ROW (updated keys)
// =============================================================================

const BREAKDOWN_META: { key: keyof DRFBreakdown; label: string; weight: string; inverted?: boolean }[] = [
  { key: 'exposureScore', label: 'Exposición Zonas', weight: '35%' },
  { key: 'siniestralidad', label: 'Siniestralidad', weight: '30%' },
  { key: 'incidentRate', label: 'Tasa Incidentes', weight: '15%' },
  { key: 'severityIndex', label: 'Índice Severidad', weight: '10%' },
  { key: 'mitigationRate', label: 'Cobertura Checklists', weight: '10%', inverted: true },
];

function BreakdownRow({ label, weight, value, inverted }: { label: string; weight: string; value: number; inverted?: boolean }) {
  const barColor = inverted
    ? (value > 60 ? 'bg-green-500' : value > 30 ? 'bg-yellow-500' : 'bg-red-500')
    : (value > 60 ? 'bg-red-500' : value > 30 ? 'bg-yellow-500' : 'bg-green-500');

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-28 truncate">{label}</span>
      <span className="text-[10px] text-muted-foreground/60 w-7">{weight}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-[10px] font-medium text-foreground w-8 text-right">{value}</span>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DetectaRiskFactorCard() {
  const [period, setPeriod] = useState<TrendPeriod>('MoM');
  const [open, setOpen] = useState(false);
  const { currentDRF, riskLevel, breakdown, selectedTrend, isLoading } = useDetectaRiskFactor(period);

  if (isLoading) {
    return <Skeleton className="h-48 rounded-lg" />;
  }

  const riskLabels: Record<string, string> = {
    critico: 'Crítico', alto: 'Alto', medio: 'Medio', bajo: 'Bajo',
  };

  const riskBadgeVariant: Record<string, string> = {
    critico: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    alto: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    medio: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    bajo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  const TrendIcon = selectedTrend?.direction === 'improving'
    ? TrendingDown
    : selectedTrend?.direction === 'worsening'
      ? TrendingUp
      : Minus;

  const trendColor = selectedTrend?.direction === 'improving'
    ? 'text-green-600'
    : selectedTrend?.direction === 'worsening'
      ? 'text-red-600'
      : 'text-muted-foreground';

  const trendLabel = selectedTrend?.direction === 'improving'
    ? 'Mejorando'
    : selectedTrend?.direction === 'worsening'
      ? 'Empeorando'
      : 'Estable';

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Factor de Riesgo Detecta (DRF)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] text-muted-foreground">
              {PERIOD_LABELS[period]}
            </Badge>
            <Badge variant="outline" className={cn('text-[10px]', riskBadgeVariant[riskLevel])}>
              {riskLabels[riskLevel]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Gauge + Trend */}
        <div className="flex items-center gap-4">
          <DRFGauge score={currentDRF} />
          <div className="flex-1 space-y-2">
            <PeriodSelector selected={period} onChange={setPeriod} />
            {selectedTrend && (
              <div className="space-y-1">
                <div className={cn('flex items-center gap-1', trendColor)}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{trendLabel}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {selectedTrend.change > 0 ? '+' : ''}{selectedTrend.change} pts vs {PERIOD_LABELS[period]} anterior
                  {selectedTrend.changePercent !== 0 && (
                    <span className="ml-1">({selectedTrend.changePercent > 0 ? '+' : ''}{selectedTrend.changePercent}%)</span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  Actual: {selectedTrend.current} → Anterior: {selectedTrend.previous}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Breakdown */}
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full">
            <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
            Desglose de componentes
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-1.5">
            {BREAKDOWN_META.map(({ key, label, weight, inverted }) => (
              <BreakdownRow key={key} label={label} weight={weight} value={breakdown[key]} inverted={inverted} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
