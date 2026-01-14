/**
 * QuickStats - Display availability statistics for custodians
 */

import type { CustodiosCategorizados } from '@/hooks/useProximidadOperacional';

interface QuickStatsProps {
  categorized: CustodiosCategorizados | undefined;
  isLoading: boolean;
}

export function QuickStats({ categorized, isLoading }: QuickStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-3 rounded-lg bg-muted/50 animate-pulse">
            <div className="h-6 w-8 bg-muted rounded mb-1" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      count: categorized?.disponibles.length || 0,
      label: 'Disponibles',
      icon: '🟢',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      count: categorized?.parcialmenteOcupados.length || 0,
      label: 'Parciales',
      icon: '🟡',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      count: categorized?.ocupados.length || 0,
      label: 'Ocupados',
      icon: '🟠',
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      count: categorized?.noDisponibles.length || 0,
      label: 'Con conflicto',
      icon: '⚠️',
      color: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center"
        >
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm">{stat.icon}</span>
            <span className={`text-lg font-semibold ${stat.color}`}>
              {stat.count}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
