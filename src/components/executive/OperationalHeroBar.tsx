import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroMetric {
  label: string;
  value: string;
  target?: number;
  actual?: number;
  change: number;
  changeLabel: string;
  unit?: string;
}

interface OperationalHeroBarProps {
  fillRate: HeroMetric;
  onTimePerformance: HeroMetric;
  servicesMTD: HeroMetric;
  gmvMTD: HeroMetric;
}

type SemaphoreLevel = 'success' | 'warning' | 'danger';

const getSemaphoreLevel = (metricType: string, value: number, target?: number): SemaphoreLevel => {
  switch (metricType) {
    case 'fillRate':
      if (value >= 95) return 'success';
      if (value >= 90) return 'warning';
      return 'danger';
    case 'onTime':
      if (value >= 90) return 'success';
      if (value >= 80) return 'warning';
      return 'danger';
    case 'services':
    case 'gmv':
      if (!target) return 'success';
      const percentOfTarget = (value / target) * 100;
      if (percentOfTarget >= 100) return 'success';
      if (percentOfTarget >= 90) return 'warning';
      return 'danger';
    default:
      return 'success';
  }
};

const semaphoreStyles: Record<SemaphoreLevel, { border: string; bg: string; indicator: string }> = {
  success: {
    border: 'border-l-4 border-l-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    indicator: 'bg-emerald-500'
  },
  warning: {
    border: 'border-l-4 border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    indicator: 'bg-amber-500'
  },
  danger: {
    border: 'border-l-4 border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    indicator: 'bg-red-500'
  }
};

const HeroCard: React.FC<{
  metric: HeroMetric;
  semaphore: SemaphoreLevel;
  metricKey: string;
}> = ({ metric, semaphore, metricKey }) => {
  const styles = semaphoreStyles[semaphore];
  const TrendIcon = metric.change > 0 ? TrendingUp : metric.change < 0 ? TrendingDown : Minus;
  const isPositiveChange = metricKey === 'onTime' || metricKey === 'fillRate' 
    ? metric.change >= 0 
    : metric.change >= 0;
  
  return (
    <div 
      className={cn(
        'relative p-4 rounded-lg transition-all duration-200 hover:shadow-md',
        styles.border,
        styles.bg,
        'border border-border/50'
      )}
    >
      {/* Semaphore indicator dot */}
      <div className="absolute top-3 right-3">
        <div className={cn('w-2.5 h-2.5 rounded-full animate-pulse', styles.indicator)} />
      </div>
      
      {/* Label */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {metric.label}
      </p>
      
      {/* Value */}
      <p className="text-3xl font-bold text-foreground tracking-tight">
        {metric.value}
        {metric.unit && <span className="text-lg font-normal text-muted-foreground ml-1">{metric.unit}</span>}
      </p>
      
      {/* Target if exists */}
      {metric.target && (
        <p className="text-xs text-muted-foreground mt-0.5">
          Meta: {metric.target}%
        </p>
      )}
      
      {/* Change indicator */}
      <div className="flex items-center gap-1.5 mt-2">
        <div className={cn(
          'flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium',
          isPositiveChange 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        )}>
          <TrendIcon className="h-3 w-3" />
          <span>{metric.change >= 0 ? '+' : ''}{metric.change}%</span>
        </div>
        <span className="text-xs text-muted-foreground truncate">
          {metric.changeLabel}
        </span>
      </div>
    </div>
  );
};

export const OperationalHeroBar: React.FC<OperationalHeroBarProps> = ({
  fillRate,
  onTimePerformance,
  servicesMTD,
  gmvMTD
}) => {
  const metrics = [
    { key: 'fillRate', metric: fillRate, semaphore: getSemaphoreLevel('fillRate', fillRate.actual || 0) },
    { key: 'onTime', metric: onTimePerformance, semaphore: getSemaphoreLevel('onTime', onTimePerformance.actual || 0) },
    { key: 'services', metric: servicesMTD, semaphore: getSemaphoreLevel('services', servicesMTD.actual || 0, servicesMTD.target) },
    { key: 'gmv', metric: gmvMTD, semaphore: getSemaphoreLevel('gmv', gmvMTD.actual || 0, gmvMTD.target) }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ key, metric, semaphore }) => (
          <HeroCard 
            key={key} 
            metric={metric} 
            semaphore={semaphore}
            metricKey={key}
          />
        ))}
      </div>
    </div>
  );
};
