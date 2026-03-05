import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, MapPin, User, Clock } from 'lucide-react';
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

  let urgencyColor = 'bg-chart-2/20 text-chart-2'; // green > 30min
  if (minsToCita <= 0) urgencyColor = 'bg-destructive/20 text-destructive';
  else if (minsToCita <= 30) urgencyColor = 'bg-chart-4/20 text-chart-4';

  const timeLabel = minsToCita <= 0
    ? `Hace ${Math.abs(minsToCita)}min`
    : `En ${minsToCita}min`;

  return (
    <>
      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 font-mono', urgencyColor)}>
            <Clock className="h-2.5 w-2.5 mr-0.5" />
            {timeLabel}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono">{service.id_servicio}</span>
        </div>

        <div className="text-sm font-medium truncate">{service.nombre_cliente}</div>

        <div className="space-y-0.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 truncate">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{service.custodio_asignado || 'Sin custodio'}</span>
          </div>
          <div className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{service.origen} → {service.destino}</span>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full h-8 gap-1.5 text-xs"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
        >
          <Play className="h-3.5 w-3.5" />
          Iniciar Servicio
        </Button>
      </Card>

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
