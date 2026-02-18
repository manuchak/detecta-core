import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SecurityEvent {
  severity: string;
  event_date: string;
  event_type: string;
  verified: boolean;
}

interface SecurityAlertsTickerProps {
  events: SecurityEvent[];
}

const severityBadge: Record<string, string> = {
  critico: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  alto: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medio: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  bajo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const eventLabels: Record<string, string> = {
  robo: 'Robo',
  asalto: 'Asalto',
  secuestro: 'Secuestro',
  vandalismo: 'Vandalismo',
  fraude: 'Fraude',
  accidente: 'Accidente',
  amenaza: 'Amenaza',
  otro: 'Otro',
};

export function SecurityAlertsTicker({ events }: SecurityAlertsTickerProps) {
  if (!events.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        Sin eventos recientes
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {events.map((event, i) => (
        <div key={i} className="flex items-center gap-2 py-1 border-b border-border/50 last:border-0">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', severityBadge[event.severity] || '')}>
            {event.severity}
          </Badge>
          <span className="text-xs text-foreground flex-1 truncate">
            {eventLabels[event.event_type] || event.event_type}
          </span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {new Date(event.event_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      ))}
    </div>
  );
}
