/**
 * ZoneStatusIndicator - Reusable status badge component
 * Uses semantic tokens for consistent styling across light/dark modes
 */

import { Check, AlertTriangle, AlertCircle, Circle } from 'lucide-react';

interface ZoneStatusIndicatorProps {
  status: 'assigned' | 'missing' | 'warning' | 'available' | 'partial' | 'busy' | 'unavailable';
  label?: string;
  count?: number;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const statusConfig = {
  assigned: { 
    icon: Check, 
    colorClass: 'text-success', 
    bgClass: 'bg-success/10',
    borderClass: 'border-success/30'
  },
  missing: { 
    icon: AlertTriangle, 
    colorClass: 'text-destructive', 
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/30'
  },
  warning: { 
    icon: AlertCircle, 
    colorClass: 'text-warning', 
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/30'
  },
  available: {
    icon: Circle,
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/30',
    fill: true
  },
  partial: {
    icon: Circle,
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/30',
    fill: true
  },
  busy: {
    icon: Circle,
    colorClass: 'text-chart-4',
    bgClass: 'bg-chart-4/10',
    borderClass: 'border-chart-4/30',
    fill: true
  },
  unavailable: {
    icon: Circle,
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/30',
    fill: true
  }
} as const;

export function ZoneStatusIndicator({ 
  status, 
  label, 
  count,
  size = 'sm',
  showIcon = true
}: ZoneStatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isFilled = 'fill' in config && config.fill;
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : 'px-2.5 py-1 text-sm gap-1.5';
  
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <div className={`
      inline-flex items-center rounded-md border
      ${config.bgClass} ${config.borderClass} ${sizeClasses}
    `}>
      {showIcon && (
        <Icon 
          className={`${iconSize} ${config.colorClass} ${isFilled ? 'fill-current' : ''}`} 
        />
      )}
      {label && (
        <span className={`font-medium ${config.colorClass}`}>
          {label}
        </span>
      )}
      {count !== undefined && (
        <span className={`font-bold ${config.colorClass}`}>
          {count}
        </span>
      )}
    </div>
  );
}
