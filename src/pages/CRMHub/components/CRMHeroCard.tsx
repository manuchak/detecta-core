import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Minus } from 'lucide-react';

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'neutral';

interface CRMHeroCardProps {
  // Main metric
  title: string;
  value: string;
  
  // Context
  subtitle?: string;
  
  // Progress bar (optional)
  progress?: {
    value: number; // 0-100
    label?: string;
    target?: string;
  };
  
  // Trend comparison (optional)
  trend?: {
    value: number; // percentage change
    label?: string; // e.g., "vs mes anterior"
  };
  
  // Health indicator
  health?: HealthStatus;
  
  // Secondary metrics (array of key-value pairs)
  secondaryMetrics?: Array<{
    label: string;
    value: string;
    highlight?: boolean;
  }>;
  
  // Icon or badge on the right
  icon?: ReactNode;
}

const HEALTH_CONFIG = {
  healthy: {
    icon: CheckCircle,
    label: 'En buen camino',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Requiere atención',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200',
  },
  critical: {
    icon: AlertTriangle,
    label: 'Crítico',
    bgColor: 'bg-destructive/10',
    textColor: 'text-destructive',
    borderColor: 'border-destructive/20',
  },
  neutral: {
    icon: Minus,
    label: '',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    borderColor: 'border-border',
  },
};

export function CRMHeroCard({
  title,
  value,
  subtitle,
  progress,
  trend,
  health = 'neutral',
  secondaryMetrics,
  icon,
}: CRMHeroCardProps) {
  const healthConfig = HEALTH_CONFIG[health];
  const HealthIcon = healthConfig.icon;

  // Progress bar color based on health
  const progressColor = health === 'healthy' ? 'bg-green-500' 
    : health === 'warning' ? 'bg-amber-500' 
    : health === 'critical' ? 'bg-destructive' 
    : 'bg-primary';

  return (
    <Card className={cn(
      'relative overflow-hidden',
      health !== 'neutral' && `border-l-4 ${healthConfig.borderColor}`
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header with Title and Health Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </h3>
              {health !== 'neutral' && (
                <div className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                  healthConfig.bgColor,
                  healthConfig.textColor
                )}>
                  <HealthIcon className="h-3 w-3" />
                  <span>{healthConfig.label}</span>
                </div>
              )}
            </div>

            {/* Main Value */}
            <div className="space-y-2">
              <p className="text-4xl font-bold tracking-tight">{value}</p>
              
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>

            {/* Progress Bar */}
            {progress && (
              <div className="space-y-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn('h-full transition-all duration-500 rounded-full', progressColor)}
                    style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {progress.label || `${progress.value.toFixed(0)}% completado`}
                  </span>
                  {progress.target && (
                    <span className="text-muted-foreground">
                      Meta: {progress.target}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Trend Indicator */}
            {trend && (
              <div className={cn(
                'inline-flex items-center gap-1.5 text-sm font-medium',
                trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-muted-foreground'
              )}>
                {trend.value > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : trend.value < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : null}
                <span>
                  {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
                  {trend.label && <span className="text-muted-foreground font-normal ml-1">{trend.label}</span>}
                </span>
              </div>
            )}

            {/* Secondary Metrics */}
            {secondaryMetrics && secondaryMetrics.length > 0 && (
              <div className="flex items-center gap-4 pt-2 border-t flex-wrap">
                {secondaryMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{metric.label}:</span>
                    <span className={cn(
                      'text-sm font-semibold',
                      metric.highlight ? 'text-amber-600' : ''
                    )}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side Icon */}
          {icon && (
            <div className="shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for secondary metrics grid
interface CRMMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: ReactNode;
}

export function CRMMetricCard({ title, value, subtitle, trend, icon }: CRMMetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-muted-foreground'
              )}>
                {trend.value > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend.value < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                <span>
                  {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
                  {trend.label && <span className="text-muted-foreground font-normal ml-1">{trend.label}</span>}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
