import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KPIHeroCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  className?: string;
  loading?: boolean;
  tooltip?: React.ReactNode;
}

export function KPIHeroCard({ 
  title, 
  value, 
  unit = '', 
  trend = 'neutral', 
  trendValue,
  className,
  loading = false,
  tooltip
}: KPIHeroCardProps) {
  if (loading) {
    return (
      <div className={cn(
        "bg-card border border-border/50 rounded-xl p-6 hover-lift",
        "shadow-apple hover:shadow-apple-md transition-all duration-200",
        className
      )}>
        <div className="space-y-3">
          <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
          <div className="h-8 bg-muted animate-pulse rounded w-1/2"></div>
          <div className="h-3 bg-muted animate-pulse rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const formatValue = () => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const cardContent = (
    <div className={cn(
      "bg-card border border-border/50 rounded-xl p-6 hover-lift",
      "shadow-apple hover:shadow-apple-md transition-all duration-200",
      "group cursor-pointer",
      className
    )}>
      <div className="space-y-3">
        {/* Title */}
        <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </p>
        
        {/* Value */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-light tracking-tight text-foreground">
            {formatValue()}
          </span>
          {unit && (
            <span className="text-lg font-light text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        
        {/* Trend */}
        {trendValue !== undefined && (
          <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
            <span className="text-xs">{getTrendIcon()}</span>
            <span className="font-medium">
              {Math.abs(trendValue)}%
            </span>
            <span className="text-muted-foreground">vs anterior</span>
          </div>
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-md">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}