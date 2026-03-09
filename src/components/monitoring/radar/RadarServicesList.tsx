import { useEffect, useRef, useMemo } from 'react';
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

const GROUPS: GroupDef[] = [
  {
    key: 'alerta',
    label: '⚠ ALERTA',
    color: 'hsl(0, 84%, 60%)',
    filter: s => s.alertLevel === 'critical' || s.alertLevel === 'warning',
    sort: (a, b) => b.minutesSinceLastAction - a.minutesSinceLastAction,
  },
  {
    key: 'evento',
    label: 'EN EVENTO',
    color: 'hsl(271, 91%, 65%)',
    filter: s => s.phase === 'evento_especial' && s.alertLevel === 'normal',
    sort: (a, b) => (b.activeEvent?.minutosActivo || 0) - (a.activeEvent?.minutosActivo || 0),
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

const RadarServicesList = ({ servicios }: RadarServicesListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll (only for the non-alert zone)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animFrame: number;
    const speed = 0.5;
    const step = () => {
      if (!el) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        el.scrollTop = 0;
      } else {
        el.scrollTop += speed;
      }
      animFrame = requestAnimationFrame(step);
    };
    const timer = setTimeout(() => {
      if (el.scrollHeight > el.clientHeight + 20) {
        animFrame = requestAnimationFrame(step);
      }
    }, 3000);
    return () => { clearTimeout(timer); cancelAnimationFrame(animFrame); };
  }, [servicios]);

  const groupedData = useMemo(() => {
    return GROUPS.map(g => ({
      ...g,
      items: servicios.filter(g.filter).sort(g.sort),
    })).filter(g => g.items.length > 0);
  }, [servicios]);

  const alertGroup = useMemo(() => groupedData.filter(g => g.key === 'alerta'), [groupedData]);
  const restGroups = useMemo(() => groupedData.filter(g => g.key !== 'alerta'), [groupedData]);
  const hasAlerts = alertGroup.length > 0 && alertGroup[0].items.length > 0;

  if (servicios.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-lg">
        Sin servicios activos
      </div>
    );
  }

  const renderServiceItem = (s: RadarService, compact = false) => (
    <div key={s.id} className="flex border-b border-white/5">
      <div
        className="w-1 shrink-0 rounded-full my-1"
        style={{ backgroundColor: getBarColor(s) }}
      />
      <div className={`flex-1 pl-3 min-w-0 ${compact ? 'py-2' : 'py-3'}`}>
        <div className="flex items-center gap-3">
          <span className={`text-white font-semibold truncate ${compact ? 'text-base' : 'text-lg'}`}>
            {s.nombre_cliente}
          </span>
        </div>
        <div className={`text-gray-500 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
          {s.origen} → {s.destino}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`text-gray-400 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
            {s.custodio_asignado || 'Sin custodio'}
          </span>
          {s.phase !== 'por_iniciar' && (
            <span
              className={`font-mono font-bold tabular-nums shrink-0 ${compact ? 'text-xs' : 'text-sm'}`}
              style={{ color: getBarColor(s) }}
            >
              ⏱ {formatTimer(s.minutesSinceLastAction)}
            </span>
          )}
          {s.activeEvent && (
            <span className={`shrink-0 ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'hsl(271, 91%, 65%)' }}>
              {EVENTO_ICONS[s.activeEvent.tipo as TipoEventoRuta]?.icon || '📍'}{' '}
              {EVENTO_ICONS[s.activeEvent.tipo as TipoEventoRuta]?.label || s.activeEvent.tipo}{' '}
              · {s.activeEvent.minutosActivo}m
            </span>
          )}
          {s.phase === 'por_iniciar' && s.fecha_hora_cita && (
            <span className={`font-mono text-blue-400 shrink-0 ${compact ? 'text-xs' : 'text-sm'}`}>
              {new Date(s.fecha_hora_cita).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderGroupHeader = (group: typeof groupedData[0]) => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.07]">
      <div className="h-px flex-1 bg-white/20" />
      <span
        className="text-sm font-bold tracking-wider shrink-0"
        style={{ color: group.color }}
      >
        {group.label} ({group.items.length})
      </span>
      <div className="h-px flex-1 bg-white/20" />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="text-base font-semibold tracking-widest text-gray-500 uppercase px-3 py-2 border-b border-white/10 shrink-0">
        SERVICIOS ({servicios.length})
      </div>

      {/* Fixed alert zone — always visible, never auto-scrolled */}
      {hasAlerts && (
        <div className="shrink-0 max-h-[45%] overflow-y-auto bg-red-950/20 border-b-2 border-red-500/40">
          {alertGroup.map(group => (
            <div key={group.key}>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/40 animate-pulse">
                <div className="h-px flex-1 bg-red-500/30" />
                <span className="text-sm font-bold tracking-wider shrink-0 text-red-400">
                  {group.label} ({group.items.length})
                </span>
                <div className="h-px flex-1 bg-red-500/30" />
              </div>
              <div className="grid grid-cols-2 gap-px bg-white/5">
                {group.items.map(s => (
                  <div key={s.id} className="bg-gray-950">
                    {renderServiceItem(s, true)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable zone — auto-scroll for remaining groups */}
      <div ref={scrollRef} className="flex-1 overflow-hidden min-h-0">
        {restGroups.map(group => (
          <div key={group.key}>
            {renderGroupHeader(group)}
            {group.items.map(s => renderServiceItem(s))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadarServicesList;
