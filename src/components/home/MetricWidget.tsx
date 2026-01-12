import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricWidgetProps {
  label: string;
  value: number | string;
  subtext?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  index?: number;
  isContext?: boolean;
}

export const MetricWidget = ({
  label,
  value,
  subtext,
  trend,
  trendDirection,
  isLoading,
  index = 0,
  isContext = false,
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

  // Check if the value itself contains a trend indicator (like "+12%" or "-5%")
  const valueStr = String(value);
  const hasTrendInValue = valueStr.startsWith('+') || (valueStr.startsWith('-') && valueStr.endsWith('%'));

  return (
    <div 
      className={`
        liquid-glass-widget text-center animate-apple-slide-in
        ${isContext ? 'opacity-90 border-border/20' : ''}
      `}
      style={{ animationDelay: `${(index + 1) * 50}ms` }}
    >
      <div className="space-y-1">
        <p className={`
          text-3xl font-bold tracking-tight
          ${isContext ? 'text-foreground/90' : 'text-foreground'}
          ${hasTrendInValue && trendDirection === 'up' ? 'text-success' : ''}
          ${hasTrendInValue && trendDirection === 'down' ? 'text-destructive' : ''}
        `}>
          {value}
        </p>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        
        {/* Show subtext with context if available */}
        {subtext && (
          <p className={`
            text-xs mt-1
            ${trendDirection === 'up' ? 'text-success' : 
              trendDirection === 'down' ? 'text-destructive' : 
              'text-muted-foreground'}
          `}>
            {subtext}
          </p>
        )}
        
        {/* Show trend indicator only if no subtext and trend exists */}
        {!subtext && trend !== undefined && !hasTrendInValue && (
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
        
        {/* Show trend icon for values that contain trend but without duplicate percentage */}
        {!subtext && hasTrendInValue && trendDirection && (
          <div className={`
            flex items-center justify-center text-xs font-medium
            ${trendDirection === 'up' ? 'text-success' : 
              trendDirection === 'down' ? 'text-destructive' : 
              'text-muted-foreground'}
          `}>
            <TrendIcon className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  );
};
