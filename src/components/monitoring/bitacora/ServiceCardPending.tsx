import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';
import { ConfirmTransitionDialog } from './ConfirmTransitionDialog';
import type { BoardService } from '@/hooks/useBitacoraBoard';
import { cn } from '@/lib/utils';

interface ServiceCardPendingProps {
  service: BoardService;
  onIniciar: (id: string) => void;
  isPending: boolean;
}

export const ServiceCardPending: React.FC<ServiceCardPendingProps> = ({ service, onIniciar, isPending }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const cita = new Date(service.fecha_hora_cita);
  const now = new Date();
  const minsToCita = Math.round((cita.getTime() - now.getTime()) / 60_000);

  let urgencyColor = 'text-chart-2';
  if (minsToCita <= 0) urgencyColor = 'text-destructive';
  else if (minsToCita <= 30) urgencyColor = 'text-chart-4';

  const timeLabel = minsToCita <= 0
    ? `Hace ${Math.abs(minsToCita)}m`
    : `En ${minsToCita}m`;

  return (
    <>
      <div className="rounded-lg bg-muted/20 hover:bg-muted/40 px-3 py-2 transition-colors">
        {/* Row 1: Client + Timer */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium truncate flex-1">{service.nombre_cliente}</span>
          <span className={cn('text-xs font-mono tabular-nums', urgencyColor)}>
            <Clock className="h-2.5 w-2.5 inline mr-0.5 relative -top-px" />
            {timeLabel}
          </span>
        </div>

        {/* Row 2: Custodio · Route */}
        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
          {service.custodio_asignado || 'Sin custodio'} · {service.origen} → {service.destino}
        </div>

        {/* Row 3: Action */}
        <div className="flex justify-end mt-1">
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
    </>
  );
};
