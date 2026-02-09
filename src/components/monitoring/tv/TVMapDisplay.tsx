import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { initializeMapboxToken } from '@/lib/mapbox';
import { ServicioTurno, COLORES_ESTADO } from '@/hooks/useServiciosTurno';

interface TVMapDisplayProps {
  servicios: ServicioTurno[];
  className?: string;
}

const TVMapDisplay = ({ servicios, className }: TVMapDisplayProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

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
        interactive: false, // No interaction for TV
        attributionControl: false,
      });
    };
    init();
    return () => { map.current?.remove(); };
  }, []);

  // Update markers when servicios change
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const geoServicios = servicios.filter(s => s.lat && s.lng);
    geoServicios.forEach(s => {
      const color = COLORES_ESTADO[s.estadoVisual];
      const el = document.createElement('div');
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color.primary;
      el.style.border = '3px solid rgba(255,255,255,0.6)';
      el.style.boxShadow = `0 0 12px ${color.primary}`;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([s.lng!, s.lat!])
        .addTo(map.current!);
      markersRef.current.push(marker);
    });

    // Fit bounds if markers exist
    if (geoServicios.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      geoServicios.forEach(s => bounds.extend([s.lng!, s.lat!]));
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 8, duration: 1000 });
    }
  }, [servicios]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-white/10 ${className || ''}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 flex gap-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
        {Object.entries(COLORES_ESTADO).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: val.primary }} />
            <span className="text-xs text-gray-300">{val.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TVMapDisplay;
