import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SecurityKPIs } from '@/hooks/security/useSecurityDashboard';

type PostureLevel = 'critica' | 'elevada' | 'moderada' | 'estable';

function derivePosture(kpis: SecurityKPIs): { level: PostureLevel; label: string; narrative: string } {
  const { daysSinceLastCritical, operativeCritical, controlEffectivenessRate } = kpis;

  // Critical: siniestro in last 7 days
  if (daysSinceLastCritical < 7) {
    return {
      level: 'critica',
      label: 'CRÍTICA',
      narrative: `Siniestro hace ${daysSinceLastCritical} día(s). ${operativeCritical} siniestros en últimos 90 días. Activar protocolos de contingencia.`,
    };
  }

  // Elevated: siniestro in last 30 days OR multiple recent siniestros
  if (daysSinceLastCritical < 30 || operativeCritical >= 2) {
    return {
      level: 'elevada',
      label: 'ELEVADA',
      narrative: `${daysSinceLastCritical} días desde último siniestro. ${operativeCritical} siniestros en ventana de 90 días. Reforzar vigilancia en corredores alto-riesgo.`,
    };
  }

  // Moderate: siniestro in last 90 days OR low checklist coverage
  if (daysSinceLastCritical < 90 || controlEffectivenessRate < 15) {
    return {
      level: 'moderada',
      label: 'MODERADA',
      narrative: `Cobertura de checklists al ${controlEffectivenessRate}%. ${daysSinceLastCritical} días sin siniestro. Mantener monitoreo estándar ISO 28000.`,
    };
  }

  // Stable: 90+ days without siniestro
  return {
    level: 'estable',
    label: 'ESTABLE',
    narrative: `${daysSinceLastCritical}+ días sin siniestros, cobertura de controles al ${controlEffectivenessRate}%. Postura óptima — operación nominal.`,
  };
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

export function PostureBanner({ kpis }: { kpis: SecurityKPIs }) {
  const { level, label, narrative } = derivePosture(kpis);
  const style = POSTURE_STYLES[level];
  const Icon = style.icon;

  return (
    <div className={cn('rounded-lg border px-4 py-3 flex items-center gap-3', style.bg, style.border)}>
      <div className="relative">
        <Icon className={cn('h-6 w-6', style.iconColor)} />
        <span className={cn('absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full animate-pulse', style.dot)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold tracking-widest', style.iconColor)}>
            POSTURA OPERATIVA: {label}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{narrative}</p>
      </div>
    </div>
  );
}
