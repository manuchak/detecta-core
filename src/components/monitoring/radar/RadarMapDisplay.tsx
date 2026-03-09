import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { initializeMapboxToken } from '@/lib/mapbox';
import { RadarService, RadarSafePoint, AlertLevel, ServicePhase } from '@/hooks/useServiciosTurnoLive';

interface RadarMapDisplayProps {
  servicios: RadarService[];
  safePoints: RadarSafePoint[];
  className?: string;
}

function getMarkerStyle(phase: ServicePhase, alertLevel: AlertLevel): { color: string; glow: string; pulse: boolean } {
  if (alertLevel === 'critical') return { color: '#ef4444', glow: '#ef4444', pulse: true };
  if (alertLevel === 'warning') return { color: '#f59e0b', glow: '#f59e0b', pulse: false };
  if (phase === 'evento_especial') return { color: '#a855f7', glow: '#a855f7', pulse: false };
  if (phase === 'en_destino') return { color: '#3b82f6', glow: '#3b82f6', pulse: false };
  if (phase === 'por_iniciar') return { color: '#6b7280', glow: 'transparent', pulse: false };
  return { color: '#22c55e', glow: '#22c55e', pulse: false };
}

const RadarMapDisplay = ({ servicios, safePoints, className }: RadarMapDisplayProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const serviceMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const safePointMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const currentZoomRef = useRef(5.2);
  const mapLoadedRef = useRef(false);

  // Initialize map once
  useEffect(() => {
    const init = async () => {
      if (!mapContainer.current) return;
      const token = await initializeMapboxToken();
      if (!token) return;

      mapboxgl.accessToken = token;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-99.1332, 19.4326],
        zoom: 5.2,
        interactive: false,
        attributionControl: false,
      });

      map.current.on('load', () => {
        mapLoadedRef.current = true;
        map.current?.resize();
      });

      map.current.on('zoom', () => {
        currentZoomRef.current = map.current?.getZoom() || 5.2;
        updateSafePointVisibility();
      });

      const observer = new ResizeObserver(() => { map.current?.resize(); });
      observer.observe(mapContainer.current);
      return () => { observer.disconnect(); };
    };
    init();
    return () => { map.current?.remove(); };
  }, []);

  // Update service markers
  useEffect(() => {
    if (!map.current) return;

    serviceMarkersRef.current.forEach(m => m.remove());
    serviceMarkersRef.current = [];

    const geoServicios = servicios.filter(s => s.lat && s.lng);
    geoServicios.forEach(s => {
      const style = getMarkerStyle(s.phase, s.alertLevel);
      const el = document.createElement('div');
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = style.color;
      el.style.border = '3px solid rgba(255,255,255,0.6)';
      el.style.boxShadow = `0 0 12px ${style.glow}`;
      if (style.pulse) {
        el.style.animation = 'pulse 1.5s ease-in-out infinite';
      }

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([s.lng!, s.lat!])
        .addTo(map.current!);
      serviceMarkersRef.current.push(marker);
    });

    // Fit bounds
    if (geoServicios.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      geoServicios.forEach(s => bounds.extend([s.lng!, s.lat!]));
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 8, duration: 1000 });
    }
  }, [servicios]);

  // Update safe point markers
  useEffect(() => {
    if (!map.current) return;

    safePointMarkersRef.current.forEach(m => m.remove());
    safePointMarkersRef.current = [];

    safePoints.forEach(sp => {
      if (!sp.lat || !sp.lng) return;

      const isAlert = sp.type === 'alerta';
      const el = document.createElement('div');

      if (isAlert) {
        el.style.width = '0';
        el.style.height = '0';
        el.style.borderLeft = '5px solid transparent';
        el.style.borderRight = '5px solid transparent';
        el.style.borderBottom = '10px solid rgba(239, 68, 68, 0.4)';
      } else {
        el.style.width = '8px';
        el.style.height = '8px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
      }
      el.style.display = 'none';

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([sp.lng, sp.lat])
        .addTo(map.current!);
      safePointMarkersRef.current.push(marker);
    });

    updateSafePointVisibility();
  }, [safePoints]);

  function updateSafePointVisibility() {
    const show = currentZoomRef.current >= 7;
    safePointMarkersRef.current.forEach(m => {
      const el = m.getElement();
      el.style.display = show ? 'block' : 'none';
    });
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-white/10 ${className || ''}`}>
      <div ref={mapContainer} className="w-full h-full" />
      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-xs text-gray-300">OK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
          <span className="text-xs text-gray-300">30m+</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-xs text-gray-300">45m+</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#a855f7' }} />
          <span className="text-xs text-gray-300">Evento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#6b7280' }} />
          <span className="text-xs text-gray-300">Espera</span>
        </div>
      </div>
    </div>
  );
};

export default RadarMapDisplay;
