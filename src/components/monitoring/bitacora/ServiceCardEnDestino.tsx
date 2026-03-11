import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Timer, MapPinCheck, RotateCcw, MessageCircle } from 'lucide-react';
import { ConfirmTransitionDialog } from './ConfirmTransitionDialog';
import { ServiceCommSheet } from './ServiceCommSheet';
import { useUnreadCounts } from '@/hooks/useServicioComm';
import { useIsMobile } from '@/hooks/use-mobile';
import type { BoardService } from '@/hooks/useBitacoraBoard';
import { cn } from '@/lib/utils';

interface ServiceCardEnDestinoProps {
  service: BoardService;
  onLiberar: (serviceUUID: string, servicioIdServicio: string) => void;
  onRevertir?: (serviceUUID: string, servicioIdServicio: string) => void;
  onDoubleClick?: (service: BoardService) => void;
  isPending: boolean;
  isRevertirPending?: boolean;
}

export const ServiceCardEnDestino: React.FC<ServiceCardEnDestinoProps> = ({ service, onLiberar, onRevertir, onDoubleClick, isPending, isRevertirPending }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revertConfirmOpen, setRevertConfirmOpen] = useState(false);
  const [commOpen, setCommOpen] = useState(false);
  const unreadMap = useUnreadCounts();
  const unreadCount = unreadMap.get(service.id) || 0;
  const isMobile = useIsMobile();

  return (
    <>
      <Card
        className={cn(
          'border-chart-2/30 bg-chart-2/5 cursor-pointer select-none',
          isMobile ? 'p-3 space-y-1' : 'p-3 py-4 space-y-2.5'
        )}
        onDoubleClick={() => onDoubleClick?.(service)}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <Badge className="px-2 py-0 bg-chart-2/20 text-chart-2 border-chart-2/30 gap-1 text-[10px]">
            <MapPinCheck className="h-2.5 w-2.5" />
            EN DESTINO
          </Badge>
          <Badge variant="outline" className="font-mono gap-1 px-2 py-0.5 text-muted-foreground text-xs">
            <Timer className="h-3 w-3" />
            {service.minutesSinceLastAction}min
          </Badge>
        </div>

        <div className={cn('font-medium truncate', isMobile ? 'text-sm' : 'text-sm')}>{service.nombre_cliente}</div>
        <div className={cn('text-muted-foreground truncate flex items-center gap-1', isMobile ? 'text-xs' : 'text-xs')}>
          <span className="truncate">{service.custodio_asignado || 'Sin custodio'} · {service.id_servicio}</span>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'p-0 text-muted-foreground hover:text-foreground relative shrink-0',
              isMobile ? 'h-7 w-7' : 'h-5 w-5'
            )}
            onClick={(e) => { e.stopPropagation(); setCommOpen(true); }}
          >
            <MessageCircle className={cn(isMobile ? 'h-3.5 w-3.5' : 'h-3 w-3')} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[10px] h-2.5 rounded-full bg-destructive text-destructive-foreground text-[6px] flex items-center justify-center px-0.5 animate-pulse">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>

        <div className={cn(isMobile ? 'flex gap-2' : 'space-y-1.5')}>
          <Button
            size="sm"
            className={cn(
              'gap-1.5 bg-chart-2 hover:bg-chart-2/90 text-primary-foreground',
              isMobile ? 'h-9 text-xs flex-1' : 'h-8 text-xs w-full'
            )}
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Liberar
          </Button>

          {onRevertir && (
            <Button
              size="sm"
              variant="outline"
              className={cn(
                'gap-1.5 text-muted-foreground border-muted-foreground/20',
                isMobile ? 'h-9 text-xs flex-1' : 'h-7 text-[11px] w-full'
              )}
              onClick={() => setRevertConfirmOpen(true)}
              disabled={isRevertirPending}
            >
              <RotateCcw className="h-3 w-3" />
              Revertir
            </Button>
          )}
        </div>
      </Card>

      <ConfirmTransitionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Liberar custodio y cerrar servicio"
        description={`¿Liberar al custodio ${service.custodio_asignado || ''} y marcar el servicio como completado? Esta acción es irreversible.`}
        confirmLabel="Liberar y Cerrar"
        destructive
        isPending={isPending}
        onConfirm={() => {
          onLiberar(service.id, service.id_servicio);
          setConfirmOpen(false);
        }}
      />

      {onRevertir && (
        <ConfirmTransitionDialog
          open={revertConfirmOpen}
          onOpenChange={setRevertConfirmOpen}
          title="Devolver servicio a En Ruta"
          description={`¿Revertir el estado de "${service.nombre_cliente}" a "En Ruta"? Esto corrige un marcado de llegada a destino por error. Se eliminará el evento de llegada y se registrará la corrección en la bitácora.`}
          confirmLabel="Devolver a En Ruta"
          destructive={false}
          isPending={isRevertirPending}
          requireDoubleConfirm
          doubleConfirmLabel="Confirmo que esta reversión es una corrección legítima"
          onConfirm={() => {
            onRevertir(service.id, service.id_servicio);
            setRevertConfirmOpen(false);
          }}
        />
      )}

      <ServiceCommSheet
        open={commOpen}
        onOpenChange={setCommOpen}
        service={service}
      />
    </>
  );
};