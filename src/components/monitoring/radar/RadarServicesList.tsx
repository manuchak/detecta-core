import { useEffect, useRef, useMemo, useCallback } from 'react';
import { RadarService } from '@/hooks/useServiciosTurnoLive';
import { EVENTO_ICONS, TipoEventoRuta } from '@/hooks/useEventosRuta';

interface RadarServicesListProps {
  servicios: RadarService[];
}

const ALERT_COLORS: Record<string, string> = {
  critical: 'hsl(0, 84%, 60%)',
  warning: 'hsl(38, 92%, 50%)',
  normal: 'hsl(142, 76%, 36%)',
};

const PHASE_COLORS: Record<string, string> = {
  evento_especial: 'hsl(271, 91%, 65%)',
  en_destino: 'hsl(217, 91%, 60%)',
  por_iniciar: 'hsl(217, 91%, 60%)',
  en_curso: 'hsl(142, 76%, 36%)',
};

interface GroupDef {
  key: string;
  label: string;
  color: string;
  filter: (s: RadarService) => boolean;
  sort: (a: RadarService, b: RadarService) => number;
}

// Order: Alerta → En Ruta → Por Iniciar → En Evento
const GROUPS: GroupDef[] = [
  {
    key: 'alerta',
    label: '⚠ ALERTA',
    color: 'hsl(0, 84%, 60%)',
    filter: s => s.alertLevel === 'critical' || s.alertLevel === 'warning',
    sort: (a, b) => b.minutesSinceLastAction - a.minutesSinceLastAction,
  },
  {
    key: 'enruta',
    label: 'EN RUTA',
    color: 'hsl(142, 76%, 36%)',
    filter: s => (s.phase === 'en_curso' || s.phase === 'en_destino') && s.alertLevel === 'normal',
    sort: (a, b) => b.minutesSinceLastAction - a.minutesSinceLastAction,
  },
  {
    key: 'porIniciar',
    label: 'POR INICIAR',
    color: 'hsl(217, 91%, 60%)',
    filter: s => s.phase === 'por_iniciar',
    sort: (a, b) => new Date(a.fecha_hora_cita).getTime() - new Date(b.fecha_hora_cita).getTime(),
  },
  {
    key: 'evento',
    label: 'EN EVENTO',
    color: 'hsl(271, 91%, 65%)',
    filter: s => s.phase === 'evento_especial' && s.alertLevel === 'normal',
    sort: (a, b) => (b.activeEvent?.minutosActivo || 0) - (a.activeEvent?.minutosActivo || 0),
  },
];

function getBarColor(s: RadarService): string {
  if (s.alertLevel !== 'normal') return ALERT_COLORS[s.alertLevel];
  return PHASE_COLORS[s.phase] || PHASE_COLORS.en_curso;
}

function formatTimer(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}

/** Auto-scroll hook for a single block — stable across data refreshes */
function useBlockAutoScroll(items: RadarService[]) {
  const ref = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);

  const startScroll = useCallback(() => {
    const el = ref.current;
    if (!el || isRunningRef.current) return;
    if (el.scrollHeight <= el.clientHeight + 10) return;
    isRunningRef.current = true;
    const speed = 0.4;
    const step = () => {
      if (isPausedRef.current) {
        animFrameRef.current = requestAnimationFrame(step);
        return;
      }
      if (!ref.current) return;
      if (ref.current.scrollTop + ref.current.clientHeight >= ref.current.scrollHeight - 2) {
        ref.current.scrollTop = 0;
      } else {
        ref.current.scrollTop += speed;
      }
      animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Start once after mount, never restart on data changes
  useEffect(() => {
    const timer = setTimeout(() => startScroll(), 3000);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrameRef.current);
      isRunningRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If content grows and scroll wasn't needed before, start it
  useEffect(() => {
    if (!isRunningRef.current) {
      const el = ref.current;
      if (el && el.scrollHeight > el.clientHeight + 10) {
        startScroll();
      }
    }
  }, [items.length, startScroll]);

  const onMouseEnter = useCallback(() => { isPausedRef.current = true; }, []);
  const onMouseLeave = useCallback(() => { isPausedRef.current = false; }, []);

  return { ref, onMouseEnter, onMouseLeave };
}

/** A single equitable block with its own scroll */
const ServiceBlock = ({ group, items }: { group: GroupDef; items: RadarService[] }) => {
  const { ref: scrollRef, onMouseEnter, onMouseLeave } = useBlockAutoScroll(items);
  const isAlert = group.key === 'alerta';

  return (
    <div className={`h-1/4 flex flex-col min-h-0 border-b border-white/10 last:border-b-0 ${isAlert && items.length > 0 ? 'bg-red-950/20' : ''}`}>
      {/* Group header */}
      <div className={`flex items-center gap-2 px-3 py-1 shrink-0 ${isAlert && items.length > 0 ? 'bg-red-950/40' : 'bg-white/[0.07]'}`}>
        <div className="h-px flex-1 bg-white/20" />
        <span
          className={`text-xs font-bold tracking-wider shrink-0 ${isAlert && items.length > 0 ? 'animate-pulse' : ''}`}
          style={{ color: group.color }}
        >
          {group.label} ({items.length})
        </span>
        <div className="h-px flex-1 bg-white/20" />
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className="flex-1 overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-xs">
            Sin servicios
          </div>
        ) : (
          items.map(s => (
            <div key={s.id} className="flex border-b border-white/5">
              <div
                className="w-1 shrink-0 rounded-full my-1"
                style={{ backgroundColor: getBarColor(s) }}
              />
              <div className="flex-1 pl-3 min-w-0 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold truncate text-base">
                    {s.nombre_cliente}
                  </span>
                </div>
                <div className="text-gray-500 truncate text-xs">
                  {s.origen} → {s.destino}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-gray-400 truncate text-xs">
                    {s.custodio_asignado || 'Sin custodio'}
                  </span>
                  {s.phase !== 'por_iniciar' && (
                    <span
                      className="font-mono font-bold tabular-nums shrink-0 text-xs"
                      style={{ color: getBarColor(s) }}
                    >
                      ⏱ {formatTimer(s.minutesSinceLastAction)}
                    </span>
                  )}
                  {s.activeEvent && (
                    <span className="shrink-0 text-xs" style={{ color: 'hsl(271, 91%, 65%)' }}>
                      {EVENTO_ICONS[s.activeEvent.tipo as TipoEventoRuta]?.icon || '📍'}{' '}
                      {EVENTO_ICONS[s.activeEvent.tipo as TipoEventoRuta]?.label || s.activeEvent.tipo}{' '}
                      · {s.activeEvent.minutosActivo}m
                    </span>
                  )}
                  {s.phase === 'por_iniciar' && s.fecha_hora_cita && (
                    <span className="font-mono text-blue-400 shrink-0 text-xs">
                      {new Date(s.fecha_hora_cita).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const RadarServicesList = ({ servicios }: RadarServicesListProps) => {
  const groupedData = useMemo(() => {
    return GROUPS.map(g => ({
      ...g,
      items: servicios.filter(g.filter).sort(g.sort),
    }));
  }, [servicios]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="text-base font-semibold tracking-widest text-gray-500 uppercase px-3 py-2 border-b border-white/10 shrink-0">
        SERVICIOS ({servicios.length})
      </div>

      {/* 4 equitable blocks */}
      <div className="flex-1 flex flex-col min-h-0">
        {groupedData.map(group => (
          <ServiceBlock key={group.key} group={group} items={group.items} />
        ))}
      </div>
    </div>
  );
};

export default RadarServicesList;
