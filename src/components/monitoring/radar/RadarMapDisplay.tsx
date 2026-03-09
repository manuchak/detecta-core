import { useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { initializeMapboxToken } from '@/lib/mapbox';
import { RadarService, RadarSafePoint, AlertLevel, ServicePhase } from '@/hooks/useServiciosTurnoLive';
import { matchRoute, splitRouteAtPosition } from '@/lib/radar/routeMatcher';

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

function getRouteColor(phase: ServicePhase, alertLevel: AlertLevel): string {
  if (alertLevel === 'critical') return '#ef4444';
  if (alertLevel === 'warning') return '#f59e0b';
  if (phase === 'evento_especial') return '#a855f7';
  return '#22c55e';
}

const RadarMapDisplay = ({ servicios, safePoints, className }: RadarMapDisplayProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const serviceMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const safePointMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const routeMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const currentZoomRef = useRef(5.2);
  const mapLoadedRef = useRef(false);

  // Compute route data for each active service
  const routeData = useMemo(() => {
    return servicios
      .filter(s => s.lat && s.lng && s.destLat && s.destLng && (s.phase as string) !== 'completado')
      .map(s => {
        const route = matchRoute(s.origen, s.destino);
        if (!route) {
          // Fallback: straight lines
          const originCoords: [number, number] = s.positionSource === 'gps'
            ? [s.lng!, s.lat!] // If GPS, we don't know true origin - use current pos
            : [s.lng!, s.lat!];
          return {
            service: s,
            traveled: s.positionSource === 'gps'
              ? [originCoords, [s.lng!, s.lat!] as [number, number]]
              : [] as [number, number][],
            remaining: [[s.lng!, s.lat!] as [number, number], [s.destLng!, s.destLat!] as [number, number]],
            deadZones: [],
            hasCorridor: false,
          };
        }

        if (s.positionSource === 'gps') {
          const { traveled, remaining } = splitRouteAtPosition(route.waypoints, [s.lng!, s.lat!]);
          return { service: s, traveled, remaining, deadZones: route.deadZones, hasCorridor: true };
        } else {
          // No GPS yet - show full route as pending
          return {
            service: s,
            traveled: [] as [number, number][],
            remaining: route.waypoints,
            deadZones: route.deadZones,
            hasCorridor: true,
          };
        }
      });
  }, [servicios]);

  // Collect all unique dead zones from active routes
  const activeDeadZones = useMemo(() => {
    const seen = new Set<string>();
    const zones: { center: [number, number]; polygon: [number, number][]; name: string; severity: string }[] = [];
    routeData.forEach(r => {
      r.deadZones.forEach(dz => {
        if (!seen.has(dz.id)) {
          seen.add(dz.id);
          zones.push({ center: dz.center, polygon: dz.polygon, name: dz.name, severity: dz.severity });
        }
      });
    });
    return zones;
  }, [routeData]);

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

  // Update route layers (GeoJSON sources)
  useEffect(() => {
    if (!map.current || !mapLoadedRef.current) return;

    const m = map.current;

    // Build GeoJSON for traveled segments
    const traveledFeatures = routeData
      .filter(r => r.traveled.length >= 2)
      .map(r => ({
        type: 'Feature' as const,
        properties: { color: getRouteColor(r.service.phase, r.service.alertLevel) },
        geometry: { type: 'LineString' as const, coordinates: r.traveled },
      }));

    // Build GeoJSON for remaining segments
    const remainingFeatures = routeData
      .filter(r => r.remaining.length >= 2)
      .map(r => ({
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates: r.remaining },
      }));

    // Build GeoJSON for dead zones (polygons)
    const deadZoneFeatures = activeDeadZones
      .filter(dz => dz.polygon.length >= 3)
      .map(dz => ({
        type: 'Feature' as const,
        properties: { name: dz.name, severity: dz.severity },
        geometry: { type: 'Polygon' as const, coordinates: [[...dz.polygon, dz.polygon[0]]] },
      }));

    // Dead zone circles for zones without polygon (fallback with center point)
    const deadZoneCircleFeatures = activeDeadZones.map(dz => ({
      type: 'Feature' as const,
      properties: { name: dz.name, severity: dz.severity },
      geometry: { type: 'Point' as const, coordinates: dz.center },
    }));

    // Upsert sources and layers
    const upsertSource = (id: string, data: any) => {
      const src = m.getSource(id) as mapboxgl.GeoJSONSource | undefined;
      if (src) {
        src.setData(data);
      } else {
        m.addSource(id, { type: 'geojson', data });
      }
    };

    // Traveled routes
    upsertSource('radar-routes-traveled', { type: 'FeatureCollection', features: traveledFeatures });
    if (!m.getLayer('radar-routes-traveled-layer')) {
      m.addLayer({
        id: 'radar-routes-traveled-layer',
        type: 'line',
        source: 'radar-routes-traveled',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
          'line-opacity': 0.85,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
    }

    // Remaining routes
    upsertSource('radar-routes-remaining', { type: 'FeatureCollection', features: remainingFeatures });
    if (!m.getLayer('radar-routes-remaining-layer')) {
      m.addLayer({
        id: 'radar-routes-remaining-layer',
        type: 'line',
        source: 'radar-routes-remaining',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 0.4,
          'line-dasharray': [6, 4],
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
    }

    // Dead zone polygons
    upsertSource('radar-deadzones-poly', { type: 'FeatureCollection', features: deadZoneFeatures });
    if (!m.getLayer('radar-deadzones-fill')) {
      m.addLayer({
        id: 'radar-deadzones-fill',
        type: 'fill',
        source: 'radar-deadzones-poly',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.12,
        },
        minzoom: 6,
      });
      m.addLayer({
        id: 'radar-deadzones-outline',
        type: 'line',
        source: 'radar-deadzones-poly',
        paint: {
          'line-color': '#ef4444',
          'line-width': 1,
          'line-opacity': 0.3,
        },
        minzoom: 6,
      });
    }

    // Dead zone center points (circles)
    upsertSource('radar-deadzones-pts', { type: 'FeatureCollection', features: deadZoneCircleFeatures });
    if (!m.getLayer('radar-deadzones-circles')) {
      m.addLayer({
        id: 'radar-deadzones-circles',
        type: 'circle',
        source: 'radar-deadzones-pts',
        paint: {
          'circle-radius': 8,
          'circle-color': '#ef4444',
          'circle-opacity': 0.2,
          'circle-stroke-color': '#ef4444',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.4,
        },
        minzoom: 6,
      });
    }

    // Cleanup route endpoint markers
    routeMarkersRef.current.forEach(m => m.remove());
    routeMarkersRef.current = [];

    // Add origin (○) and destination (◆) markers for each route
    routeData.forEach(r => {
      const s = r.service;
      if (!s.destLat || !s.destLng) return;

      // Destination marker (diamond)
      const destEl = document.createElement('div');
      destEl.style.width = '10px';
      destEl.style.height = '10px';
      destEl.style.backgroundColor = '#ffffff';
      destEl.style.opacity = '0.7';
      destEl.style.transform = 'rotate(45deg)';
      destEl.style.border = '1px solid rgba(255,255,255,0.4)';
      const destMarker = new mapboxgl.Marker({ element: destEl })
        .setLngLat([s.destLng, s.destLat])
        .addTo(m);
      routeMarkersRef.current.push(destMarker);
    });

  }, [routeData, activeDeadZones]);

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
        {/* Route legend */}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-xs text-gray-300">Recorrido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 border-t border-dashed" style={{ borderColor: 'rgba(255,255,255,0.5)' }} />
          <span className="text-xs text-gray-300">Pendiente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.3)' }} />
          <span className="text-xs text-gray-300">Sin señal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-0 h-0" style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '7px solid rgba(239,68,68,0.6)' }} />
          <span className="text-xs text-gray-300">Riesgo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.5)' }} />
          <span className="text-xs text-gray-300">Safe Point</span>
        </div>
      </div>
    </div>
  );
};

export default RadarMapDisplay;
