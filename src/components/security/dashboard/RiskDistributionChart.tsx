import React from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface RiskDistributionChartProps {
  distribution: {
    extremo: number;
    alto: number;
    medio: number;
    bajo: number;
  };
  intelByLevel?: {
    extremo: number;
    alto: number;
    medio: number;
    bajo: number;
  };
}

const LEVELS = [
  { key: 'extremo' as const, label: 'Extremo', color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
  { key: 'alto' as const, label: 'Alto', color: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400' },
  { key: 'medio' as const, label: 'Medio', color: 'bg-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400' },
  { key: 'bajo' as const, label: 'Bajo', color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
];

export function RiskDistributionChart({ distribution, intelByLevel }: RiskDistributionChartProps) {
  const total = Object.values(distribution).reduce((s, v) => s + v, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-xs text-muted-foreground">Sin datos de zonas</p>
      </div>
    );
  }

  const maxZones = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-3">
      {/* Context note */}
      <div className="flex items-start gap-1.5 text-[9px] text-muted-foreground bg-muted/30 rounded px-2 py-1.5">
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        <span>
          {total.toLocaleString()} zonas H3 sobre la red carretera nacional. Representa cobertura estructural, no rutas activas del periodo.
        </span>
      </div>

      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-muted">
        {LEVELS.map(({ key, color }) => {
          const pct = (distribution[key] / total) * 100;
          if (pct === 0) return null;
          return <div key={key} className={cn('h-full transition-all', color)} style={{ width: `${pct}%` }} />;
        })}
      </div>

      {/* Breakdown rows */}
      {LEVELS.map(({ key, label, color, textColor }) => {
        const zones = distribution[key];
        const intel = intelByLevel?.[key] ?? 0;
        const barWidth = (zones / maxZones) * 100;

        return (
          <div key={key} className="flex items-center gap-2">
            <span className={cn('text-[10px] font-medium w-14', textColor)}>{label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${barWidth}%` }} />
            </div>
            <span className="text-[10px] font-bold text-foreground w-6 text-right">{zones}</span>
            {intelByLevel && (
              <span className="text-[9px] text-muted-foreground w-16 text-right" title="Eventos OSINT (fuentes abiertas: RRSS, web)">
                +{intel} OSINT
              </span>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground">{total.toLocaleString()} zonas en red nacional</span>
        {intelByLevel && (
          <span className="text-[10px] text-muted-foreground">
            {Object.values(intelByLevel).reduce((s, v) => s + v, 0)} eventos OSINT
          </span>
        )}
      </div>
    </div>
  );
}
