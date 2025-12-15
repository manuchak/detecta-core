import React from 'react';
import { cn } from '@/lib/utils';

interface LoadHeatmapProps {
  data: { day: number; hour: number; count: number }[][];
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const LoadHeatmap: React.FC<LoadHeatmapProps> = ({ data }) => {
  // Flatten data and find max for normalization
  const flatData = data.flat();
  const maxCount = Math.max(...flatData.map(d => d.count), 1);

  const getIntensity = (count: number) => {
    const ratio = count / maxCount;
    if (ratio === 0) return 'bg-muted';
    if (ratio < 0.25) return 'bg-green-200 dark:bg-green-900';
    if (ratio < 0.5) return 'bg-green-400 dark:bg-green-700';
    if (ratio < 0.75) return 'bg-amber-400 dark:bg-amber-700';
    return 'bg-red-500 dark:bg-red-700';
  };

  const getCount = (day: number, hour: number) => {
    if (!data[day] || !data[day][hour]) return 0;
    return data[day][hour].count || 0;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header - Hours */}
          <div className="flex">
            <div className="w-12" /> {/* Spacer for day labels */}
            {HOURS.map(hour => (
              <div 
                key={hour} 
                className="flex-1 text-center text-xs text-muted-foreground pb-2"
              >
                {hour}h
              </div>
            ))}
          </div>

          {/* Grid */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex">
              <div className="w-12 text-xs text-muted-foreground flex items-center">
                {day}
              </div>
              {HOURS.map(hour => {
                const count = getCount(dayIndex, hour);
                return (
                  <div
                    key={hour}
                    className={cn(
                      'flex-1 aspect-square m-0.5 rounded-sm transition-colors',
                      getIntensity(count)
                    )}
                    title={`${day} ${hour}:00 - ${count} tickets`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <span className="text-muted-foreground">Menos</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-sm bg-muted" />
          <div className="w-4 h-4 rounded-sm bg-green-200 dark:bg-green-900" />
          <div className="w-4 h-4 rounded-sm bg-green-400 dark:bg-green-700" />
          <div className="w-4 h-4 rounded-sm bg-amber-400 dark:bg-amber-700" />
          <div className="w-4 h-4 rounded-sm bg-red-500 dark:bg-red-700" />
        </div>
        <span className="text-muted-foreground">Más</span>
      </div>

      {/* Insights */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">📊 Insights</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Mayor volumen de tickets: identifica los días y horas con más carga</li>
          <li>• Planifica la disponibilidad de agentes según los picos de demanda</li>
          <li>• Los cuadros más oscuros indican mayor concentración de tickets</li>
        </ul>
      </div>
    </div>
  );
};
