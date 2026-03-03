import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, AlertOctagon, Activity, Timer, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SecurityKPIs } from '@/hooks/security/useSecurityDashboard';

type PostureLevel = 'critica' | 'elevada' | 'moderada' | 'estable';

function derivePosture(kpis: SecurityKPIs, drfScore?: number): { level: PostureLevel; label: string } {
  const { daysSinceLastCritical, operativeCritical, controlEffectivenessRate } = kpis;

  // Critical: siniestro in last 7 days
  if (daysSinceLastCritical < 7) {
    return { level: 'critica', label: 'CRÍTICA' };
  }

  // Cross-validation: if DRF < 25, don't escalate beyond moderada unless siniestro <7d
  if (drfScore !== undefined && drfScore < 25 && daysSinceLastCritical >= 7) {
    if (daysSinceLastCritical < 30) {
      return { level: 'moderada', label: 'MODERADA' };
    }
    return { level: 'estable', label: 'ESTABLE' };
  }

  // Elevated: siniestro in last 30 days OR multiple recent siniestros
  if (daysSinceLastCritical < 30 || operativeCritical >= 2) {
    return { level: 'elevada', label: 'ELEVADA' };
  }

  // Moderate: siniestro in last 90 days OR low checklist coverage
  if (daysSinceLastCritical < 90 || controlEffectivenessRate < 15) {
    return { level: 'moderada', label: 'MODERADA' };
  }

  return { level: 'estable', label: 'ESTABLE' };
}

const POSTURE_STYLES: Record<PostureLevel, { bg: string; border: string; icon: React.ElementType; iconColor: string; dot: string }> = {
  critica: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-300 dark:border-red-800',
    icon: AlertOctagon,
    iconColor: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
  },
  elevada: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-300 dark:border-orange-800',
    icon: AlertTriangle,
    iconColor: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  moderada: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-300 dark:border-yellow-800',
    icon: Shield,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    dot: 'bg-yellow-500',
  },
  estable: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-300 dark:border-green-800',
    icon: CheckCircle2,
    iconColor: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
  },
};

interface PostureBannerProps {
  kpis: SecurityKPIs;
  drfScore?: number;
  drfLevel?: string;
}

export function PostureBanner({ kpis, drfScore, drfLevel }: PostureBannerProps) {
  const { level, label } = derivePosture(kpis, drfScore);
  const style = POSTURE_STYLES[level];
  const Icon = style.icon;

  const daysDisplay = kpis.daysSinceLastCritical > 900 ? '—' : `${kpis.daysSinceLastCritical}d`;

  return (
    <div className={cn('rounded-lg border px-4 py-2.5 flex items-center gap-3', style.bg, style.border)}>
      {/* Posture icon + label */}
      <div className="relative shrink-0">
        <Icon className={cn('h-5 w-5', style.iconColor)} />
        <span className={cn('absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full animate-pulse', style.dot)} />
      </div>
      <span className={cn('text-[11px] font-bold tracking-widest shrink-0', style.iconColor)}>
        {label}
      </span>

      {/* Inline KPIs */}
      <div className="flex items-center gap-4 ml-2 flex-1 min-w-0 overflow-x-auto">
        {/* Days since siniestro */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Timer className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-foreground">{daysDisplay}</span>
            <span className="text-[10px] text-muted-foreground">sin siniestro</span>
          </div>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-border shrink-0" />

        {/* DRF */}
        {drfScore !== undefined && (
          <>
            <div className="flex items-center gap-1.5 shrink-0">
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-foreground">{drfScore}</span>
                <span className="text-[10px] text-muted-foreground">DRF</span>
                {drfLevel && (
                  <span className={cn(
                    'text-[9px] font-medium px-1 py-0.5 rounded',
                    drfLevel === 'bajo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    drfLevel === 'medio' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    drfLevel === 'alto' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  )}>
                    {drfLevel === 'bajo' ? 'Bajo' : drfLevel === 'medio' ? 'Medio' : drfLevel === 'alto' ? 'Alto' : 'Crítico'}
                  </span>
                )}
              </div>
            </div>
            <div className="h-4 w-px bg-border shrink-0" />
          </>
        )}

        {/* Checklist coverage */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-foreground">{kpis.controlEffectivenessRate}%</span>
            <span className="text-[10px] text-muted-foreground">cobertura</span>
          </div>
        </div>

        <div className="h-4 w-px bg-border shrink-0" />

        {/* Siniestros 90d */}
        <div className="flex items-center gap-1.5 shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-foreground">{kpis.operativeCritical}</span>
            <span className="text-[10px] text-muted-foreground">siniestros 90d</span>
          </div>
        </div>
      </div>
    </div>
  );
}
