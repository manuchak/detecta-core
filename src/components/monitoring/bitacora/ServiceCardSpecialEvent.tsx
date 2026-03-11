import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Timer, AlertTriangle, MessageCircle } from 'lucide-react';
import { ConfirmTransitionDialog } from './ConfirmTransitionDialog';
import { ServiceCommSheet } from './ServiceCommSheet';
import { useUnreadCounts } from '@/hooks/useServicioComm';
import { EVENTO_ICONS } from '@/hooks/useEventosRuta';
import type { BoardService } from '@/hooks/useBitacoraBoard';
import { cn } from '@/lib/utils';

interface ServiceCardSpecialEventProps {
  service: BoardService;
  onCerrar: (eventoId: string) => void;
  onDoubleClick?: (service: BoardService) => void;
  isPending: boolean;
}

const ROUTINE_TYPES = ['combustible', 'baño', 'descanso', 'trafico'];

export const ServiceCardSpecialEvent: React.FC<ServiceCardSpecialEventProps> = ({ service, onCerrar, onDoubleClick, isPending }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [commOpen, setCommOpen] = useState(false);
  const unreadMap = useUnreadCounts();
  const unreadCount = unreadMap.get(service.id) || 0;
  const event = service.activeEvent;
  if (!event) return null;

  const eventMeta = EVENTO_ICONS[event.tipo_evento] || EVENTO_ICONS.otro;
  const eventStarted = new Date(event.hora_inicio);
  const minsOpen = Math.floor((Date.now() - eventStarted.getTime()) / 60_000);

  const isRoutine = ROUTINE_TYPES.includes(event.tipo_evento);
  let eventAlertLevel: 'normal' | 'warning' | 'critical' = 'normal';
  if (minsOpen >= 45) eventAlertLevel = 'critical';
  else if (minsOpen >= 30 || (isRoutine && minsOpen >= 15)) eventAlertLevel = 'warning';

  const borderColor = eventAlertLevel === 'critical'
    ? 'border-destructive/50 shadow-destructive/20 shadow-md animate-pulse'
    : eventAlertLevel === 'warning'
    ? 'border-chart-4/50 shadow-chart-4/10 shadow-sm'
    : 'border-accent/50';

  return (
    <>
      <Card className={cn('p-3 space-y-2 cursor-pointer select-none', borderColor)} onDoubleClick={() => onDoubleClick?.(service)}>
        {/* Event type badge */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
            <span>{eventMeta.icon}</span>
            {eventMeta.label}
          </Badge>
          <Badge variant="outline" className={cn(
            'text-xs font-mono gap-1 px-2 py-0.5',
            eventAlertLevel === 'critical' ? 'text-destructive' :
            eventAlertLevel === 'warning' ? 'text-chart-4' :
            'text-muted-foreground'
          )}>
            <Timer className="h-3 w-3" />
            {minsOpen}min
          </Badge>
        </div>

        <div className="text-sm font-medium truncate">{service.nombre_cliente}</div>
        <div className="text-xs text-muted-foreground truncate">
          {service.custodio_asignado || 'Sin custodio'} · {service.id_servicio}
        </div>

        {eventAlertLevel !== 'normal' && (
          <div className={cn(
            'text-[10px] flex items-center gap-1 px-2 py-1 rounded',
            eventAlertLevel === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-chart-4/10 text-chart-4'
          )}>
            <AlertTriangle className="h-3 w-3" />
            {eventAlertLevel === 'critical' ? 'Evento excede tiempo esperado' : 'Verificar estado del evento'}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 gap-1.5 text-xs"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
        >
          <X className="h-3.5 w-3.5" />
          Cerrar Evento
        </Button>
      </Card>

      <ConfirmTransitionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Cerrar evento: ${eventMeta.label}`}
        description={`¿Cerrar el evento de ${eventMeta.label.toLowerCase()} para ${service.nombre_cliente}? Duración: ${minsOpen} minutos.`}
        confirmLabel="Cerrar Evento"
        isPending={isPending}
        onConfirm={() => {
          onCerrar(event.id);
          setConfirmOpen(false);
        }}
      />
    </>
  );
};
