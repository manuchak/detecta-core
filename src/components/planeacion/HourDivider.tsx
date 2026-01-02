import React from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface HourDividerProps {
  hour: string; // "09:00", "10:00", etc.
  serviceCount: number;
  isCurrentHour?: boolean;
  className?: string;
}

/**
 * Separador visual que agrupa servicios por hora.
 * Muestra la hora, cantidad de servicios y resalta la hora actual.
 */
export function HourDivider({
  hour,
  serviceCount,
  isCurrentHour = false,
  className
}: HourDividerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 px-1",
        isCurrentHour && "relative",
        className
      )}
    >
      {/* Línea izquierda */}
      <div className={cn(
        "flex-1 h-px",
        isCurrentHour 
          ? "bg-gradient-to-r from-transparent via-blue-300 to-blue-400 dark:via-blue-600 dark:to-blue-500" 
          : "bg-border"
      )} />
      
      {/* Badge central con hora */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
          isCurrentHour
            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-300/50 dark:ring-blue-500/30 animate-pulse"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Clock className={cn(
          "w-3 h-3",
          isCurrentHour && "text-blue-600 dark:text-blue-400"
        )} />
        <span className="tabular-nums font-semibold">{hour}</span>
        {isCurrentHour && (
          <span className="text-[10px] uppercase tracking-wider ml-1 text-blue-600 dark:text-blue-400">
            Ahora
          </span>
        )}
      </div>
      
      {/* Contador de servicios */}
      <span className={cn(
        "text-[10px] tabular-nums",
        isCurrentHour ? "text-blue-600 dark:text-blue-400 font-medium" : "text-muted-foreground"
      )}>
        {serviceCount} {serviceCount === 1 ? 'servicio' : 'servicios'}
      </span>
      
      {/* Línea derecha */}
      <div className={cn(
        "flex-1 h-px",
        isCurrentHour 
          ? "bg-gradient-to-l from-transparent via-blue-300 to-blue-400 dark:via-blue-600 dark:to-blue-500" 
          : "bg-border"
      )} />
    </div>
  );
}
