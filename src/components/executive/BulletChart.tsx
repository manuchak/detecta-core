import React from 'react';
import { cn } from '@/lib/utils';

interface BulletChartProps {
  label: string;
  actual: number;
  proRata: number;
  target: number;
  format?: 'number' | 'currency';
  className?: string;
}

export const BulletChart: React.FC<BulletChartProps> = ({
  label,
  actual,
  proRata,
  target,
  format = 'number',
  className,
}) => {
  const percentActual = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const percentProRata = target > 0 ? Math.min((proRata / target) * 100, 100) : 0;
  const percentOfProRata = proRata > 0 ? (actual / proRata) * 100 : 0;

  // Determine status color based on performance vs pro-rata
  const getStatusColor = () => {
    if (percentOfProRata >= 100) return 'bg-emerald-500';
    if (percentOfProRata >= 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatValue = (value: number) => {
    if (format === 'currency') {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
      }
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label and values */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Actual: <span className="font-semibold text-foreground">{formatValue(actual)}</span></span>
          <span>Meta: <span className="font-medium">{formatValue(target)}</span></span>
        </div>
      </div>

      {/* Bullet chart bar */}
      <div className="relative h-8 bg-muted/30 rounded-lg overflow-hidden">
        {/* Background zones - Red, Yellow, Green */}
        <div className="absolute inset-0 flex">
          <div className="w-[60%] bg-red-500/10" />
          <div className="w-[20%] bg-amber-500/10" />
          <div className="w-[20%] bg-emerald-500/10" />
        </div>

        {/* Actual value bar */}
        <div
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 h-4 rounded transition-all duration-500",
            getStatusColor()
          )}
          style={{ width: `${percentActual}%` }}
        />

        {/* Pro-rata marker line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/80 z-10"
          style={{ left: `${percentProRata}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-foreground/80" />
        </div>

        {/* 100% target line */}
        <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-foreground/40" />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-foreground/80 rounded-sm" />
            Pro-rata: {formatValue(proRata)}
          </span>
          <span className={cn(
            "font-medium",
            percentOfProRata >= 100 ? "text-emerald-600" : 
            percentOfProRata >= 80 ? "text-amber-600" : "text-red-600"
          )}>
            {percentOfProRata.toFixed(0)}% del plan
          </span>
        </div>
        <span>{formatValue(target)}</span>
      </div>
    </div>
  );
};
