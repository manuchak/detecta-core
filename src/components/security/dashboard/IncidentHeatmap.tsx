import React from 'react';
import { cn } from '@/lib/utils';
import { subDays, format, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Shield, CheckCircle2 } from 'lucide-react';
import type { DailyIncidentEntry } from '@/hooks/security/useSecurityDashboard';

interface IncidentHeatmapProps {
  dailyData: DailyIncidentEntry[];
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getCellColor(entry: DailyIncidentEntry): string {
  if (entry.siniestroCount > 0) return 'bg-red-600 ring-2 ring-red-400/60';
  if (entry.operativeCount > 0) {
    const sev = entry.maxSeverity;
    if (sev === 'critica' || sev === 'alta' || sev === 'critico' || sev === 'alto') return 'bg-orange-500';
    return 'bg-yellow-400 dark:bg-yellow-600';
  }
  if (entry.intelCount > 0) return 'bg-blue-300/60 dark:bg-blue-700/40';
  return 'bg-muted/40';
}

export function IncidentHeatmap({ dailyData }: IncidentHeatmapProps) {
  const today = new Date();
  const weeks = 4;

  // Check if there are ANY siniestros in the 28-day window
  const totalSiniestros = dailyData.reduce((s, d) => s + d.siniestroCount, 0);
  const totalOperative = dailyData.reduce((s, d) => s + d.operativeCount, 0);
  const totalIntel = dailyData.reduce((s, d) => s + d.intelCount, 0);

  // Calculate streak (days since last siniestro in this data)
  let streakDays = 0;
  for (let i = dailyData.length - 1; i >= 0; i--) {
    if (dailyData[i].siniestroCount > 0) break;
    streakDays++;
  }
  // If no siniestros in all 28 days, streak is at least 28
  if (totalSiniestros === 0) streakDays = 28;

  // Create lookup
  const lookup = new Map(dailyData.map(d => [d.date, d]));

  // Generate grid
  const grid: DailyIncidentEntry[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekCells: DailyIncidentEntry[] = new Array(7);
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + (6 - d);
      const cellDate = subDays(today, dayOffset);
      const key = format(cellDate, 'yyyy-MM-dd');
      const adjustedDay = (getDay(cellDate) + 6) % 7;
      const entry = lookup.get(key);
      weekCells[adjustedDay] = entry || {
        date: key,
        count: 0,
        maxSeverity: '',
        siniestroCount: 0,
        operativeCount: 0,
        intelCount: 0,
      };
    }
    grid.push(weekCells);
  }

  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">
        Incidentes Operativos Propios — 4 semanas
      </p>

      {/* Positive streak banner */}
      {totalSiniestros === 0 && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-green-700 dark:text-green-300">
              {streakDays}+ días sin siniestros — racha activa
            </p>
            <p className="text-[9px] text-green-600/80 dark:text-green-400/70">
              Sin robos ni pérdidas en las últimas 4 semanas
            </p>
          </div>
        </div>
      )}

      {/* Siniestro alert if any */}
      {totalSiniestros > 0 && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
          <Shield className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-[10px] font-medium text-red-700 dark:text-red-300">
            {totalSiniestros} siniestro(s) en 4 semanas — revisar protocolos
          </p>
        </div>
      )}

      {/* Heatmap grid */}
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-1">
          {DAY_LABELS.map(l => (
            <div key={l} className="h-4 w-3 flex items-center justify-center text-[8px] text-muted-foreground">{l}</div>
          ))}
        </div>
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell, di) => (
              <div
                key={di}
                className={cn('h-4 w-4 rounded-sm transition-colors', getCellColor(cell))}
                title={cell ? `${format(new Date(cell.date), 'd MMM', { locale: es })}: ${cell.siniestroCount > 0 ? `${cell.siniestroCount} siniestro(s), ` : ''}${cell.operativeCount} op, ${cell.intelCount} intel` : ''}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-sm bg-muted/40" />
          <span className="text-[8px] text-muted-foreground">Sin eventos</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-sm bg-blue-300/60 dark:bg-blue-700/40" />
          <span className="text-[8px] text-muted-foreground">Intel OSINT</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-sm bg-yellow-400 dark:bg-yellow-600" />
          <span className="text-[8px] text-muted-foreground">Operativo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-sm bg-orange-500" />
          <span className="text-[8px] text-muted-foreground">Op. Alta</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-sm bg-red-600 ring-2 ring-red-400/60" />
          <span className="text-[8px] text-muted-foreground">Siniestro</span>
        </div>
      </div>

      {/* Summary counts */}
      <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-border/40">
        <span className="text-[9px] text-muted-foreground">{totalSiniestros} siniestros</span>
        <span className="text-[9px] text-muted-foreground">{totalOperative} operativos</span>
        <span className="text-[9px] text-muted-foreground">{totalIntel} intel OSINT</span>
      </div>
    </div>
  );
}
