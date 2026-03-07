import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Navigation, MapPin, Zap, AlertTriangle, CheckCircle2, Shield, User } from 'lucide-react';
import type { RadarService } from '@/hooks/useServiciosTurnoLive';
import { EVENTO_ICONS, type TipoEventoRuta } from '@/hooks/useEventosRuta';
import { format } from 'date-fns';

interface PhaseServicesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: string | null;
  services: RadarService[];
}

const PHASE_CONFIG: Record<string, { icon: React.ElementType; accent: string; bg: string }> = {
  'Por Salir': { icon: Clock, accent: 'text-blue-500', bg: 'bg-blue-500/10' },
  'En Ruta': { icon: Navigation, accent: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'En Destino': { icon: MapPin, accent: 'text-violet-500', bg: 'bg-violet-500/10' },
  'Evento': { icon: Zap, accent: 'text-purple-500', bg: 'bg-purple-500/10' },
  'Alerta': { icon: AlertTriangle, accent: 'text-destructive', bg: 'bg-destructive/10' },
  'Completados': { icon: CheckCircle2, accent: 'text-emerald-600', bg: 'bg-emerald-600/10' },
};

const ServiceCard = ({ service }: { service: RadarService }) => {
  const citaTime = service.fecha_hora_cita
    ? format(new Date(service.fecha_hora_cita), 'HH:mm')
    : '—';

  const isAlert = service.alertLevel === 'warning' || service.alertLevel === 'critical';

  return (
    <div className={cn(
      'rounded-lg border p-3 space-y-1.5',
      isAlert
        ? service.alertLevel === 'critical'
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-amber-500/30 bg-amber-500/5'
        : 'border-border/60 bg-card'
    )}>
      {/* Row 1: Folio + Hora */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground font-mono tracking-wide">
          {service.id_servicio}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          🕐 {citaTime}
        </span>
      </div>

      {/* Row 2: Cliente */}
      <p className="text-sm font-medium text-foreground truncate">
        {service.nombre_cliente}
      </p>

      {/* Row 3: Ruta */}
      <p className="text-xs text-muted-foreground truncate">
        {service.origen} → {service.destino}
      </p>

      {/* Row 4: Personnel */}
      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-1 min-w-0">
          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className={cn(
            'text-xs truncate',
            service.custodio_asignado ? 'text-foreground' : 'text-muted-foreground italic'
          )}>
            {service.custodio_asignado || 'Sin asignar'}
          </span>
        </div>
        {service.requiere_armado && (
          <div className="flex items-center gap-1 min-w-0">
            <Shield className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className={cn(
              'text-xs truncate',
              service.armado_asignado ? 'text-foreground' : 'text-amber-500 italic'
            )}>
              {service.armado_asignado || 'Pendiente'}
            </span>
          </div>
        )}
      </div>

      {/* Event type badge */}
      {service.activeEvent && (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-sm">
            {EVENTO_ICONS[service.activeEvent.tipo as TipoEventoRuta]?.icon || '📍'}
          </span>
          <span className="text-xs font-medium text-violet-500">
            {EVENTO_ICONS[service.activeEvent.tipo as TipoEventoRuta]?.label || service.activeEvent.tipo}
            {' · '}{service.activeEvent.minutosActivo}m
          </span>
        </div>
      )}

      {/* Alert badge */}
      {isAlert && (
        <div className="pt-1">
          <Badge variant="destructive" className="text-[10px]">
            {service.minutesSinceLastAction}m sin actividad
          </Badge>
        </div>
      )}
    </div>
  );
};

export const PhaseServicesDrawer: React.FC<PhaseServicesDrawerProps> = ({
  open,
  onOpenChange,
  phase,
  services,
}) => {
  const config = phase ? PHASE_CONFIG[phase] : null;
  const Icon = config?.icon || Clock;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-2">
            {config && (
              <div className={cn('p-1.5 rounded-lg', config.bg)}>
                <Icon className={cn('h-4 w-4', config.accent)} />
              </div>
            )}
            <DrawerTitle className="text-base">
              {phase}
            </DrawerTitle>
            <Badge variant="outline" className="ml-auto tabular-nums">
              {services.length}
            </Badge>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          <div className="space-y-2 pb-2">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay servicios en esta fase
              </p>
            ) : (
              services.map(s => <ServiceCard key={s.id} service={s} />)
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
