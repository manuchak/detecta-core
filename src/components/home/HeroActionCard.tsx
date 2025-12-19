import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface HeroActionCardProps {
  title: string;
  description: string;
  value: number;
  cta: { label: string; route: string };
  icon: LucideIcon;
  urgency: 'normal' | 'warning' | 'critical';
  isLoading?: boolean;
}

export const HeroActionCard = ({
  title,
  description,
  value,
  cta,
  icon: Icon,
  urgency,
  isLoading,
}: HeroActionCardProps) => {
  if (isLoading) {
    return (
      <div className="liquid-glass-hero glass-skeleton h-40 animate-apple-slide-in" />
    );
  }

  return (
    <Link 
      to={cta.route}
      className={`liquid-glass-hero urgency-${urgency} block group animate-apple-slide-in`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`
              p-2.5 rounded-xl 
              ${urgency === 'critical' ? 'bg-destructive/10 text-destructive' : 
                urgency === 'warning' ? 'bg-warning/10 text-warning' : 
                'bg-primary/10 text-primary'}
            `}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`
                text-3xl font-bold tracking-tight
                ${urgency === 'critical' ? 'text-destructive' : 
                  urgency === 'warning' ? 'text-warning' : 
                  'text-foreground'}
              `}>
                {value}
              </span>
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
