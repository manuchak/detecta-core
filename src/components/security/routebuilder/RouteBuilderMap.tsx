import React, { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { initializeMapboxToken } from '@/lib/mapbox';

interface Props {
  origin: [number, number] | null;
  destination: [number, number] | null;
  waypoints: [number, number][];
  routeGeojson: { type: string; coordinates: number[][] } | null;
  altRouteGeojson: { type: string; coordinates: number[][] } | null;
  onOriginChange: (coords: [number, number]) => void;
  onDestinationChange: (coords: [number, number]) => void;
  onWaypointChange: (index: number, coords: [number, number]) => void;
}

export const RouteBuilderMap: React.FC<Props> = ({
  origin, destination, waypoints, routeGeojson, altRouteGeojson,
  onOriginChange, onDestinationChange, onWaypointChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    const init = async () => {
      const token = await initializeMapboxToken();
      if (!token || cancelled) return;

      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-102.5, 23.6], // Mexico center
        zoom: 5,
      });
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      mapRef.current = map;

      map.on('load', () => {
        // Route layers
        map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
        map.addSource('alt-route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });

        map.addLayer({ id: 'alt-route-line', type: 'line', source: 'alt-route', paint: { 'line-color': '#94a3b8', 'line-width': 4, 'line-opacity': 0.5, 'line-dasharray': [2, 2] } });
        map.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.85 } });
      });
    };
    init();

    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // Update route layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const routeSrc = map.getSource('route') as mapboxgl.GeoJSONSource;
    if (routeSrc && routeGeojson?.coordinates?.length) {
      routeSrc.setData({ type: 'Feature', geometry: routeGeojson as any, properties: {} });
    } else if (routeSrc) {
      routeSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} });
    }

    const altSrc = map.getSource('alt-route') as mapboxgl.GeoJSONSource;
    if (altSrc && altRouteGeojson?.coordinates?.length) {
      altSrc.setData({ type: 'Feature', geometry: altRouteGeojson as any, properties: {} });
    } else if (altSrc) {
      altSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} });
    }
  }, [routeGeojson, altRouteGeojson]);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    clearMarkers();

    const addDraggableMarker = (
      coords: [number, number],
      color: string,
      label: string,
      onDragEnd: (lngLat: { lng: number; lat: number }) => void
    ) => {
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center';
      el.style.cssText = `width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:grab;`;
      el.title = label;

      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat(coords)
        .addTo(map);
      marker.on('dragend', () => onDragEnd(marker.getLngLat()));
      markersRef.current.push(marker);
    };

    if (origin) {
      addDraggableMarker(origin, '#16a34a', 'Origen', (ll) => onOriginChange([ll.lng, ll.lat]));
    }
    if (destination) {
      addDraggableMarker(destination, '#dc2626', 'Destino', (ll) => onDestinationChange([ll.lng, ll.lat]));
    }
    waypoints.forEach((wp, i) => {
      addDraggableMarker(wp, '#f59e0b', `Waypoint ${i + 1}`, (ll) => onWaypointChange(i, [ll.lng, ll.lat]));
    });

    // Fit bounds
    const allPts = [origin, ...waypoints, destination].filter(Boolean) as [number, number][];
    if (allPts.length >= 2) {
      const bounds = new mapboxgl.LngLatBounds();
      allPts.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
    }
  }, [origin, destination, waypoints, clearMarkers, onOriginChange, onDestinationChange, onWaypointChange]);

  return <div ref={containerRef} className="w-full h-full min-h-[400px] rounded-lg" />;
};
