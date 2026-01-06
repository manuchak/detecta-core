import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LMSMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const LMSMetricCard: React.FC<LMSMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
  className
}) => {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400'
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-600 dark:text-green-400';
    if (trend.value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", getTrendColor())}>
                {getTrendIcon()}
                <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", variantStyles[variant])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
