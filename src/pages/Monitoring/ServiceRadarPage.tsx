import { useState, useEffect } from 'react';
import { useServiciosTurnoLive } from '@/hooks/useServiciosTurnoLive';
import RadarSummaryBar from '@/components/monitoring/radar/RadarSummaryBar';
import RadarServicesList from '@/components/monitoring/radar/RadarServicesList';
import RadarMapDisplay from '@/components/monitoring/radar/RadarMapDisplay';
import TVWeatherStrip from '@/components/monitoring/tv/TVWeatherStrip';
import TVAlertTicker from '@/components/monitoring/tv/TVAlertTicker';
import { Radar } from 'lucide-react';

const ServiceRadarPage = () => {
  const [clock, setClock] = useState(new Date());
  const { servicios, resumen, safePoints, isLoading } = useServiciosTurnoLive();

  // Override global zoom for fullscreen
  useEffect(() => {
    const html = document.documentElement;
    const original = html.style.zoom;
    html.style.zoom = '1';
    return () => { html.style.zoom = original; };
  }, []);

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dark h-screen w-screen overflow-hidden bg-gray-950 text-white p-2 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Radar className="h-5 w-5 text-emerald-400 animate-pulse" />
          <h1 className="text-xl font-bold tracking-tight">
            RADAR OPERATIVO
          </h1>
          {isLoading && (
            <span className="text-xs text-gray-600">Cargando...</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">
            Auto · 15s
          </span>
          <span className="text-3xl font-mono font-bold tabular-nums text-emerald-400">
            {clock.toLocaleTimeString('es-MX', { hour12: false })}
          </span>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="shrink-0">
        <RadarSummaryBar resumen={resumen} />
      </div>

      {/* Main content: Map + Services list */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
        <RadarMapDisplay
          servicios={servicios}
          safePoints={safePoints}
          className="col-span-7 h-full"
        />
        <div className="col-span-5 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <RadarServicesList servicios={servicios} />
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

export default ServiceRadarPage;
