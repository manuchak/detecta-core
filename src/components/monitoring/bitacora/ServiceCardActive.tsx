import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Fuel, Coffee, Bath, BedDouble, AlertTriangle, MapPinCheck, Timer } from 'lucide-react';
import { ConfirmTransitionDialog } from './ConfirmTransitionDialog';
import { InlineReportControl } from './InlineReportControl';
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

  const borderColor = service.alertLevel === 'critical'
    ? 'border-destructive/50 shadow-destructive/20 shadow-md'
    : service.alertLevel === 'warning'
    ? 'border-chart-4/50'
    : '';

  return (
    <>
      <Card className={cn('p-3 space-y-2', borderColor)}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-muted-foreground">{service.id_servicio}</span>
          <Badge variant="outline" className={cn('text-xs font-mono gap-1 px-2 py-0.5', timerColor)}>
            <Timer className="h-3 w-3" />
            {service.minutesSinceLastAction}min
          </Badge>
        </div>

        <div className="text-sm font-medium truncate">{service.nombre_cliente}</div>
        <div className="text-xs text-muted-foreground truncate">
          {service.custodio_asignado || 'Sin custodio'} · {service.origen} → {service.destino}
        </div>

        {/* Special event buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {SPECIAL_EVENTS.map(evt => (
            <Button
              key={evt.tipo}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px] gap-1"
              onClick={() => onEventoEspecial(service.id_servicio, evt.tipo)}
              disabled={isEventoPending}
              title={evt.label}
            >
              {evt.icon}
            </Button>
          ))}
        </div>

        {/* Inline checkpoint */}
        <InlineReportControl
          servicioId={service.id_servicio}
          isPending={isCheckpointPending}
          onSubmit={(data) => onCheckpoint({ servicioIdServicio: service.id_servicio, ...data })}
        />

        {/* Llegada a Destino */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs gap-1.5 border-chart-2/50 text-chart-2 hover:bg-chart-2/10"
          onClick={() => setLlegadaConfirm(true)}
          disabled={isLlegadaPending}
        >
          <MapPinCheck className="h-3.5 w-3.5" />
          Llegada a Destino
        </Button>
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
