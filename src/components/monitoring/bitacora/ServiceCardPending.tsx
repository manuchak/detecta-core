import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, Shield, MessageCircle } from 'lucide-react';
import { ConfirmTransitionDialog } from './ConfirmTransitionDialog';
import { ServiceCommSheet } from './ServiceCommSheet';
import { useUnreadCounts } from '@/hooks/useServicioComm';
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
        className="rounded-lg bg-muted/20 hover:bg-muted/40 px-3 py-2 transition-colors cursor-pointer select-none"
        onDoubleClick={() => onDoubleClick?.(service)}
        title="Doble clic para ver detalle"
      >
        {/* Row 1: Client + Timer */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium truncate flex-1">{service.nombre_cliente}</span>
          <span className={cn('text-xs font-mono tabular-nums', urgencyColor)}>
            <Clock className="h-2.5 w-2.5 inline mr-0.5 relative -top-px" />
            {timeLabel}
          </span>
        </div>

        {/* Row 2: Custodio · Route + badges */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[11px] text-muted-foreground truncate flex-1">
            {service.requiere_armado && <Shield className="h-2.5 w-2.5 inline mr-0.5 text-chart-4 relative -top-px" />}
            {service.custodio_asignado || 'Sin custodio'} · {service.origen} → {service.destino}
          </span>
          {tipoMeta && (
            <Badge variant="outline" className={cn('text-[8px] px-1.5 py-0 shrink-0', tipoMeta.class)}>
              {tipoMeta.label}
            </Badge>
          )}
        </div>

        {/* Row 3: Action */}
        <div className="flex items-center justify-between mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[11px] px-1.5 gap-0.5 text-muted-foreground hover:text-foreground relative"
            onClick={(e) => { e.stopPropagation(); setCommOpen(true); }}
          >
            <MessageCircle className="h-3 w-3" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 rounded-full bg-destructive text-destructive-foreground text-[7px] flex items-center justify-center px-0.5 animate-pulse">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[11px] px-1.5 gap-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
          >
            Iniciar
            <ArrowRight className="h-3 w-3" />
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
        servicioId={service.id_servicio}
        clienteLabel={service.nombre_cliente}
        open={commOpen}
        onOpenChange={setCommOpen}
      />
    </>
  );
};
