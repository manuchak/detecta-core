import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PaceIndicatorProps {
  label: string;
  paceActual: number;
  paceNeeded: number;
  projected: number;
  target: number;
  format?: 'number' | 'currency';
  daysRemaining: number;
}

export const PaceIndicator: React.FC<PaceIndicatorProps> = ({
  label,
  paceActual,
  paceNeeded,
  projected,
  target,
  format = 'number',
  daysRemaining,
}) => {
  const deficit = projected - target;
  const willMeetTarget = projected >= target;
  const paceRatio = paceNeeded > 0 ? (paceActual / paceNeeded) * 100 : 100;

  const formatValue = (value: number) => {
    if (format === 'currency') {
      if (Math.abs(value) >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      }
      if (Math.abs(value) >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
      }
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  const formatPace = (value: number) => {
    if (format === 'currency') {
      if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
      }
      return `$${value.toFixed(0)}`;
    }
    return value.toFixed(1);
  };

  const getStatusConfig = () => {
    if (willMeetTarget) {
      return {
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        message: 'En camino a cumplir la meta',
      };
    }
    if (paceRatio >= 70) {
      return {
        icon: AlertTriangle,
        color: 'text-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        message: 'Ritmo bajo, pero alcanzable',
      };
    }
    return {
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      message: 'Riesgo de no cumplir',
    };
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <div className={cn(
      "rounded-xl border p-4 space-y-4 transition-colors",
      status.bg,
      status.border
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <div className={cn("flex items-center gap-1", status.color)}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-xs font-medium">{status.message}</span>
        </div>
      </div>

      {/* Pace Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tu ritmo actual</p>
          <p className="text-xl font-bold text-foreground">
            {formatPace(paceActual)}
            <span className="text-xs font-normal text-muted-foreground">/día</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ritmo necesario</p>
          <p className="text-xl font-bold text-foreground">
            {formatPace(paceNeeded)}
            <span className="text-xs font-normal text-muted-foreground">/día</span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Ritmo actual vs necesario</span>
          <span className={cn(
            "font-medium",
            paceRatio >= 100 ? "text-emerald-600" : 
            paceRatio >= 70 ? "text-amber-600" : "text-red-600"
          )}>
            {paceRatio.toFixed(0)}%
          </span>
        </div>
        <Progress 
          value={Math.min(paceRatio, 100)} 
          className="h-2"
        />
      </div>

      {/* Projection */}
      <div className="pt-2 border-t border-border/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Proyección fin de mes</span>
          <span className="text-sm font-semibold">{formatValue(projected)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Meta mensual</span>
          <span className="text-sm font-medium text-muted-foreground">{formatValue(target)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {willMeetTarget ? 'Excedente proyectado' : 'Déficit proyectado'}
          </span>
          <span className={cn(
            "text-sm font-semibold flex items-center gap-1",
            willMeetTarget ? "text-emerald-600" : "text-red-600"
          )}>
            {willMeetTarget ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {willMeetTarget ? '+' : ''}{formatValue(deficit)}
          </span>
        </div>
      </div>

      {/* Days remaining */}
      <div className="text-center text-xs text-muted-foreground pt-2">
        Quedan <span className="font-semibold text-foreground">{daysRemaining}</span> días para cerrar el mes
      </div>
    </div>
  );
};
