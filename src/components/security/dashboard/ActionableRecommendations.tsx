import React from 'react';
import { AlertTriangle, Shield, Activity, MapPin, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SecurityKPIs } from '@/hooks/security/useSecurityDashboard';

interface Recommendation {
  priority: 'alta' | 'media' | 'baja';
  icon: React.ElementType;
  text: string;
}

function generateRecommendations(kpis: SecurityKPIs): Recommendation[] {
  const recs: Recommendation[] = [];

  if (kpis.controlEffectivenessRate < 60) {
    recs.push({
      priority: 'alta',
      icon: Activity,
      text: `Efectividad de controles al ${kpis.controlEffectivenessRate}% — revisar protocolos de respuesta y capacitación ISO 28000 §8.`,
    });
  } else if (kpis.controlEffectivenessRate < 80) {
    recs.push({
      priority: 'media',
      icon: Activity,
      text: `Controles al ${kpis.controlEffectivenessRate}% — incrementar supervisión en corredores con fallo recurrente.`,
    });
  }

  if (kpis.daysSinceLastCritical < 7) {
    recs.push({
      priority: 'alta',
      icon: AlertTriangle,
      text: `Solo ${kpis.daysSinceLastCritical} día(s) desde último incidente crítico — mantener alerta elevada y reforzar escoltas.`,
    });
  }

  if (kpis.servicesInRedZones > 3) {
    recs.push({
      priority: 'alta',
      icon: MapPin,
      text: `${kpis.servicesInRedZones} zonas en riesgo alto/extremo — evaluar rutas alternativas y comunicación satelital.`,
    });
  }

  if (kpis.operativeCritical > 3) {
    recs.push({
      priority: 'media',
      icon: Shield,
      text: `${kpis.operativeCritical} incidentes operativos críticos — priorizar auditoría de causas raíz.`,
    });
  }

  if (kpis.safePointsVerified < 5) {
    recs.push({
      priority: 'media',
      icon: CheckCircle2,
      text: `Solo ${kpis.safePointsVerified} puntos seguros verificados — ampliar red de refugios certificados.`,
    });
  }

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
