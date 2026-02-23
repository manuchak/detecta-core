import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { initializeMapboxToken } from '@/lib/mapbox';
import { IncidenteRRSS } from '@/hooks/useIncidentesRRSS';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Loader2 } from 'lucide-react';

interface IncidentesMapProps {
  incidentes: IncidenteRRSS[];
}

const SEVERIDAD_COLORS: Record<string, string> = {
  critica: '#ef4444',
  alta: '#f97316',
  media: '#eab308',
  baja: '#22c55e',
};

const TIPO_LABELS: Record<string, string> = {
  robo_carga: 'Robo de Carga',
  robo_unidad: 'Robo de Unidad',
  robo_combustible: 'Robo Combustible',
  asalto_transporte: 'Asalto',
  bloqueo_carretera: 'Bloqueo',
  accidente_trailer: 'Accidente',
  secuestro_operador: 'Secuestro',
  extorsion: 'Extorsión',
  sin_clasificar: 'Sin clasificar',
};

export function IncidentesMap({ incidentes }: IncidentesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const geocodificados = incidentes.filter(i => i.coordenadas_lat && i.coordenadas_lng);

  useEffect(() => {
    if (!mapContainer.current) return;

    let cancelled = false;

    const init = async () => {
      const token = await initializeMapboxToken();
      if (cancelled) return;

      if (!token) {
        setError('Token de Mapbox no disponible');
        setLoading(false);
        return;
      }

      mapboxgl.accessToken = token;

      if (mapRef.current) {
        mapRef.current.remove();
      }

      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-99.13, 19.43],
        zoom: 5,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        if (cancelled) return;
        mapRef.current = map;
        setLoading(false);
        updateMarkers(map);

        // Staggered resize to compensate for CSS zoom override
        [100, 300, 1000].forEach(ms =>
          setTimeout(() => { if (!cancelled && mapRef.current) mapRef.current.resize(); }, ms)
        );
      });

      // ResizeObserver for continuous correctness
      if (mapContainer.current) {
        const ro = new ResizeObserver(() => {
          mapRef.current?.resize();
        });
        ro.observe(mapContainer.current);
        resizeObserverRef.current = ro;
      }
    };

    init();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when incidentes change
  useEffect(() => {
    if (mapRef.current) {
      updateMarkers(mapRef.current);
    }
  }, [incidentes]);

  function updateMarkers(map: mapboxgl.Map) {
    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const geoIncidentes = incidentes.filter(i => i.coordenadas_lat && i.coordenadas_lng);

    geoIncidentes.forEach(inc => {
      const color = SEVERIDAD_COLORS[inc.severidad || 'baja'] || '#6b7280';
      const tipo = TIPO_LABELS[inc.tipo_incidente] || inc.tipo_incidente;

      const el = document.createElement('div');
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid white';
      el.style.boxShadow = `0 0 6px ${color}`;
      el.style.cursor = 'pointer';

      const popupHtml = `
        <div style="max-width:260px;font-family:system-ui;font-size:12px;">
          <div style="font-weight:700;margin-bottom:4px;">${tipo}</div>
          <div style="color:#888;margin-bottom:4px;">${inc.municipio || ''} ${inc.estado || ''}</div>
          ${inc.resumen_ai ? `<div style="margin-bottom:4px;">${inc.resumen_ai.substring(0, 200)}${inc.resumen_ai.length > 200 ? '...' : ''}</div>` : ''}
          ${inc.carretera ? `<div style="color:#aaa;font-size:11px;">🛣 ${inc.carretera}</div>` : ''}
          <div style="color:#aaa;font-size:11px;margin-top:2px;">Severidad: ${inc.severidad || 'N/A'}</div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 15, maxWidth: '280px' }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([inc.coordenadas_lng!, inc.coordenadas_lat!])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Fit bounds
    if (geoIncidentes.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      geoIncidentes.forEach(i => bounds.extend([i.coordenadas_lng!, i.coordenadas_lat!]));
      map.fitBounds(bounds, { padding: 50, maxZoom: 10, duration: 800 });
    } else if (geoIncidentes.length === 1) {
      map.flyTo({
        center: [geoIncidentes[0].coordenadas_lng!, geoIncidentes[0].coordenadas_lat!],
        zoom: 9,
        duration: 800,
      });
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Map className="h-4 w-4" />
          Mapa de Incidentes
          {geocodificados.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              ({geocodificados.length} geocodificados)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative" style={{ height: '400px', zoom: 1 }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-b-lg">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-b-lg">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full rounded-b-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
