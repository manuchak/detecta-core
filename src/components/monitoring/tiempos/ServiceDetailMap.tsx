import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route, Loader2 } from 'lucide-react';
import { initializeMapboxToken } from '@/lib/mapbox';
import { useBitacoraTraza, type EventoRuta, type TipoEventoRuta, EVENTO_ICONS } from '@/hooks/useEventosRuta';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  eventos: EventoRuta[];
}

const MARKER_COLORS: Partial<Record<TipoEventoRuta, string>> = {
  inicio_servicio: '#22c55e',
  llegada_destino: '#ef4444',
  checkpoint: '#3b82f6',
  combustible: '#f59e0b',
  baño: '#f59e0b',
  descanso: '#f59e0b',
  pernocta: '#f59e0b',
  incidencia: '#ef4444',
  liberacion_custodio: '#8b5cf6',
};

export const ServiceDetailMap: React.FC<Props> = ({ eventos }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const { generateTraza, traza, isCalculating } = useBitacoraTraza();

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const init = async () => {
      const token = await initializeMapboxToken();
      if (!token || !mapContainer.current) return;
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-99.13, 19.43],
        zoom: 5,
      });
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.on('load', () => setMapReady(true));
      mapRef.current = map;
    };
    init();
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Markers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const points = eventos.filter(e => e.lat && e.lng);
    if (points.length === 0) return;

    points.forEach(evento => {
      const info = EVENTO_ICONS[evento.tipo_evento as TipoEventoRuta] || EVENTO_ICONS.otro;
      const color = MARKER_COLORS[evento.tipo_evento as TipoEventoRuta] || '#9ca3af';
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center w-7 h-7 rounded-full shadow-md text-sm cursor-pointer';
      el.style.backgroundColor = color;
      el.style.border = '2px solid white';
      el.textContent = info.icon;
      el.title = `${info.label} — ${format(new Date(evento.hora_inicio), 'HH:mm:ss')}`;

      const popupHtml = `<div style="font-size:11px;max-width:180px">
        <strong>${info.icon} ${info.label}</strong><br/>
        <span style="color:#666">${format(new Date(evento.hora_inicio), 'HH:mm:ss')}</span>
        ${evento.descripcion ? `<br/>${evento.descripcion}` : ''}
        ${evento.duracion_segundos ? `<br/><em>Duración: ${Math.round(evento.duracion_segundos / 60)}m</em>` : ''}
      </div>`;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([evento.lng!, evento.lat!])
        .setPopup(new mapboxgl.Popup({ offset: 15, closeButton: false }).setHTML(popupHtml))
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    if (points.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      points.forEach(e => bounds.extend([e.lng!, e.lat!]));
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    } else {
      mapRef.current.flyTo({ center: [points[0].lng!, points[0].lat!], zoom: 12 });
    }
  }, [eventos, mapReady]);

  // Route trace
  useEffect(() => {
    if (!mapRef.current || !mapReady || !traza?.route_geojson) return;
    const map = mapRef.current;
    if (map.getSource('detail-route')) {
      (map.getSource('detail-route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature', properties: {}, geometry: traza.route_geojson as any,
      });
    } else {
      map.addSource('detail-route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: traza.route_geojson as any },
      });
      map.addLayer({
        id: 'detail-route-line',
        type: 'line',
        source: 'detail-route',
        paint: { 'line-color': '#60a5fa', 'line-width': 4, 'line-opacity': 0.85 },
        layout: { 'line-join': 'round', 'line-cap': 'round' },
      });
    }
  }, [traza, mapReady]);

  // Auto-generate trace when events load
  useEffect(() => {
    if (mapReady && eventos.filter(e => e.lat && e.lng).length >= 2) {
      generateTraza(eventos).catch(() => {});
    }
  }, [eventos, mapReady]);

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>🗺️ Ruta del Servicio</span>
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5 h-7"
            onClick={() => {
              generateTraza(eventos).then(() => toast.success('Traza generada')).catch((e: any) => toast.error(e.message));
            }}
            disabled={isCalculating || eventos.filter(e => e.lat && e.lng).length < 2}
          >
            {isCalculating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Route className="h-3 w-3" />}
            Traza
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        <div ref={mapContainer} className="w-full h-full min-h-[400px] rounded-b-lg" />
      </CardContent>
    </Card>
  );
};
