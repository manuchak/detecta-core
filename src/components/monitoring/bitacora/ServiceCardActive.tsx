import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Fuel, Coffee, Bath, BedDouble, AlertTriangle, MapPinCheck, Timer, Radio, MoreVertical } from 'lucide-react';
import { ConfirmTransitionDialog } from './ConfirmTransitionDialog';
import { CheckpointPopover } from './CheckpointPopover';
import type { BoardService, SpecialEventType } from '@/hooks/useBitacoraBoard';
import { cn } from '@/lib/utils';

interface ServiceCardActiveProps {
  service: BoardService;
  onEventoEspecial: (servicioIdServicio: string, tipo: SpecialEventType) => void;
  onCheckpoint: (data: { servicioIdServicio: string; descripcion?: string; lat?: number; lng?: number; ubicacion_texto?: string; foto_urls?: string[] }) => void;
  onLlegadaDestino: (serviceUUID: string, servicioIdServicio: string) => void;
  isCheckpointPending: boolean;
  isEventoPending: boolean;
  isLlegadaPending: boolean;
}

const SPECIAL_EVENTS: { tipo: SpecialEventType; icon: React.ReactNode; label: string }[] = [
  { tipo: 'combustible', icon: <Fuel className="h-3 w-3" />, label: 'Combustible' },
  { tipo: 'baño', icon: <Bath className="h-3 w-3" />, label: 'Baño' },
  { tipo: 'descanso', icon: <Coffee className="h-3 w-3" />, label: 'Descanso' },
  { tipo: 'pernocta', icon: <BedDouble className="h-3 w-3" />, label: 'Pernocta' },
  { tipo: 'incidencia', icon: <AlertTriangle className="h-3 w-3" />, label: 'Incidencia' },
];

export const ServiceCardActive: React.FC<ServiceCardActiveProps> = ({
  service, onEventoEspecial, onCheckpoint, onLlegadaDestino,
  isCheckpointPending, isEventoPending, isLlegadaPending,
}) => {
  const [llegadaConfirm, setLlegadaConfirm] = useState(false);

  const timerColor = service.alertLevel === 'critical'
    ? 'text-destructive animate-pulse font-bold'
    : service.alertLevel === 'warning'
    ? 'text-chart-4 font-semibold'
    : 'text-chart-2';

  const borderColor = service.alertLevel === 'critical'
    ? 'border-destructive/50 shadow-destructive/20 shadow-md'
    : service.alertLevel === 'warning'
    ? 'border-chart-4/50'
    : '';

  return (
    <>
      <Card className={cn('p-2 space-y-1', borderColor)}>
        {/* Row 1: Folio + event icons + TIMER hero */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">{service.id_servicio}</span>
          <div className="flex items-center gap-0.5 ml-1">
            {SPECIAL_EVENTS.map(evt => (
              <button
                key={evt.tipo}
                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
                onClick={() => onEventoEspecial(service.id_servicio, evt.tipo)}
                disabled={isEventoPending}
                title={evt.label}
              >
                {evt.icon}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <Badge variant="outline" className={cn('text-xs font-mono gap-0.5 px-1.5 py-0 tabular-nums', timerColor)}>
            <Timer className="h-3 w-3" />
            {service.minutesSinceLastAction}m
          </Badge>
        </div>

        {/* Row 2: Client · Custodio */}
        <div className="text-xs truncate">
          <span className="font-medium">{service.nombre_cliente}</span>
          <span className="text-muted-foreground"> · {service.custodio_asignado || 'Sin custodio'}</span>
        </div>

        {/* Row 3: Route */}
        <div className="text-[10px] text-muted-foreground truncate">
          {service.origen} → {service.destino}
        </div>

        {/* Row 4: Actions */}
        <div className="flex items-center gap-1.5">
          <CheckpointPopover
            servicioId={service.id_servicio}
            clienteLabel={service.nombre_cliente}
            isPending={isCheckpointPending}
            onSubmit={(data) => onCheckpoint({ servicioIdServicio: service.id_servicio, ...data })}
          >
            <Button size="sm" className="flex-1 h-7 text-xs gap-1">
              <Radio className="h-3 w-3" />
              Reportar
            </Button>
          </CheckpointPopover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setLlegadaConfirm(true)}
                disabled={isLlegadaPending}
                className="text-xs gap-2"
              >
                <MapPinCheck className="h-3.5 w-3.5 text-chart-2" />
                Llegada a Destino
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <ConfirmTransitionDialog
        open={llegadaConfirm}
        onOpenChange={setLlegadaConfirm}
        title="Confirmar llegada a destino"
        description={`¿Registrar llegada a destino para ${service.nombre_cliente}? Después de esto no se podrán registrar eventos de ruta.`}
        confirmLabel="Confirmar Llegada"
        isPending={isLlegadaPending}
        onConfirm={() => {
          onLlegadaDestino(service.id, service.id_servicio);
          setLlegadaConfirm(false);
        }}
      />
    </>
  );
};
