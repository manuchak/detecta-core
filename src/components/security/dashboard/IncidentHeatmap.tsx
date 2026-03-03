import React from 'react';
import { cn } from '@/lib/utils';
import { subDays, format, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface IncidentHeatmapProps {
  /** Array of { date: 'YYYY-MM-DD', count, severity } */
  dailyData: { date: string; count: number; maxSeverity: string }[];
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getCellColor(count: number, maxSev: string): string {
  if (count === 0) return 'bg-muted/40';
  if (maxSev === 'critica' || maxSev === 'critico') return 'bg-red-500';
  if (maxSev === 'alta' || maxSev === 'alto') return 'bg-orange-500';
  if (count >= 3) return 'bg-yellow-500';
  if (count >= 1) return 'bg-yellow-300 dark:bg-yellow-600';
  return 'bg-muted/40';
}

export function IncidentHeatmap({ dailyData }: IncidentHeatmapProps) {
  const today = new Date();
  // Build 4 weeks × 7 days grid (28 days)
  const weeks = 4;
  const totalDays = weeks * 7;

  // Create lookup
  const lookup = new Map(dailyData.map(d => [d.date, d]));

  // Generate grid: columns = weeks, rows = days (Mon-Sun)
  const grid: { date: string; count: number; maxSeverity: string; label: string }[][] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const weekCells: typeof grid[0] = [];
    for (let d = 0; d < 7; d++) {
      // Calculate offset: we go backwards from today
      const dayOffset = w * 7 + (6 - d);
      const cellDate = subDays(today, dayOffset);
      const key = format(cellDate, 'yyyy-MM-dd');
      const entry = lookup.get(key);
      // Adjust day index: getDay returns 0=Sun, we want Mon=0
      const adjustedDay = (getDay(cellDate) + 6) % 7;
      weekCells[adjustedDay] = {
        date: key,
        count: entry?.count ?? 0,
        maxSeverity: entry?.maxSeverity ?? '',
        label: format(cellDate, 'd MMM', { locale: es }),
      };
    }
    grid.push(weekCells);
  }

  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-2 font-medium">Incidentes — Últimas 4 semanas</p>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {DAY_LABELS.map(l => (
            <div key={l} className="h-4 w-3 flex items-center justify-center text-[8px] text-muted-foreground">{l}</div>
          ))}
        </div>
        {/* Weeks */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell, di) => (
              <div
                key={di}
                className={cn('h-4 w-4 rounded-sm transition-colors', getCellColor(cell?.count ?? 0, cell?.maxSeverity ?? ''))}
                title={cell ? `${cell.label}: ${cell.count} incidente(s)` : ''}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[8px] text-muted-foreground">0</span>
        <div className="h-2.5 w-2.5 rounded-sm bg-muted/40" />
        <div className="h-2.5 w-2.5 rounded-sm bg-yellow-300 dark:bg-yellow-600" />
        <div className="h-2.5 w-2.5 rounded-sm bg-yellow-500" />
        <div className="h-2.5 w-2.5 rounded-sm bg-orange-500" />
        <div className="h-2.5 w-2.5 rounded-sm bg-red-500" />
        <span className="text-[8px] text-muted-foreground">Crítico</span>
      </div>
    </div>
  );
}
