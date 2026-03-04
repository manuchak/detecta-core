import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  type TipoEventoRuta,
  EVENTO_ICONS,
  useEventosRuta,
} from '@/hooks/useEventosRuta';

interface Props {
  servicioId: string | null;
  compact?: boolean;
  maxVisible?: number;
}

const formatDuration = (s: number) => {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};

export const EventTimeline: React.FC<Props> = ({ servicioId, compact = false, maxVisible = 3 }) => {
  const { eventos, isLoading, deleteEvent } = useEventosRuta(servicioId);
  const [expanded, setExpanded] = useState(false);

  if (!servicioId) return null;

  if (isLoading) {
    return <p className="text-xs text-muted-foreground text-center py-2">Cargando...</p>;
  }

  if (eventos.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3 italic">
        Sin eventos registrados
      </p>
    );
  }

  // Most recent first for display
  const reversed = [...eventos].reverse();
  const visibleEvents = compact && !expanded ? reversed.slice(0, maxVisible) : reversed;
  const hasMore = compact && reversed.length > maxVisible;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">
          Últimos eventos
        </span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {eventos.length}
        </Badge>
      </div>

      <div className={cn_compact(compact && !expanded)}>
        {visibleEvents.map(evento => {
          const info = EVENTO_ICONS[evento.tipo_evento as TipoEventoRuta] || EVENTO_ICONS.otro;
          const isActive = !evento.hora_fin;

          return (
            <div
              key={evento.id}
              className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors group"
            >
              <span className="text-sm shrink-0 mt-0.5">{info.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{info.label}</span>
                  {isActive && (
                    <Badge variant="default" className="text-[8px] px-1 py-0 h-3.5 animate-pulse">
                      ACTIVO
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
                    {format(new Date(evento.hora_inicio), 'HH:mm', { locale: es })}
                    {evento.duracion_segundos != null && (
                      <span className="ml-1 text-foreground font-medium">
                        ({formatDuration(evento.duracion_segundos)})
                      </span>
                    )}
                  </span>
                </div>
                {evento.descripcion && (
                  <p className="text-[10px] text-muted-foreground truncate">{evento.descripcion}</p>
                )}
                {/* Photo thumbnails */}
                {evento.foto_urls.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {evento.foto_urls.map((url, j) => (
                      <a key={j} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Foto ${j + 1}`}
                          className="h-8 w-8 rounded object-cover border hover:opacity-80 transition-opacity"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </a>
                    ))}
                  </div>
                )}
                {evento.ubicacion_texto && (
                  <p className="text-[9px] text-primary/80 italic">📍 {evento.ubicacion_texto}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={() => deleteEvent.mutate(evento.id)}
              >
                <Trash2 className="h-2.5 w-2.5 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Expand/collapse */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs h-7 gap-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Ver todos ({eventos.length} eventos)
            </>
          )}
        </Button>
      )}
    </div>
  );
};

function cn_compact(isCompact: boolean) {
  return isCompact ? 'space-y-0.5' : 'space-y-0.5 max-h-[300px] overflow-y-auto';
}
