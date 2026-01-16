import { ArrowRight, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
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
  // New temporal context props
  daysElapsed?: number;
  daysInMonth?: number;
  daysRemaining?: number;
  targetServices?: number;
  proRataServices?: number;
  requiredDailyPace?: number;
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
  daysElapsed,
  daysInMonth,
  daysRemaining,
  targetServices,
  requiredDailyPace,
}: HeroActionCardProps) => {
  if (isLoading) {
    return (
      <div className="liquid-glass-hero glass-skeleton h-40 animate-apple-slide-in" />
    );
  }

  const TrendIcon = trendDirection === 'up' ? TrendingUp : 
                    trendDirection === 'down' ? TrendingDown : Minus;

  // Determine if this is a North Star hero (monthlyTrend type with targets)
  const isNorthStarHero = hasTarget && gapPercentage !== undefined && daysElapsed !== undefined;
  
  // Determine if this is a financial/trend hero (no urgency styling)
  const isFinancialHero = trend !== undefined || formattedValue !== undefined;

  // Generate actionable gap message
  const getGapMessage = () => {
    if (!hasTarget || trend === undefined) return null;
    
    if (trend >= 0) {
      return `+${trend} servicios sobre el ritmo diario`;
    } else {
      return `Faltan ${Math.abs(trend)} para alcanzar el ritmo diario`;
    }
  };

  // Get progress bar color based on percentage
  const getProgressColor = () => {
    if (!gapPercentage) return 'bg-muted';
    if (gapPercentage >= 100) return 'bg-success';
    if (gapPercentage >= 80) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Link 
      to={cta.route}
      className={`liquid-glass-hero ${isFinancialHero ? '' : `urgency-${urgency}`} block group animate-apple-slide-in`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Header with icon and main value */}
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
            
            {isNorthStarHero ? (
              // North Star Hero: Clean hierarchy with services as primary
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    {value}
                  </span>
                  <span className="text-lg font-medium text-foreground">
                    {title.toLowerCase()}
                  </span>
                </div>
                {gmvTotal !== undefined && gmvTotal > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {gmvTotal >= 1000000 
                      ? `$${(gmvTotal / 1000000).toFixed(1)}M` 
                      : `$${Math.round(gmvTotal / 1000)}K`} GMV generado
                  </span>
                )}
              </div>
            ) : (
              // Standard Hero: Original layout
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`
                  text-3xl font-bold tracking-tight
                  ${isFinancialHero ? 'text-foreground' :
                    urgency === 'critical' ? 'text-destructive' : 
                    urgency === 'warning' ? 'text-warning' : 
                    'text-foreground'}
                `}>
                  {formattedValue || value}
                </span>
                {gmvTotal !== undefined && gmvTotal > 0 && !isNorthStarHero && (
                  <span className="text-lg text-muted-foreground font-medium">
                    ({gmvTotal >= 1000000 
                      ? `$${(gmvTotal / 1000000).toFixed(1)}M` 
                      : `$${Math.round(gmvTotal / 1000)}K`} GMV)
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
            )}
          </div>
          
          {/* Progress bar for North Star Hero */}
          {isNorthStarHero && (
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progreso del mes</span>
                <span className={`font-medium ${
                  gapPercentage >= 100 ? 'text-success' : 
                  gapPercentage >= 80 ? 'text-warning' : 
                  'text-destructive'
                }`}>
                  {gapPercentage}% del ritmo
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
                  style={{ width: `${Math.min(gapPercentage, 100)}%` }}
                />
              </div>
              
              {/* Actionable gap message */}
              <div className="flex items-center gap-2 pt-1">
                <span className={`
                  flex items-center gap-1 text-sm font-medium
                  ${trendDirection === 'up' ? 'text-success' : 
                    trendDirection === 'down' ? 'text-destructive' : 
                    'text-muted-foreground'}
                `}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  {getGapMessage()}
                </span>
              </div>
              
              {/* Temporal context */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Día {daysElapsed} de {daysInMonth}
                </span>
                <span>•</span>
                <span>Meta: {targetServices} servicios</span>
                {requiredDailyPace !== undefined && requiredDailyPace > 0 && daysRemaining !== undefined && daysRemaining > 0 && (
                  <>
                    <span>•</span>
                    <span>{requiredDailyPace}/día restante</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Description for non-North Star heroes */}
          {!isNorthStarHero && (
            <p className="text-sm text-muted-foreground max-w-md">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
          <span>{cta.label}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
};
