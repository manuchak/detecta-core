import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route, Loader2 } from 'lucide-react';
import { initializeMapboxToken } from '@/lib/mapbox';
import { useBitacoraTraza, type EventoRuta, type TipoEventoRuta, EVENTO_ICONS } from '@/hooks/useEventosRuta';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from 'sonner';

interface Props {
  servicioId: string | null;
  eventos: EventoRuta[];
}

export const BitacoraMap: React.FC<Props> = ({ servicioId, eventos }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const { generateTraza, traza, isCalculating, error } = useBitacoraTraza();

  // Initialize map
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

  // Update markers when events change
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const points = eventos.filter(e => e.lat && e.lng);
    if (points.length === 0) return;

    points.forEach(evento => {
      const info = EVENTO_ICONS[evento.tipo_evento as TipoEventoRuta] || EVENTO_ICONS.otro;
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center w-7 h-7 rounded-full bg-background border-2 shadow-md text-sm cursor-pointer';
      el.style.borderColor = info.color;
      el.textContent = info.icon;
      el.title = `${info.label} — ${new Date(evento.hora_inicio).toLocaleTimeString('es-MX')}`;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([evento.lng!, evento.lat!])
        .setPopup(
          new mapboxgl.Popup({ offset: 15, closeButton: false })
            .setHTML(`<div style="font-size:12px"><strong>${info.icon} ${info.label}</strong><br/>${evento.descripcion || ''}<br/><span style="color:#888">${new Date(evento.hora_inicio).toLocaleTimeString('es-MX')}</span></div>`)
        )
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (points.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      points.forEach(e => bounds.extend([e.lng!, e.lat!]));
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    } else {
      mapRef.current.flyTo({ center: [points[0].lng!, points[0].lat!], zoom: 12 });
    }
  }, [eventos, mapReady]);

  // Draw route trace when traza available
  useEffect(() => {
    if (!mapRef.current || !mapReady || !traza?.route_geojson) return;
    const map = mapRef.current;

    if (map.getSource('bitacora-route')) {
      (map.getSource('bitacora-route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: traza.route_geojson as any,
      });
    } else {
      map.addSource('bitacora-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: traza.route_geojson as any,
        },
      });
      map.addLayer({
        id: 'bitacora-route-line',
        type: 'line',
        source: 'bitacora-route',
        paint: {
          'line-color': 'hsl(210, 100%, 60%)',
          'line-width': 4,
          'line-opacity': 0.8,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
      });
    }
  }, [traza, mapReady]);

  const handleGenerateTraza = async () => {
    const pointEvents = eventos.filter(e => e.lat && e.lng);
    if (pointEvents.length < 2) {
      toast.error('Se necesitan al menos 2 puntos con coordenadas');
      return;
    }
    try {
      await generateTraza(eventos);
      toast.success('Traza de ruta generada (road-snapped)');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-lg">🗺️</span> Traza de Ruta
          </span>
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            onClick={handleGenerateTraza}
            disabled={isCalculating || eventos.filter(e => e.lat && e.lng).length < 2}
          >
            {isCalculating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Route className="h-3 w-3" />}
            Generar Traza
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        <div ref={mapContainer} className="w-full h-full min-h-[300px] rounded-b-lg" />
      </CardContent>
    </Card>
  );
};
