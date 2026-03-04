import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  type EventoRuta,
  type TipoEventoRuta,
  EVENTO_ICONS,
  useEventosRuta,
} from '@/hooks/useEventosRuta';

interface Props {
  servicioId: string | null;
}

const formatDuration = (s: number) => {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};

export const EventTimeline: React.FC<Props> = ({ servicioId }) => {
  const { eventos, isLoading, deleteEvent } = useEventosRuta(servicioId);

  if (!servicioId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Selecciona un servicio para ver la cronología
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-lg">📋</span> Cronología
          </span>
          <Badge variant="secondary" className="text-xs">
            {eventos.length} eventos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full px-4 pb-4">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-4">Cargando...</p>
          ) : eventos.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 italic">
              Sin eventos registrados
            </p>
          ) : (
            <div className="relative pl-6 space-y-1">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

              {eventos.map((evento, i) => {
                const info = EVENTO_ICONS[evento.tipo_evento as TipoEventoRuta] || EVENTO_ICONS.otro;
                const isActive = !evento.hora_fin;

                return (
                  <div key={evento.id} className="relative pb-3">
                    {/* Dot */}
                    <div className={`absolute -left-6 top-1.5 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-xs bg-background ${isActive ? 'border-primary animate-pulse' : 'border-muted-foreground/30'}`}>
                      <span className="text-[11px]">{info.icon}</span>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-2.5 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold">{info.label}</span>
                            {isActive && (
                              <Badge variant="default" className="text-[9px] px-1 py-0 h-4 animate-pulse">
                                EN CURSO
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(evento.hora_inicio), 'HH:mm:ss', { locale: es })}
                            {evento.hora_fin && (
                              <> → {format(new Date(evento.hora_fin), 'HH:mm:ss', { locale: es })}</>
                            )}
                            {evento.duracion_segundos != null && (
                              <span className="ml-1 font-medium text-foreground">
                                ({formatDuration(evento.duracion_segundos)})
                              </span>
                            )}
                          </p>
                          {evento.descripcion && (
                            <p className="text-xs text-muted-foreground mt-1">{evento.descripcion}</p>
                          )}
                          {evento.ubicacion_texto && (
                            <p className="text-[10px] text-primary/80 italic mt-0.5">📍 {evento.ubicacion_texto}</p>
                          )}
                          {evento.lat && evento.lng && !evento.ubicacion_texto && (
                            <p className="text-[10px] text-primary/80 italic mt-0.5">
                              📍 {evento.lat.toFixed(5)}, {evento.lng.toFixed(5)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteEvent.mutate(evento.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>

                      {/* Photos */}
                      {evento.foto_urls.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {evento.foto_urls.map((url, j) => (
                            <a key={j} href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt={`Evidencia ${j + 1}`}
                                className="h-16 w-16 rounded object-cover border hover:opacity-80 transition-opacity"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
