import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Fuel, Coffee, Bath, BedDouble, AlertTriangle, MapPinCheck, Timer, MoreHorizontal } from 'lucide-react';
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
  { tipo: 'combustible', icon: <Fuel className="h-3.5 w-3.5" />, label: 'Combustible' },
  { tipo: 'baño', icon: <Bath className="h-3.5 w-3.5" />, label: 'Baño' },
  { tipo: 'descanso', icon: <Coffee className="h-3.5 w-3.5" />, label: 'Descanso' },
  { tipo: 'pernocta', icon: <BedDouble className="h-3.5 w-3.5" />, label: 'Pernocta' },
  { tipo: 'incidencia', icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Incidencia' },
];

export const ServiceCardActive: React.FC<ServiceCardActiveProps> = ({
  service, onEventoEspecial, onCheckpoint, onLlegadaDestino,
  isCheckpointPending, isEventoPending, isLlegadaPending,
}) => {
  const [llegadaConfirm, setLlegadaConfirm] = useState(false);

  const timerColor = service.alertLevel === 'critical'
    ? 'text-destructive animate-pulse'
    : service.alertLevel === 'warning'
    ? 'text-chart-4'
    : 'text-chart-2';

  const borderAccent = service.alertLevel === 'critical'
    ? 'border-l-destructive'
    : service.alertLevel === 'warning'
    ? 'border-l-chart-4'
    : 'border-l-transparent';

  return (
    <>
      <div className={cn(
        'rounded-lg bg-muted/30 hover:bg-muted/50 border-l-2 px-3 py-3 transition-colors group',
        borderAccent
      )}>
        {/* Row 1: Timer hero — right aligned, dominant */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium truncate flex-1">{service.nombre_cliente}</span>
          <span className={cn('text-lg font-mono tabular-nums leading-none', timerColor)}>
            {service.minutesSinceLastAction}<span className="text-xs ml-0.5">m</span>
          </span>
        </div>

        {/* Row 2: Custodio · Route */}
        <div className="text-[11px] text-muted-foreground truncate mt-1">
          {service.custodio_asignado || 'Sin custodio'} · {service.origen} → {service.destino}
        </div>

        {/* Row 3: Folio + Actions */}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[10px] font-mono text-muted-foreground/60">{service.id_servicio}</span>
          <div className="flex-1" />

          <CheckpointPopover
            servicioId={service.id_servicio}
            clienteLabel={service.nombre_cliente}
            isPending={isCheckpointPending}
            onSubmit={(data) => onCheckpoint({ servicioIdServicio: service.id_servicio, ...data })}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
            >
              <Timer className="h-3 w-3" />
              Reportar
            </Button>
          </CheckpointPopover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground/50"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {SPECIAL_EVENTS.map(evt => (
                <DropdownMenuItem
                  key={evt.tipo}
                  onClick={() => onEventoEspecial(service.id_servicio, evt.tipo)}
                  disabled={isEventoPending}
                  className="text-xs gap-2"
                >
                  {evt.icon}
                  {evt.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
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
      </div>

      <ConfirmTransitionDialog
        open={llegadaConfirm}
        onOpenChange={setLlegadaConfirm}
        title="Confirmar llegada a destino"
        description={`¿Registrar llegada a destino para ${service.nombre_cliente}?`}
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
