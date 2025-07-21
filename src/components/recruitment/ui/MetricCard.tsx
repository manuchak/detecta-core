
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles = {
  default: 'border-border bg-card',
  critical: 'border-red-200 bg-red-50',
  warning: 'border-yellow-200 bg-yellow-50',
  success: 'border-green-200 bg-green-50',
  info: 'border-blue-200 bg-blue-50',
};

const iconStyles = {
  default: 'text-muted-foreground',
  critical: 'text-red-600',
  warning: 'text-yellow-600',
  success: 'text-green-600',
  info: 'text-blue-600',
};

const sizeStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  size = 'md',
  loading = false
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={cn(sizeStyles[size], 'animate-pulse')}>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      sizeStyles[size],
      variantStyles[variant],
      'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5'
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', iconStyles[variant])} />
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>
          
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {trend && (
          <Badge 
            variant={trend.direction === 'up' ? 'default' : trend.direction === 'down' ? 'destructive' : 'secondary'}
            className="ml-2"
          >
            {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} {Math.abs(trend.value)}%
          </Badge>
        )}
      </div>
    </Card>
  );
}
