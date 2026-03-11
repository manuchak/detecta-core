import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Fuel, Coffee, Bath, BedDouble, AlertTriangle, MapPinCheck, Timer, MoreHorizontal, User, Shield, Construction, MessageCircle } from 'lucide-react';
import { ConfirmTransitionDialog } from './ConfirmTransitionDialog';
import { CheckpointPopover } from './CheckpointPopover';
import { ServiceCommSheet } from './ServiceCommSheet';
import { useMonitoristaAssignment } from '@/hooks/useMonitoristaAssignment';
import { useUnreadCounts } from '@/hooks/useServicioComm';
import { useIsMobile } from '@/hooks/use-mobile';
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
  { tipo: 'trafico', icon: <Construction className="h-3.5 w-3.5" />, label: 'Tráfico' },
  { tipo: 'incidencia', icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Incidencia' },
];

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
  const [commOpen, setCommOpen] = useState(false);
  const { monitoristaByService, monitoristas } = useMonitoristaAssignment();
  const unreadMap = useUnreadCounts();
  const unreadCount = unreadMap.get(service.id) || 0;
  const isMobile = useIsMobile();

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
          'rounded-lg bg-muted/30 hover:bg-muted/50 border-l-2 transition-colors group cursor-pointer select-none',
          isMobile ? 'px-3 py-2.5' : 'px-3 py-3',
          borderAccent
        )}
        onDoubleClick={() => onDoubleClick?.(service)}
        title="Doble clic para ver detalle"
      >
        {/* Row 1: Timer hero — right aligned, dominant */}
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn('font-medium truncate flex-1', isMobile ? 'text-sm' : 'text-xs')}>{service.nombre_cliente}</span>
          <span className={cn('font-mono tabular-nums leading-none', timerColor, isMobile ? 'text-xl' : 'text-lg')}>
            {service.minutesSinceLastAction}<span className={cn('ml-0.5', isMobile ? 'text-sm' : 'text-xs')}>m</span>
          </span>
        </div>

        {/* Row 2: Custodio · Route + badges */}
        <div className="flex items-center gap-1 mt-1">
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

        {/* Row 3: Folio + Monitorista badge + Actions */}
        <div className={cn('flex items-center gap-1', isMobile ? 'mt-3' : 'mt-2')}>
          <span className={cn('font-mono text-muted-foreground/60', isMobile ? 'text-xs' : 'text-[10px]')}>{service.id_servicio}</span>

          {assignedMonitorista && (
            <Badge
              variant="outline"
              className={cn(
                'px-1.5 py-0 gap-0.5 ml-1 border',
                isMobile ? 'text-[10px]' : 'text-[8px]',
                monitoristaColorIndex >= 0 ? MONITORISTA_COLORS[monitoristaColorIndex] : '',
              )}
            >
              <User className="h-2 w-2" />
              {assignedMonitorista.display_name.split(' ')[0]}
            </Badge>
          )}

          {/* Comm badge */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-0.5 text-muted-foreground hover:text-foreground relative',
              isMobile ? 'h-9 min-h-[44px] text-xs px-2' : 'h-6 text-[11px] px-1.5'
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
              className={cn(
                'gap-1 text-muted-foreground hover:text-foreground',
                isMobile ? 'h-9 min-h-[44px] text-xs px-3' : 'h-6 text-[11px] px-2'
              )}
            >
              <Timer className={cn(isMobile ? 'h-4 w-4' : 'h-3 w-3')} />
              Reportar
            </Button>
          </CheckpointPopover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'text-muted-foreground/50',
                  isMobile ? 'h-9 w-9 min-h-[44px]' : 'h-6 w-6'
                )}
              >
                <MoreHorizontal className={cn(isMobile ? 'h-5 w-5' : 'h-3.5 w-3.5')} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side={isMobile ? 'top' : 'bottom'} className="w-44">
              {SPECIAL_EVENTS.map(evt => (
                <DropdownMenuItem
                  key={evt.tipo}
                  onClick={() => onEventoEspecial(service.id_servicio, evt.tipo)}
                  disabled={isEventoPending}
                  className={cn('gap-2', isMobile ? 'text-sm min-h-[44px]' : 'text-xs')}
                >
                  {evt.icon}
                  {evt.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLlegadaConfirm(true)}
                disabled={isLlegadaPending}
                className={cn('gap-2', isMobile ? 'text-sm min-h-[44px]' : 'text-xs')}
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

      <ServiceCommSheet
        open={commOpen}
        onOpenChange={setCommOpen}
        service={service}
      />
    </>
  );
};