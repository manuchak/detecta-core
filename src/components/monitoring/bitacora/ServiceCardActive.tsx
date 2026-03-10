import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Fuel, Coffee, Bath, BedDouble, AlertTriangle, MapPinCheck, Timer, MoreHorizontal, User, Shield, Construction } from 'lucide-react';
import { ConfirmTransitionDialog } from './ConfirmTransitionDialog';
import { CheckpointPopover } from './CheckpointPopover';
import { useMonitoristaAssignment } from '@/hooks/useMonitoristaAssignment';
import type { BoardService, SpecialEventType } from '@/hooks/useBitacoraBoard';
import { cn } from '@/lib/utils';

interface ServiceCardActiveProps {
  service: BoardService;
  onEventoEspecial: (servicioIdServicio: string, tipo: SpecialEventType) => void;
  onCheckpoint: (data: { servicioIdServicio: string; descripcion?: string; lat?: number; lng?: number; ubicacion_texto?: string; foto_urls?: string[] }) => void;
  onLlegadaDestino: (serviceUUID: string, servicioIdServicio: string) => void;
  onDoubleClick?: (service: BoardService) => void;
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

// Color palette for monitorista badges
const MONITORISTA_COLORS = [
  'bg-chart-1/15 text-chart-1 border-chart-1/30',
  'bg-chart-2/15 text-chart-2 border-chart-2/30',
  'bg-chart-3/15 text-chart-3 border-chart-3/30',
  'bg-chart-4/15 text-chart-4 border-chart-4/30',
  'bg-chart-5/15 text-chart-5 border-chart-5/30',
];

const TIPO_BADGE: Record<string, { label: string; class: string }> = {
  custodia: { label: 'Custodia', class: 'bg-chart-1/15 text-chart-1 border-chart-1/30' },
  monitoreo: { label: 'Monitoreo', class: 'bg-chart-3/15 text-chart-3 border-chart-3/30' },
  transporte: { label: 'Transporte', class: 'bg-chart-4/15 text-chart-4 border-chart-4/30' },
};

export const ServiceCardActive: React.FC<ServiceCardActiveProps> = ({
  service, onEventoEspecial, onCheckpoint, onLlegadaDestino, onDoubleClick,
  isCheckpointPending, isEventoPending, isLlegadaPending,
}) => {
  const [llegadaConfirm, setLlegadaConfirm] = useState(false);
  const { monitoristaByService, monitoristas } = useMonitoristaAssignment();

  const assignedMonitorista = monitoristaByService.get(service.id_servicio);
  const monitoristaColorIndex = assignedMonitorista
    ? monitoristas.findIndex(m => m.id === assignedMonitorista.id) % MONITORISTA_COLORS.length
    : -1;

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

  const tipoMeta = TIPO_BADGE[(service.tipo_servicio || '').toLowerCase()];

  return (
    <>
      <div
        className={cn(
          'rounded-lg bg-muted/30 hover:bg-muted/50 border-l-2 px-3 py-3 transition-colors group cursor-pointer select-none',
          borderAccent
        )}
        onDoubleClick={() => onDoubleClick?.(service)}
        title="Doble clic para ver detalle"
      >
        {/* Row 1: Timer hero — right aligned, dominant */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium truncate flex-1">{service.nombre_cliente}</span>
          <span className={cn('text-lg font-mono tabular-nums leading-none', timerColor)}>
            {service.minutesSinceLastAction}<span className="text-xs ml-0.5">m</span>
          </span>
        </div>

        {/* Row 2: Custodio · Route + badges */}
        <div className="flex items-center gap-1 mt-1">
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

        {/* Row 3: Folio + Monitorista badge + Actions */}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[10px] font-mono text-muted-foreground/60">{service.id_servicio}</span>

          {assignedMonitorista && (
            <Badge
              variant="outline"
              className={cn(
                'text-[8px] px-1.5 py-0 gap-0.5 ml-1 border',
                monitoristaColorIndex >= 0 ? MONITORISTA_COLORS[monitoristaColorIndex] : '',
              )}
            >
              <User className="h-2 w-2" />
              {assignedMonitorista.display_name.split(' ')[0]}
            </Badge>
          )}

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
