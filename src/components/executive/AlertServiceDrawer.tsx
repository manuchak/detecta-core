import React, { useMemo, useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import type { RadarService } from '@/hooks/useServiciosTurnoLive';
import type { EventoRuta } from '@/hooks/useEventosRuta';
import { initializeMapboxToken } from '@/lib/mapbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Navigation,
  Clock,
  AlertTriangle,
  Shield,
  User,
  Fuel,
  Coffee,
  Moon,
  Bed,
  Camera,
  CheckCircle2,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertServiceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: RadarService | null;
  events: EventoRuta[];
}

/* ─── Event icon mapping ─── */
const eventIcon = (tipo: string) => {
  switch (tipo) {
    case 'inicio_servicio': return <Flag className="h-3.5 w-3.5 text-emerald-500" />;
    case 'fin_servicio': return <CheckCircle2 className="h-3.5 w-3.5 text-destructive" />;
    case 'combustible': return <Fuel className="h-3.5 w-3.5 text-amber-500" />;
    case 'baño': case 'descanso': return <Coffee className="h-3.5 w-3.5 text-blue-400" />;
    case 'pernocta': return <Bed className="h-3.5 w-3.5 text-violet-500" />;
    case 'checkpoint': return <MapPin className="h-3.5 w-3.5 text-primary" />;
    case 'foto_evidencia': return <Camera className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'llegada_destino': return <MapPin className="h-3.5 w-3.5 text-emerald-500" />;
    case 'incidencia': return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
};

const eventLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    inicio_servicio: 'Inicio',
    fin_servicio: 'Fin',
    combustible: 'Combustible',
    baño: 'Baño',
    descanso: 'Descanso',
    pernocta: 'Pernocta',
    checkpoint: 'Checkpoint',
    foto_evidencia: 'Foto',
    llegada_destino: 'Llegada destino',
    liberacion_custodio: 'Liberación',
    incidencia: 'Incidencia',
    otro: 'Otro',
  };
  return labels[tipo] || tipo;
};

/* ─── Phase badge ─── */
const PhaseBadge = ({ phase }: { phase: string }) => {
  const config: Record<string, { label: string; cls: string }> = {
    en_curso: { label: 'En Ruta', cls: 'bg-emerald-500/15 text-emerald-600' },
    en_destino: { label: 'En Destino', cls: 'bg-violet-500/15 text-violet-600' },
    evento_especial: { label: 'En Evento', cls: 'bg-purple-500/15 text-purple-600' },
    por_iniciar: { label: 'Por Iniciar', cls: 'bg-blue-500/15 text-blue-600' },
  };
  const c = config[phase] || { label: phase, cls: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide', c.cls)}>
      {c.label}
    </span>
  );
};

/* ─── Route map with trail + current position ─── */
const RouteMap = ({ service, events }: { service: RadarService; events: EventoRuta[] }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeMapboxToken().then(t => {
      setToken(t);
      setLoading(false);
    });
  }, []);

  if (loading) return <Skeleton className="h-48 w-full rounded-lg" />;
  if (!token) return (
    <div className="h-48 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
      Mapa no disponible
    </div>
  );

  // Collect valid geo points from events (chronological order)
  const trailPoints = events
    .filter(e => e.lat && e.lng && Number.isFinite(e.lat) && Number.isFinite(e.lng))
    .sort((a, b) => new Date(a.hora_inicio).getTime() - new Date(b.hora_inicio).getTime())
    .map(e => [Math.round(e.lng! * 1e6) / 1e6, Math.round(e.lat! * 1e6) / 1e6] as [number, number]);

  const currentPos = service.lat && service.lng && Number.isFinite(service.lat) && Number.isFinite(service.lng)
    ? [Math.round(service.lng * 1e6) / 1e6, Math.round(service.lat * 1e6) / 1e6] as [number, number]
    : null;

  const allCoords = [...trailPoints];
  if (currentPos) allCoords.push(currentPos);

  if (allCoords.length === 0) {
    return (
      <div className="h-36 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
        Sin posición GPS disponible
      </div>
    );
  }

  // Build overlays using geojson() for trail line + pin markers
  const overlayParts: string[] = [];

  // Trail line via geojson overlay (limit to last 10 points to keep URL short)
  const lineCoords = trailPoints.slice(-10);
  if (currentPos) lineCoords.push(currentPos);
  if (lineCoords.length >= 2) {
    const geojson = {
      type: 'Feature',
      properties: { 'stroke': '#3b82f6', 'stroke-width': 3, 'stroke-opacity': 0.7 },
      geometry: { type: 'LineString', coordinates: lineCoords }
    };
    overlayParts.push(`geojson(${encodeURIComponent(JSON.stringify(geojson))})`);
  }

  // Trail pins (last 8)
  trailPoints.slice(-8).forEach(([lng, lat]) => {
    overlayParts.push(`pin-s+3b82f6(${lng},${lat})`);
  });

  // Current position pin
  if (currentPos) {
    overlayParts.push(`pin-l+ef4444(${currentPos[0]},${currentPos[1]})`);
  }

  // Position: auto-fit or center on single point
  const position = allCoords.length === 1
    ? `${allCoords[0][0]},${allCoords[0][1]},12,0`
    : 'auto';

  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlayParts.join(',')}/${position}/400x220@2x?padding=40&access_token=${token}`;

  return (
    <img
      src={url}
      alt="Ruta del servicio"
      className="w-full h-48 rounded-lg object-cover border border-border/40"
      loading="lazy"
      onError={(e) => {
        console.warn('Map image failed:', url.substring(0, 200));
        (e.target as HTMLImageElement).style.display = 'none';
        (e.target as HTMLImageElement).parentElement?.insertAdjacentHTML(
          'beforeend',
          '<div class="h-48 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">Mapa no disponible</div>'
        );
      }}
    />
  );
};

/* ─── Info pill ─── */
const InfoPill = ({ icon: Icon, label, value, accent }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent?: string;
}) => (
  <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
    <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', accent || 'text-muted-foreground')} />
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className={cn('text-sm font-semibold ml-auto tabular-nums', accent || 'text-foreground')}>{value}</span>
  </div>
);

/* ═══════ MAIN DRAWER ═══════ */
export const AlertServiceDrawer: React.FC<AlertServiceDrawerProps> = ({
  open,
  onOpenChange,
  service,
  events,
}) => {
  // Sort events chronologically (oldest first for timeline)
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.hora_inicio).getTime() - new Date(b.hora_inicio).getTime()),
    [events]
  );

  // Touchpoint analytics
  const touchpointAnalytics = useMemo(() => {
    if (sortedEvents.length < 2) return { avgInterval: 0, maxGap: 0, totalEvents: sortedEvents.length };

    const timestamps = sortedEvents.map(e => new Date(e.hora_inicio).getTime());
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push((timestamps[i] - timestamps[i - 1]) / 60_000);
    }
    const avg = intervals.length > 0 ? Math.round(intervals.reduce((s, v) => s + v, 0) / intervals.length) : 0;
    const maxGap = intervals.length > 0 ? Math.round(Math.max(...intervals)) : 0;

    return { avgInterval: avg, maxGap, totalEvents: sortedEvents.length };
  }, [sortedEvents]);

  // Format time HH:mm
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Format cita
  const fmtCita = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('es-MX', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  };

  if (!service) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <PhaseBadge phase={service.phase} />
            {service.alertLevel !== 'normal' && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                service.alertLevel === 'critical' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-600'
              )}>
                {service.alertLevel === 'critical' ? 'Crítico' : 'Alerta'}
              </span>
            )}
          </div>
          <DrawerTitle className="text-base">{service.nombre_cliente}</DrawerTitle>
          <DrawerDescription className="flex items-center gap-1.5 text-xs">
            {service.custodio_asignado ? (
              <>
                <User className="h-3 w-3" />
                {service.custodio_asignado}
              </>
            ) : (
              <span className="text-destructive font-medium">Sin custodio asignado</span>
            )}
            {service.tipo_servicio && (
              <>
                <span className="mx-1">·</span>
                <Shield className="h-3 w-3" />
                {service.tipo_servicio}
              </>
            )}
          </DrawerDescription>
        </DrawerHeader>

        {/* Native scroll — avoids vaul + Radix ScrollArea gesture conflicts */}
        <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(92vh - 120px)' }}>
          <div className="space-y-4">
            {/* Route Map with trail + current position */}
            <RouteMap service={service} events={sortedEvents} />

            {/* Route info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Navigation className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground uppercase">{service.origen || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">Origen</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground uppercase">{service.destino || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">Destino</p>
                </div>
              </div>
            </div>

            {/* Metrics pills */}
            <div className="grid grid-cols-2 gap-2">
              <InfoPill
                icon={Clock}
                label="Cita"
                value={service.fecha_hora_cita ? fmtCita(service.fecha_hora_cita) : '—'}
              />
              <InfoPill
                icon={AlertTriangle}
                label="Inactivo"
                value={`${service.minutesSinceLastAction}m`}
                accent={service.minutesSinceLastAction >= 45 ? 'text-destructive' : service.minutesSinceLastAction >= 30 ? 'text-amber-500' : undefined}
              />
              <InfoPill
                icon={CheckCircle2}
                label="Prom. TP"
                value={`${touchpointAnalytics.avgInterval}m`}
                accent={touchpointAnalytics.avgInterval > 30 ? 'text-amber-500' : 'text-emerald-500'}
              />
              <InfoPill
                icon={AlertTriangle}
                label="Max Gap"
                value={`${touchpointAnalytics.maxGap}m`}
                accent={touchpointAnalytics.maxGap > 45 ? 'text-destructive' : undefined}
              />
            </div>

            {/* Active event callout */}
            {service.activeEvent && (
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 px-3 py-2 flex items-center gap-2">
                <span className="text-lg">
                  {service.activeEvent.tipo === 'combustible' ? '⛽' :
                   service.activeEvent.tipo === 'descanso' ? '☕' :
                   service.activeEvent.tipo === 'pernocta' ? '🛏️' : '⚡'}
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Evento activo: {eventLabel(service.activeEvent.tipo)}</p>
                  <p className="text-[10px] text-muted-foreground">{service.activeEvent.minutosActivo} min activo</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Timeline ({touchpointAnalytics.totalEvents} eventos)
              </h4>
              {sortedEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sin eventos registrados</p>
              ) : (
                <div className="relative pl-5 space-y-0">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
                  {sortedEvents.map((evt, i) => (
                    <div key={evt.id} className="relative flex items-start gap-2 py-1.5">
                      {/* Dot */}
                      <div className="absolute left-[-13px] top-2 w-2.5 h-2.5 rounded-full bg-card border-2 border-border z-10 flex items-center justify-center">
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          !evt.hora_fin ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'
                        )} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {eventIcon(evt.tipo_evento)}
                          <span className="text-xs font-medium text-foreground">{eventLabel(evt.tipo_evento)}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">{fmt(evt.hora_inicio)}</span>
                        </div>
                        {evt.descripcion && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{evt.descripcion}</p>
                        )}
                        {evt.lat && evt.lng && (
                          <p className="text-[10px] text-muted-foreground/70 tabular-nums">{evt.lat.toFixed(4)}, {evt.lng.toFixed(4)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPS source note */}
            <p className="text-[9px] text-center text-muted-foreground/50 pb-2">
              Posición: {service.positionSource === 'gps' ? 'GPS real' : 'Geocodificada'} · ID: {service.id_servicio}
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
