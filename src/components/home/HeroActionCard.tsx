import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface HeroActionCardProps {
  title: string;
  description: string;
  value: number | string;
  formattedValue?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  cta: { label: string; route: string };
  icon: LucideIcon;
  urgency: 'normal' | 'warning' | 'critical';
  isLoading?: boolean;
  gapPercentage?: number;
  gmvTotal?: number;
  hasTarget?: boolean;
}

export const HeroActionCard = ({
  title,
  description,
  value,
  formattedValue,
  trend,
  trendDirection,
  cta,
  icon: Icon,
  urgency,
  isLoading,
  gapPercentage,
  gmvTotal,
  hasTarget,
}: HeroActionCardProps) => {
  if (isLoading) {
    return (
      <div className="liquid-glass-hero glass-skeleton h-40 animate-apple-slide-in" />
    );
  }

  const TrendIcon = trendDirection === 'up' ? TrendingUp : 
                    trendDirection === 'down' ? TrendingDown : Minus;

  // Use formattedValue if available, otherwise format the value
  const displayValue = formattedValue || value;
  
  // Determine if this is a financial/trend hero (no urgency styling)
  const isFinancialHero = trend !== undefined || formattedValue !== undefined;

  return (
    <Link 
      to={cta.route}
      className={`liquid-glass-hero ${isFinancialHero ? '' : `urgency-${urgency}`} block group animate-apple-slide-in`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`
              p-2.5 rounded-xl 
              ${isFinancialHero ? 'bg-primary/10 text-primary' :
                urgency === 'critical' ? 'bg-destructive/10 text-destructive' : 
                urgency === 'warning' ? 'bg-warning/10 text-warning' : 
                'bg-primary/10 text-primary'}
            `}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`
                text-3xl font-bold tracking-tight
                ${isFinancialHero ? 'text-foreground' :
                  urgency === 'critical' ? 'text-destructive' : 
                  urgency === 'warning' ? 'text-warning' : 
                  'text-foreground'}
              `}>
                {displayValue}
              </span>
              {trend !== undefined && hasTarget && (
                <span className={`
                  flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full
                  ${trendDirection === 'up' ? 'bg-success/10 text-success' : 
                    trendDirection === 'down' ? 'bg-destructive/10 text-destructive' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  {trend > 0 ? '+' : ''}{trend} vs plan
                  {gapPercentage !== undefined && ` (${gapPercentage}%)`}
                </span>
              )}
              {trend !== undefined && !hasTarget && (
                <span className={`
                  flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full
                  ${trendDirection === 'up' ? 'bg-success/10 text-success' : 
                    trendDirection === 'down' ? 'bg-destructive/10 text-destructive' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
              <span className="text-lg font-medium text-foreground">
                {title.toLowerCase()}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground max-w-md">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
          <span>{cta.label}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
};
