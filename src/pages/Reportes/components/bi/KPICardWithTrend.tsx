import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardWithTrendProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  delta?: number;
  deltaLabel?: string;
  format?: 'number' | 'currency' | 'percentage';
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendIsGood?: boolean; // For metrics where down is good (like revenue loss)
  target?: number;
  targetLabel?: string;
}

export function KPICardWithTrend({
  title,
  value,
  previousValue,
  delta,
  deltaLabel,
  format = 'number',
  icon: Icon,
  trend,
  trendIsGood = true,
  target,
  targetLabel
}: KPICardWithTrendProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('es-MX').format(val);
    }
  };

  const determineTrend = (): 'up' | 'down' | 'neutral' => {
    if (trend) return trend;
    if (delta === undefined || delta === 0) return 'neutral';
    return delta > 0 ? 'up' : 'down';
  };

  const actualTrend = determineTrend();
  
  // Determine if trend color should be positive or negative
  const isPositiveTrend = trendIsGood ? actualTrend === 'up' : actualTrend === 'down';

  const TrendIcon = actualTrend === 'up' ? TrendingUp : actualTrend === 'down' ? TrendingDown : Minus;

  const progressToTarget = target && typeof value === 'number' ? Math.min((value / target) * 100, 100) : 0;

  return (
    <Card className="bg-background/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold">{formatValue(value)}</span>
          {delta !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded",
              isPositiveTrend 
                ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950" 
                : actualTrend === 'neutral'
                ? "text-muted-foreground bg-muted"
                : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950"
            )}>
              <TrendIcon className="h-3 w-3" />
              <span>
                {delta > 0 ? '+' : ''}{format === 'percentage' ? delta.toFixed(1) + ' pts' : (typeof delta === 'number' ? Math.abs(delta).toFixed(1) : formatValue(Math.abs(delta)))}
              </span>
            </div>
          )}
        </div>

        {previousValue !== undefined && (
          <p className="text-xs text-muted-foreground mb-2">
            {deltaLabel || 'Anterior'}: {formatValue(previousValue)}
          </p>
        )}

        {target && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{targetLabel || 'Meta'}: {formatValue(target)}</span>
              <span className={cn(
                progressToTarget >= 100 ? "text-emerald-600" : "text-amber-600"
              )}>
                {progressToTarget.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  progressToTarget >= 100 ? "bg-emerald-500" : progressToTarget >= 75 ? "bg-amber-500" : "bg-red-500"
                )}
                style={{ width: `${progressToTarget}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
