import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useIncidentesRRSS, IncidenteRRSS } from '@/hooks/useIncidentesRRSS';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const severityOrder: Record<string, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baja: 3,
};

const severityColor: Record<string, string> = {
  critica: 'bg-red-500',
  alta: 'bg-red-500',
  media: 'bg-amber-500',
  baja: 'bg-green-500',
};

const severityLabel: Record<string, string> = {
  critica: 'CRÍTICA',
  alta: 'ALTA',
  media: 'MEDIA',
  baja: 'BAJA',
};

const ACTIONABLE_TYPES = new Set([
  'bloqueo_carretera',
  'robo_carga',
  'robo_unidad',
  'asalto_transporte',
  'secuestro_operador',
  'accidente_trailer',
]);

const ACTIVE_EVENT_KEYWORDS = /bloqueo|narcobloqueo|cierran|cortaron|saqueo|rapiña|balacera|enfrentamiento|persecucion|persecución|emboscada|desvio|desvío|cerrada|no pasar|precaucion|precaución/i;

const isActionable = (inc: IncidenteRRSS) => {
  if (ACTIONABLE_TYPES.has(inc.tipo_incidente || '')) return true;
  const text = `${inc.resumen_ai || ''} ${inc.texto_original || ''}`;
  return ACTIVE_EVENT_KEYWORDS.test(text);
};

const TVAlertTicker = () => {
  const { data: incidentes } = useIncidentesRRSS({ dias_atras: 1 });

  const sorted = useMemo(() => {
    if (!incidentes || incidentes.length === 0) return [];

    return incidentes
      .filter(isActionable)
      .sort((a, b) =>
        (severityOrder[a.severidad || 'baja'] ?? 3) - (severityOrder[b.severidad || 'baja'] ?? 3)
      )
      .slice(0, 20);
  }, [incidentes]);

  // All hooks must be before any early return
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(60);

  const recalcDuration = useCallback(() => {
    if (marqueeRef.current) {
      const contentWidth = marqueeRef.current.scrollWidth / 2;
      // ~60px/s is the broadcast-standard ticker speed (CNN, Bloomberg)
      const PIXELS_PER_SECOND = 60;
      setDuration(Math.max(30, contentWidth / PIXELS_PER_SECOND));
    }
  }, []);

  useEffect(() => {
    recalcDuration();
    window.addEventListener('resize', recalcDuration);
    return () => window.removeEventListener('resize', recalcDuration);
  }, [sorted, recalcDuration]);

  if (sorted.length === 0) {
    return (
      <div className="flex items-center gap-3 h-10 px-4 rounded-lg border border-white/10 bg-white/5">
        <span className="text-[10px] font-bold tracking-widest text-amber-400/60 uppercase shrink-0">
          ALERTAS CARRETERAS
        </span>
        <span className="text-gray-500 text-sm">Sin incidentes activos en corredores</span>
      </div>
    );
  }

  const items = [...sorted, ...sorted];

  return (
    <div className="relative flex items-center overflow-hidden rounded-lg border border-white/10 bg-white/5 h-10">
      {/* Fixed label */}
      <div className="shrink-0 flex items-center gap-2 px-3 border-r border-white/10 h-full bg-white/5 z-10">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase whitespace-nowrap">
          ALERTAS
        </span>
      </div>

      {/* Marquee */}
      <div className="absolute left-[120px] right-0 overflow-hidden h-full">
        <div
          ref={marqueeRef}
          className="absolute whitespace-nowrap flex items-center h-full"
          style={{ animation: `marquee ${duration}s linear infinite` }}
        >
          {items.map((inc, i) => {
            const sev = inc.severidad || 'baja';
            const timeAgo = formatDistanceToNow(new Date(inc.fecha_publicacion), {
              locale: es,
              addSuffix: false,
            });

            return (
              <span key={`${inc.id}-${i}`} className="inline-flex items-center gap-2 mx-6">
                <span className={`w-2 h-2 rounded-full shrink-0 ${severityColor[sev] || 'bg-gray-500'}`} />
                {(sev === 'critica' || sev === 'alta') && (
                  <span className={`text-[10px] font-bold tracking-wider ${sev === 'critica' ? 'text-red-400' : 'text-amber-400'}`}>
                    {severityLabel[sev]}
                  </span>
                )}
                <span className="text-base text-gray-200">
                  {inc.resumen_ai || inc.texto_original?.slice(0, 80)}
                </span>
                {(inc.estado || inc.carretera) && (
                  <span className="text-xs text-gray-500">
                    — {[inc.estado, inc.carretera].filter(Boolean).join(' · ')}
                  </span>
                )}
                <span className="text-[10px] text-gray-600">
                  hace {timeAgo}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TVAlertTicker;
