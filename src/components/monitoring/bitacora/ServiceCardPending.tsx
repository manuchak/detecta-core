import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, Shield, MessageCircle } from 'lucide-react';
import { ConfirmTransitionDialog } from './ConfirmTransitionDialog';
import { ServiceCommSheet } from './ServiceCommSheet';
import { useUnreadCounts } from '@/hooks/useServicioComm';
import { useIsMobile } from '@/hooks/use-mobile';
import type { BoardService } from '@/hooks/useBitacoraBoard';
import { cn } from '@/lib/utils';

const TIPO_BADGE: Record<string, { label: string; class: string }> = {
  custodia: { label: 'Custodia', class: 'bg-chart-1/15 text-chart-1 border-chart-1/30' },
  monitoreo: { label: 'Monitoreo', class: 'bg-chart-3/15 text-chart-3 border-chart-3/30' },
  transporte: { label: 'Transporte', class: 'bg-chart-4/15 text-chart-4 border-chart-4/30' },
};

interface ServiceCardPendingProps {
  service: BoardService;
  onIniciar: (id: string) => void;
  onDoubleClick?: (service: BoardService) => void;
  isPending: boolean;
}

export const ServiceCardPending: React.FC<ServiceCardPendingProps> = ({ service, onIniciar, onDoubleClick, isPending }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [commOpen, setCommOpen] = useState(false);
  const unreadMap = useUnreadCounts();
  const unreadCount = unreadMap.get(service.id) || 0;
  const isMobile = useIsMobile();

  const cita = new Date(service.fecha_hora_cita);
  const now = new Date();
  const minsToCita = Math.round((cita.getTime() - now.getTime()) / 60_000);

  let urgencyColor = 'text-chart-2';
  if (minsToCita <= 0) urgencyColor = 'text-destructive';
  else if (minsToCita <= 30) urgencyColor = 'text-chart-4';

  const timeLabel = minsToCita <= 0
    ? `Hace ${Math.abs(minsToCita)}m`
    : `En ${minsToCita}m`;

  const tipoMeta = TIPO_BADGE[(service.tipo_servicio || '').toLowerCase()];

  return (
    <>
      <div
        className={cn(
          'rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer select-none',
          isMobile ? 'px-3 py-2' : 'px-3 py-2'
        )}
        onDoubleClick={() => onDoubleClick?.(service)}
        title="Doble clic para ver detalle"
      >
        {/* Row 1: Client + Timer */}
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn('font-medium truncate flex-1', isMobile ? 'text-xs' : 'text-xs')}>{service.nombre_cliente}</span>
          <span className={cn('font-mono tabular-nums', urgencyColor, isMobile ? 'text-sm' : 'text-xs')}>
            <Clock className={cn('inline mr-0.5 relative -top-px', isMobile ? 'h-3 w-3' : 'h-2.5 w-2.5')} />
            {timeLabel}
          </span>
        </div>

        {/* Row 2: Custodio · Route + badges */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className={cn('text-muted-foreground truncate flex-1', isMobile ? 'text-xs' : 'text-[11px]')}>
            {service.requiere_armado && <Shield className="h-2.5 w-2.5 inline mr-0.5 text-chart-4 relative -top-px" />}
            {service.custodio_asignado || 'Sin custodio'} · {service.origen} → {service.destino}
          </span>
          {tipoMeta && (
            <Badge variant="outline" className={cn('px-1.5 py-0 shrink-0', tipoMeta.class, isMobile ? 'text-[10px]' : 'text-[8px]')}>
              {tipoMeta.label}
            </Badge>
          )}
        </div>

        {/* Row 3: Action */}
        <div className={cn('flex items-center justify-between', isMobile ? 'mt-2' : 'mt-1')}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-0.5 text-muted-foreground hover:text-foreground relative',
              isMobile ? 'h-7 text-xs px-2' : 'h-5 text-[11px] px-1.5'
            )}
            onClick={(e) => { e.stopPropagation(); setCommOpen(true); }}
          >
            <MessageCircle className={cn(isMobile ? 'h-4 w-4' : 'h-3 w-3')} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 rounded-full bg-destructive text-destructive-foreground text-[7px] flex items-center justify-center px-0.5 animate-pulse">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-0.5 text-muted-foreground hover:text-foreground',
              isMobile ? 'h-7 text-xs px-3' : 'h-5 text-[11px] px-1.5'
            )}
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
          >
            Iniciar
            <ArrowRight className={cn(isMobile ? 'h-4 w-4' : 'h-3 w-3')} />
          </Button>
        </div>
      </div>

      <ConfirmTransitionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar inicio de servicio"
        description={`¿Iniciar servicio para ${service.nombre_cliente}? Custodio: ${service.custodio_asignado || 'N/A'}`}
        confirmLabel="Iniciar"
        isPending={isPending}
        onConfirm={() => {
          onIniciar(service.id);
          setConfirmOpen(false);
        }}
      />

      <ServiceCommSheet
        open={commOpen}
        onOpenChange={setCommOpen}
        service={service}
      />
    </>
  );
};