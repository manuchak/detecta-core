import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { MobileHomeBottomNav } from './MobileHomeBottomNav';
import type { ModuleConfig } from '@/config/roleHomeConfig';

interface MobileHeroData {
  title: string;
  description: string;
  value: number | string;
  formattedValue?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  gapPercentage?: number;
  gmvTotal?: number;
  hasTarget?: boolean;
  daysElapsed?: number;
  daysInMonth?: number;
  daysRemaining?: number;
  targetServices?: number;
  requiredDailyPace?: number;
  cta: { label: string; route: string };
  icon: any;
  urgency: 'normal' | 'warning' | 'critical';
  isLoading: boolean;
}

interface MobileWidgetData {
  label: string;
  value: number | string;
  subtext?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  isLoading: boolean;
}

interface MobileHomeLayoutProps {
  userName?: string;
  userEmail?: string;
  onSignOut?: () => void;
  hero: MobileHeroData | null;
  widgets: MobileWidgetData[];
  modules: ModuleConfig[];
}

export const MobileHomeLayout = ({
  userName,
  userEmail,
  onSignOut,
  hero,
  widgets,
  modules,
}: MobileHomeLayoutProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = userName || userEmail?.split('@')[0] || 'Usuario';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const TrendIcon = hero?.trendDirection === 'up' ? TrendingUp :
    hero?.trendDirection === 'down' ? TrendingDown : Minus;

  const getProgressColor = () => {
    if (!hero?.gapPercentage) return 'bg-muted';
    if (hero.gapPercentage >= 100) return 'bg-success';
    if (hero.gapPercentage >= 80) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="glass-mesh-background min-h-screen pb-24">
      <div className="px-5 pt-safe-top">
        {/* Compact Header */}
        <header className="flex items-center justify-between py-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border border-border/30 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {getGreeting()}
              </p>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                {displayName}
              </h1>
            </div>
          </div>
        </header>

        {/* Compact Hero Card */}
        {hero && !hero.isLoading && (
          <Link
            to={hero.cta.route}
            className="liquid-glass-hero-mobile block animate-apple-slide-in mb-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    {hero.formattedValue || hero.value}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {hero.title.toLowerCase()}
                  </span>
                </div>

                {/* Progress bar for targets */}
                {hero.hasTarget && hero.gapPercentage !== undefined && (
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
                        style={{ width: `${Math.min(hero.gapPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium flex items-center gap-1 ${
                        hero.trendDirection === 'up' ? 'text-success' :
                        hero.trendDirection === 'down' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}>
                        <TrendIcon className="h-3 w-3" />
                        {hero.gapPercentage}% del ritmo
                      </span>
                      {hero.daysElapsed && hero.daysInMonth && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Día {hero.daysElapsed}/{hero.daysInMonth}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Simple trend for non-target heroes */}
                {!hero.hasTarget && hero.trend !== undefined && (
                  <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${
                    hero.trendDirection === 'up' ? 'text-success' :
                    hero.trendDirection === 'down' ? 'text-destructive' :
                    'text-muted-foreground'
                  }`}>
                    <TrendIcon className="h-3 w-3" />
                    {hero.trend > 0 ? '+' : ''}{hero.trend}%
                  </div>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50 ml-3 flex-shrink-0" />
            </div>
          </Link>
        )}

        {hero?.isLoading && (
          <div className="glass-skeleton h-24 rounded-2xl mb-5 animate-apple-slide-in" />
        )}

        {/* Metric Pills */}
        {widgets.length > 0 && (
          <div className="flex gap-2.5 mb-6 overflow-x-auto no-scrollbar">
            {widgets.map((widget, index) => (
              <div
                key={index}
                className="liquid-glass-metric-pill animate-apple-slide-in flex-shrink-0 flex-1 min-w-0"
                style={{ animationDelay: `${(index + 2) * 60}ms` }}
              >
                {widget.isLoading ? (
                  <div className="glass-skeleton h-12 rounded-xl" />
                ) : (
                  <div className="text-center">
                    <p className="text-lg font-bold tracking-tight text-foreground leading-none">
                      {widget.value}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1 truncate">
                      {widget.label}
                    </p>
                    {widget.subtext && (
                      <p className={`text-[10px] mt-0.5 ${
                        widget.trendDirection === 'up' ? 'text-success' :
                        widget.trendDirection === 'down' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}>
                        {widget.subtext}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* iOS App Grid */}
        {modules.length > 0 && (
          <section>
            <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-3">
              Acceso Rápido
            </p>
            <div className="grid grid-cols-4 gap-3">
              {modules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.id}
                    to={module.route}
                    className="liquid-glass-app-mobile animate-apple-slide-in"
                    style={{ animationDelay: `${(index + 4) * 40}ms` }}
                  >
                    <div
                      className="p-2.5 rounded-[14px] mb-1"
                      style={{ backgroundColor: `${module.color}15` }}
                    >
                      <Icon
                        className="h-6 w-6"
                        style={{ color: module.color }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-foreground/80 text-center leading-tight line-clamp-2">
                      {module.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileHomeBottomNav />
    </div>
  );
};
