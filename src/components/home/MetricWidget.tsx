import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricWidgetProps {
  label: string;
  value: number | string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  index?: number;
}

export const MetricWidget = ({
  label,
  value,
  trend,
  trendDirection,
  isLoading,
  index = 0,
}: MetricWidgetProps) => {
  if (isLoading) {
    return (
      <div 
        className={`liquid-glass-widget glass-skeleton h-24 stagger-${index + 1}`}
        style={{ animationDelay: `${index * 50}ms` }}
      />
    );
  }

  const TrendIcon = trendDirection === 'up' ? TrendingUp : 
                    trendDirection === 'down' ? TrendingDown : Minus;

  return (
    <div 
      className="liquid-glass-widget text-center animate-apple-slide-in"
      style={{ animationDelay: `${(index + 1) * 50}ms` }}
    >
      <div className="space-y-1">
        <p className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        
        {trend !== undefined && (
          <div className={`
            flex items-center justify-center gap-1 text-xs font-medium
            ${trendDirection === 'up' ? 'text-success' : 
              trendDirection === 'down' ? 'text-destructive' : 
              'text-muted-foreground'}
          `}>
            <TrendIcon className="h-3 w-3" />
            <span>{trend > 0 ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
