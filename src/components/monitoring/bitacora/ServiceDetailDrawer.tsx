import React, { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Shield, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useServicioDetalle } from '@/hooks/useServicioDetalle';
import { EVENTO_ICONS, type EventoRuta } from '@/hooks/useEventosRuta';
import type { BoardService } from '@/hooks/useBitacoraBoard';
import { cn } from '@/lib/utils';

interface ServiceDetailDrawerProps {
  service: BoardService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getEventsForService: (idServicio: string) => EventoRuta[];
}

const TIPO_LABELS: Record<string, { label: string; class: string }> = {
  custodia: { label: 'Custodia', class: 'bg-chart-1/15 text-chart-1 border-chart-1/30' },
  monitoreo: { label: 'Monitoreo', class: 'bg-chart-3/15 text-chart-3 border-chart-3/30' },
  transporte: { label: 'Transporte', class: 'bg-chart-4/15 text-chart-4 border-chart-4/30' },
};

const PHASE_LABELS: Record<string, { label: string; class: string }> = {
  por_iniciar: { label: 'Por Iniciar', class: 'bg-muted text-muted-foreground' },
  en_curso: { label: 'En Curso', class: 'bg-chart-2/15 text-chart-2' },
  en_destino: { label: 'En Destino', class: 'bg-chart-2/20 text-chart-2' },
  evento_especial: { label: 'Evento Especial', class: 'bg-chart-4/15 text-chart-4' },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${m}m`;
}

export const ServiceDetailDrawer: React.FC<ServiceDetailDrawerProps> = ({
  service, open, onOpenChange, getEventsForService,
}) => {
  const navigate = useNavigate();
  const { data: detalle } = useServicioDetalle(service?.id || null);

  const events = useMemo(() => {
    if (!service) return [];
    return [...getEventsForService(service.id_servicio)].sort(
      (a, b) => new Date(a.hora_inicio).getTime() - new Date(b.hora_inicio).getTime()
    );
  }, [service, getEventsForService]);

  // Touchpoint analytics
  const touchpointStats = useMemo(() => {
    if (events.length < 2) return null;
    const timestamps = events.map(e => new Date(e.hora_inicio).getTime());
    const gaps: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      gaps.push((timestamps[i] - timestamps[i - 1]) / 60_000);
    }
    const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    const largeGaps = gaps.filter(g => g > 45).length;
    const maxGap = Math.round(Math.max(...gaps));
    return { avg, largeGaps, maxGap, total: events.length };
  }, [events]);

  // Anomalies
  const anomalies = useMemo(() => {
    const list: string[] = [];
    if (!service) return list;

    // Delta origen > 30m
    if (service.hora_inicio_real && service.fecha_hora_cita) {
      const delta = (new Date(service.hora_inicio_real).getTime() - new Date(service.fecha_hora_cita).getTime()) / 60_000;
      if (Math.abs(delta) > 30) {
        list.push(`ΔOrigen: ${delta > 0 ? '+' : ''}${Math.round(delta)}m vs cita`);
      }
    }

    // Long special events (>30m)
    events.forEach(e => {
      if (e.duracion_segundos && e.duracion_segundos > 1800 && !['inicio_servicio', 'fin_servicio', 'checkpoint', 'llegada_destino', 'liberacion_custodio'].includes(e.tipo_evento)) {
        const meta = EVENTO_ICONS[e.tipo_evento] || EVENTO_ICONS.otro;
        list.push(`${meta.label}: ${formatDuration(e.duracion_segundos)} (> 30m)`);
      }
    });

    // Activity gap > 45m
    if (touchpointStats && touchpointStats.largeGaps > 0) {
      list.push(`${touchpointStats.largeGaps} gap(s) sin actividad > 45m (máx ${touchpointStats.maxGap}m)`);
    }

    return list;
  }, [service, events, touchpointStats]);

  if (!service) return null;

  const tipoMeta = TIPO_LABELS[(service.tipo_servicio || '').toLowerCase()] || TIPO_LABELS.custodia;
  const phaseMeta = PHASE_LABELS[service.phase] || PHASE_LABELS.en_curso;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:max-w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-sm font-mono">{service.id_servicio}</SheetTitle>
            <Badge variant="outline" className={cn('text-[10px] px-2 py-0', tipoMeta.class)}>
              {tipoMeta.label}
            </Badge>
          </div>
          <Badge className={cn('w-fit text-[10px] px-2 py-0.5', phaseMeta.class)}>
            {phaseMeta.label}
          </Badge>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-5 pb-5 space-y-4">
            {/* Service Info */}
            <div className="space-y-2">
              <div className="text-sm font-medium">{service.nombre_cliente}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {service.origen} <ArrowRight className="h-3 w-3 shrink-0" /> {service.destino}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Cita: </span>
                  <span className="font-mono">{formatTime(service.fecha_hora_cita)}</span>
                </div>
                {service.hora_inicio_real && (
                  <div>
                    <span className="text-muted-foreground">Inicio: </span>
                    <span className="font-mono">{formatTime(service.hora_inicio_real)}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Personnel */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Personal</h4>
              <div className="flex items-center justify-between">
                <span className="text-xs">{service.custodio_asignado || 'Sin custodio'}</span>
                {service.custodio_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] px-1.5 gap-0.5"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/perfiles-operativos?custodio=${service.custodio_id}`);
                    }}
                  >
                    Ver perfil <ExternalLink className="h-2.5 w-2.5" />
                  </Button>
                )}
              </div>
              {(detalle?.requiere_armado || service.requiere_armado) && (
                <div className="flex items-center gap-1 text-xs">
                  <Shield className="h-3 w-3 text-chart-4" />
                  <span>{detalle?.armado_asignado || 'Armado requerido'}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Timeline */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Timeline</h4>
              {events.length === 0 ? (
                <div className="text-xs text-muted-foreground/50 py-3 text-center">Sin eventos registrados</div>
              ) : (
                <div className="space-y-0">
                  {events.map((evt, i) => {
                    const meta = EVENTO_ICONS[evt.tipo_evento] || EVENTO_ICONS.otro;
                    return (
                      <div key={evt.id} className="flex items-start gap-2 py-1.5 relative">
                        {/* Connector line */}
                        {i < events.length - 1 && (
                          <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
                        )}
                        <span className="text-sm leading-none mt-0.5 relative z-10">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="text-xs font-medium">{meta.label}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {formatTime(evt.hora_inicio)}
                            </span>
                          </div>
                          {evt.descripcion && (
                            <div className="text-[10px] text-muted-foreground truncate">{evt.descripcion}</div>
                          )}
                          {evt.duracion_segundos != null && (
                            <div className="text-[10px] text-muted-foreground/70">
                              Duración: {formatDuration(evt.duracion_segundos)}
                            </div>
                          )}
                          {evt.ubicacion_texto && (
                            <div className="text-[10px] text-muted-foreground/60 truncate">
                              📍 {evt.ubicacion_texto}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Touchpoints */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Touchpoints</h4>
              {touchpointStats ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/30 rounded-md p-2 text-center">
                    <div className="text-lg font-mono leading-none">{touchpointStats.avg}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">min prom.</div>
                  </div>
                  <div className="bg-muted/30 rounded-md p-2 text-center">
                    <div className="text-lg font-mono leading-none">{touchpointStats.total}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">eventos</div>
                  </div>
                  <div className={cn(
                    'rounded-md p-2 text-center',
                    touchpointStats.largeGaps > 0 ? 'bg-chart-4/10' : 'bg-muted/30'
                  )}>
                    <div className={cn(
                      'text-lg font-mono leading-none',
                      touchpointStats.largeGaps > 0 ? 'text-chart-4' : ''
                    )}>
                      {touchpointStats.largeGaps}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">gaps &gt;45m</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground/50 text-center py-2">Insuficientes eventos para análisis</div>
              )}
            </div>

            {/* Anomalies */}
            {anomalies.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-chart-4" />
                    Anomalías
                  </h4>
                  <div className="space-y-1">
                    {anomalies.map((a, i) => (
                      <div key={i} className="text-xs bg-chart-4/10 text-chart-4 rounded px-2 py-1">
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Navigation Links */}
            <div className="space-y-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5 justify-start"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/monitoring?tab=tiempos&search=${encodeURIComponent(service.nombre_cliente)}`);
                }}
              >
                <Clock className="h-3.5 w-3.5" />
                Ver historial del cliente
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5 justify-start"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/monitoring?tab=tiempos&search=${encodeURIComponent(service.id_servicio)}`);
                }}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Ver detalle completo
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
