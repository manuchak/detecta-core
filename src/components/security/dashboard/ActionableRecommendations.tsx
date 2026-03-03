import React from 'react';
import { AlertTriangle, Shield, Activity, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SecurityKPIs } from '@/hooks/security/useSecurityDashboard';

interface Recommendation {
  priority: 'alta' | 'media' | 'baja';
  icon: React.ElementType;
  text: string;
}

function generateRecommendations(kpis: SecurityKPIs): Recommendation[] {
  const recs: Recommendation[] = [];

  // --- Siniestros streak ---
  if (kpis.daysSinceLastSiniestro >= 30) {
    recs.push({
      priority: 'baja',
      icon: CheckCircle2,
      text: `${kpis.daysSinceLastSiniestro} días sin siniestros — racha positiva. Mantener protocolo actual y reforzar buenas prácticas.`,
    });
  } else if (kpis.daysSinceLastSiniestro < 7) {
    recs.push({
      priority: 'alta',
      icon: AlertTriangle,
      text: `Solo ${kpis.daysSinceLastSiniestro} día(s) desde último siniestro — mantener alerta elevada, reforzar escoltas en corredor afectado.`,
    });
  } else if (kpis.daysSinceLastSiniestro < 14) {
    recs.push({
      priority: 'media',
      icon: Shield,
      text: `${kpis.daysSinceLastSiniestro} días desde último siniestro — mantener vigilancia incrementada en corredores recientes.`,
    });
  }

  // --- Control effectiveness (corrected period) ---
  if (kpis.controlEffectivenessRate < 30) {
    recs.push({
      priority: 'alta',
      icon: Activity,
      text: `Efectividad de controles al ${kpis.controlEffectivenessRate}% (${kpis.effectivenessPeriodLabel}) — ${kpis.checklistsCompleted} checklists vs ${kpis.totalServicesInPeriod.toLocaleString()} servicios. Priorizar cobertura de checklists en custodias.`,
    });
  } else if (kpis.controlEffectivenessRate < 60) {
    recs.push({
      priority: 'media',
      icon: Activity,
      text: `Controles al ${kpis.controlEffectivenessRate}% (${kpis.effectivenessPeriodLabel}) — incrementar supervisión de checklists en servicios con ruta alto riesgo.`,
    });
  } else if (kpis.controlEffectivenessRate < 80) {
    recs.push({
      priority: 'baja',
      icon: Activity,
      text: `Controles al ${kpis.controlEffectivenessRate}% (${kpis.effectivenessPeriodLabel}) — buen avance, continuar consolidando cobertura.`,
    });
  }

  // --- Siniestros recientes (90d) ---
  if (kpis.siniestrosRecent > 3) {
    recs.push({
      priority: 'alta',
      icon: AlertTriangle,
      text: `${kpis.siniestrosRecent} siniestros en últimos 90 días — solicitar análisis de corredores con mayor concentración y evaluar refuerzo de escoltas.`,
    });
  } else if (kpis.siniestrosRecent > 0) {
    recs.push({
      priority: 'media',
      icon: Shield,
      text: `${kpis.siniestrosRecent} siniestro(s) en 90 días — monitorear tendencia y verificar que controles correctivos estén implementados.`,
    });
  }

  // --- Risk zones (contextual, not raw count) ---
  if (kpis.zonesHighRisk > 1000) {
    recs.push({
      priority: 'media',
      icon: Clock,
      text: `${kpis.zonesHighRisk.toLocaleString()} zonas H3 alto/extremo en red carretera nacional. Enfoque: priorizar corredores con siniestralidad real reciente, no cobertura total.`,
    });
  }

  // Fallback
  if (recs.length === 0) {
    recs.push({
      priority: 'baja',
      icon: CheckCircle2,
      text: 'Postura de seguridad dentro de parámetros óptimos. Continuar monitoreo estándar.',
    });
  }

  return recs.slice(0, 5);
}

const PRIORITY_STYLES = {
  alta: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
  media: 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20',
  baja: 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20',
};

const PRIORITY_ICON_COLOR = {
  alta: 'text-red-600 dark:text-red-400',
  media: 'text-yellow-600 dark:text-yellow-400',
  baja: 'text-green-600 dark:text-green-400',
};

export function ActionableRecommendations({ kpis }: { kpis: SecurityKPIs }) {
  const recs = generateRecommendations(kpis);

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Acciones Recomendadas</p>
      {recs.map((rec, i) => {
        const Icon = rec.icon;
        return (
          <div key={i} className={cn('border-l-4 rounded-r-md px-3 py-2 flex items-start gap-2', PRIORITY_STYLES[rec.priority])}>
            <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', PRIORITY_ICON_COLOR[rec.priority])} />
            <p className="text-[11px] text-foreground leading-relaxed">{rec.text}</p>
          </div>
        );
      })}
    </div>
  );
}
