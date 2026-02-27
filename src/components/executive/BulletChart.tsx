import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const percentActual = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const percentProRata = target > 0 ? Math.min((proRata / target) * 100, 100) : 0;
  const percentOfProRata = proRata > 0 ? (actual / proRata) * 100 : 0;

  const getStatusColor = () => {
    if (percentOfProRata >= 100) return 'bg-emerald-500';
    if (percentOfProRata >= 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatValue = (value: number) => {
    if (format === 'currency') {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label and values — stack on mobile */}
      <div className={cn(
        "flex items-center justify-between",
        isMobile && "flex-col items-start gap-1"
      )}>
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Actual: <span className="font-semibold text-foreground">{formatValue(actual)}</span></span>
          <span>Meta: <span className="font-medium">{formatValue(target)}</span></span>
        </div>
      </div>

      {/* Bullet chart bar — taller on mobile for touch */}
      <div className={cn(
        "relative bg-muted/30 rounded-lg overflow-hidden",
        isMobile ? "h-10" : "h-8"
      )}>
        {/* Background zones */}
        <div className="absolute inset-0 flex">
          <div className="w-[60%] bg-red-500/10" />
          <div className="w-[20%] bg-amber-500/10" />
          <div className="w-[20%] bg-emerald-500/10" />
        </div>

        {/* Actual value bar */}
        <div
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 rounded transition-all duration-500",
            isMobile ? "h-5" : "h-4",
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

      {/* Legend — compact on mobile with prominent badge */}
      <div className={cn(
        "flex items-center text-[10px] text-muted-foreground",
        isMobile ? "justify-between" : "justify-between"
      )}>
        <span>0</span>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-foreground/80 rounded-sm" />
            <span className="hidden sm:inline">Pro-rata: </span>{formatValue(proRata)}
          </span>
          <span className={cn(
            "font-semibold px-1.5 py-0.5 rounded-full",
            percentOfProRata >= 100 ? "text-emerald-600 bg-emerald-500/10" : 
            percentOfProRata >= 80 ? "text-amber-600 bg-amber-500/10" : "text-red-600 bg-red-500/10"
          )}>
            {percentOfProRata.toFixed(0)}%
          </span>
        </div>
        <span>{formatValue(target)}</span>
      </div>
    </div>
  );
};
