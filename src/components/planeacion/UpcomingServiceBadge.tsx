import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpcomingServiceBadgeProps {
  citaTime: Date;
  now: Date;
  className?: string;
}

/**
 * Badge que muestra countdown para servicios próximos.
 * - < 15 min: Rojo con animación
 * - 15-30 min: Amber/naranja
 * - 30-60 min: Azul suave
 */
export function UpcomingServiceBadge({
  citaTime,
  now,
  className
}: UpcomingServiceBadgeProps) {
  const diffMs = citaTime.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  // Solo mostrar para servicios en los próximos 60 minutos
  if (diffMinutes < 0 || diffMinutes > 60) {
    return null;
  }

  // Formatear el tiempo restante
  const formatTimeRemaining = () => {
    if (diffMinutes === 0) return '¡Ahora!';
    if (diffMinutes < 60) return `En ${diffMinutes} min`;
    return `En 1 hora`;
  };

  // Determinar estilo según urgencia
  const getStyles = () => {
    if (diffMinutes <= 15) {
      return {
        containerClass: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 animate-pulse',
        iconClass: 'text-red-600 dark:text-red-400',
        Icon: AlertTriangle
      };
    }
    if (diffMinutes <= 30) {
      return {
        containerClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
        iconClass: 'text-amber-600 dark:text-amber-400',
        Icon: Clock
      };
    }
    return {
      containerClass: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      iconClass: 'text-blue-500 dark:text-blue-400',
      Icon: Clock
    };
  };

  const styles = getStyles();
  const IconComponent = styles.Icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[10px] font-semibold px-1.5 py-0.5",
        styles.containerClass,
        className
      )}
    >
      <IconComponent className={cn("w-3 h-3", styles.iconClass)} />
      {formatTimeRemaining()}
    </Badge>
  );
}

/**
 * Determina si un servicio debe tener highlight visual.
 * Retorna clases CSS para el borde del card.
 */
export function getUpcomingHighlightClass(citaTime: Date, now: Date): string {
  const diffMs = citaTime.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 0 || diffMinutes > 60) {
    return '';
  }
  
  if (diffMinutes <= 15) {
    return 'ring-2 ring-red-400/60 dark:ring-red-500/50 ring-offset-2 ring-offset-background';
  }
  if (diffMinutes <= 30) {
    return 'ring-2 ring-amber-300/60 dark:ring-amber-500/40 ring-offset-1 ring-offset-background';
  }
  return 'ring-1 ring-blue-200/60 dark:ring-blue-600/30';
}
