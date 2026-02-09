import { useState, useEffect } from 'react';
import { useServiciosTurno } from '@/hooks/useServiciosTurno';
import TVSummaryBar from '@/components/monitoring/tv/TVSummaryBar';
import TVServicesList from '@/components/monitoring/tv/TVServicesList';
import TVMapDisplay from '@/components/monitoring/tv/TVMapDisplay';
import TVWeatherStrip from '@/components/monitoring/tv/TVWeatherStrip';
import TVAlertTicker from '@/components/monitoring/tv/TVAlertTicker';
import { Radio } from 'lucide-react';

const MonitoringTVPage = () => {
  const [clock, setClock] = useState(new Date());
  const { data, dataUpdatedAt } = useServiciosTurno(12);

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const servicios = data?.servicios || [];
  const resumen = data?.resumen || {
    enSitio: 0, proximos: 0, asignados: 0, sinAsignar: 0, total: 0,
  };

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const secondsAgo = lastUpdate
    ? Math.round((Date.now() - lastUpdate.getTime()) / 1000)
    : null;

  return (
    <div className="dark h-screen w-screen overflow-hidden bg-gray-950 text-white p-2 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-emerald-400 animate-pulse" />
          <h1 className="text-xl font-bold tracking-tight">
            CONTROL DE POSICIONAMIENTO
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {secondsAgo !== null && (
            <span className="text-xs text-gray-500">
              Auto · {secondsAgo < 60 ? `${secondsAgo}s` : `${Math.floor(secondsAgo / 60)}m`}
            </span>
          )}
          <span className="text-3xl font-mono font-bold tabular-nums text-emerald-400">
            {clock.toLocaleTimeString('es-MX', { hour12: false })}
          </span>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="shrink-0">
        <TVSummaryBar resumen={resumen} />
      </div>

      {/* Main content: Map + Services list */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
        <TVMapDisplay servicios={servicios} className="col-span-8 h-full" />
        <div className="col-span-4 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <TVServicesList servicios={servicios} />
        </div>
      </div>

      {/* Bottom bar: Weather + Alert Ticker */}
      <div className="shrink-0 grid grid-cols-12 gap-3">
        <div className="col-span-5">
          <TVWeatherStrip />
        </div>
        <div className="col-span-7">
          <TVAlertTicker />
        </div>
      </div>
    </div>
  );
};

export default MonitoringTVPage;
