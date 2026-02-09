import { useIncidentesRRSS } from '@/hooks/useIncidentesRRSS';

const severityColor: Record<string, string> = {
  alta: 'bg-red-500',
  media: 'bg-amber-500',
  baja: 'bg-green-500',
};

const TVAlertTicker = () => {
  const { data: incidentes } = useIncidentesRRSS({ dias_atras: 1 });

  if (!incidentes || incidentes.length === 0) {
    return (
      <div className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-500 text-sm">
        Sin alertas de ruta recientes
      </div>
    );
  }

  // Duplicate items for seamless loop
  const items = [...incidentes.slice(0, 20), ...incidentes.slice(0, 20)];

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 h-9">
      <div className="absolute whitespace-nowrap flex items-center h-full animate-marquee">
        {items.map((inc, i) => (
          <span key={`${inc.id}-${i}`} className="inline-flex items-center gap-2 mx-6">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                severityColor[inc.severidad || 'baja'] || 'bg-gray-500'
              }`}
            />
            <span className="text-sm text-gray-300">
              {inc.resumen_ai || inc.texto_original?.slice(0, 80)}
            </span>
            {inc.carretera && (
              <span className="text-xs text-gray-500">— {inc.carretera}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TVAlertTicker;
