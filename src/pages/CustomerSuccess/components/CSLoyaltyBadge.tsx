import { Badge } from '@/components/ui/badge';
import { Sparkles, Activity, Shield, Star, Crown, AlertTriangle } from 'lucide-react';
import type { LoyaltyStage } from '@/hooks/useCSLoyaltyFunnel';

const STAGE_CONFIG: Record<LoyaltyStage, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  nuevo: {
    label: 'Nuevo',
    icon: Sparkles,
    className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  },
  activo: {
    label: 'Activo',
    icon: Activity,
    className: 'bg-secondary text-muted-foreground border-border',
  },
  leal: {
    label: 'Leal',
    icon: Shield,
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  promotor: {
    label: 'Promotor',
    icon: Star,
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
  embajador: {
    label: 'Embajador',
    icon: Crown,
    className: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  },
  en_riesgo: {
    label: 'En Riesgo',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
};

interface Props {
  stage: LoyaltyStage;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function CSLoyaltyBadge({ stage, size = 'sm', showIcon = true }: Props) {
  const config = STAGE_CONFIG[stage];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'} gap-1`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />}
      {config.label}
    </Badge>
  );
}
