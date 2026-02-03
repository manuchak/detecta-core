/**
 * QuickStats - Display availability statistics for custodians
 * Supports 'default' (grid) and 'compact' (inline) variants
 */

import { Circle, AlertTriangle } from 'lucide-react';
import type { CustodiosCategorizados } from '@/hooks/useProximidadOperacional';

interface QuickStatsProps {
  categorized: CustodiosCategorizados | undefined;
  isLoading: boolean;
  variant?: 'default' | 'compact';
}

export function QuickStats({ categorized, isLoading, variant = 'default' }: QuickStatsProps) {
  // Compact variant - single line inline badges
  if (variant === 'compact') {
    if (isLoading) {
      return (
        <div className="flex items-center gap-4 text-sm py-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 w-8 bg-muted rounded animate-pulse" />
          ))}
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-4 text-sm py-1 px-1">
        <span className="flex items-center gap-1.5 text-success font-medium">
          <Circle className="h-2.5 w-2.5 fill-current" />
          {categorized?.disponibles?.length ?? 0}
        </span>
        <span className="flex items-center gap-1.5 text-warning font-medium">
          <Circle className="h-2.5 w-2.5 fill-current" />
          {categorized?.parcialmenteOcupados?.length ?? 0}
        </span>
        <span className="flex items-center gap-1.5 text-orange-500 font-medium">
          <Circle className="h-2.5 w-2.5 fill-current" />
          {categorized?.ocupados?.length ?? 0}
        </span>
        <span className="flex items-center gap-1.5 text-destructive font-medium">
          <AlertTriangle className="h-3 w-3" />
          {categorized?.noDisponibles?.length ?? 0}
        </span>
      </div>
    );
  }

  // Default variant - grid layout
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
      count: categorized?.disponibles?.length ?? 0,
      label: 'Disponibles',
      icon: '🟢',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      count: categorized?.parcialmenteOcupados?.length ?? 0,
      label: 'Parciales',
      icon: '🟡',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      count: categorized?.ocupados?.length ?? 0,
      label: 'Ocupados',
      icon: '🟠',
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      count: categorized?.noDisponibles?.length ?? 0,
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
