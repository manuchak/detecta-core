import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { initializeMapboxToken } from '@/lib/mapbox';
import { HIGHWAY_SEGMENTS, HIGHWAY_POIS, RISK_LEVEL_COLORS, type HighwaySegment, type RiskLevel } from '@/lib/security/highwaySegments';
import { CELLULAR_DEAD_ZONES } from '@/lib/security/cellularCoverage';
import { useSafePoints } from '@/hooks/security/useSafePoints';
import { Loader2 } from 'lucide-react';

interface LayerVisibility {
  segments: boolean;
  pois: boolean;
  safePoints: boolean;
  deadZones: boolean;
  labels: boolean;
}

interface RiskZonesMapProps {
  layers: LayerVisibility;
  selectedSegmentId?: string | null;
  onSegmentSelect?: (segment: HighwaySegment | null) => void;
}

const POI_COLORS: Record<string, string> = {
  blackspot: '#dc2626',
  tollbooth: '#6366f1',
  junction: '#f59e0b',
  safe_area: '#22c55e',
  industrial: '#8b5cf6',
};

export function RiskZonesMap({ layers, selectedSegmentId, onSegmentSelect }: RiskZonesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { data: safePoints } = useSafePoints({ activeOnly: true });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    let cancelled = false;

    (async () => {
      const token = await initializeMapboxToken();
      if (cancelled || !token || !mapContainer.current) {
        if (!token) setError('No se pudo obtener el token de Mapbox');
        return;
      }

      mapboxgl.accessToken = token;

      const m = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-101.0, 21.5],
        zoom: 5.2,
        attributionControl: false,
      });

      m.addControl(new mapboxgl.NavigationControl(), 'top-left');

      m.on('load', () => {
        if (cancelled) return;
        map.current = m;
        setMapReady(true);
        setLoading(false);
        m.resize();
        setTimeout(() => m.resize(), 100);
        setTimeout(() => m.resize(), 500);
        setTimeout(() => m.resize(), 1000);
      });

      m.on('error', () => {
        setError('Error al cargar el mapa');
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // ResizeObserver to force Mapbox canvas recalculation
  useEffect(() => {
    if (!mapContainer.current || !map.current) return;
    const observer = new ResizeObserver(() => {
      map.current?.resize();
    });
    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, [mapReady]);

  // Add data layers once map is ready
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const m = map.current;

    // Segments as a single source with data-driven styling
    const segmentFeatures = HIGHWAY_SEGMENTS.map(seg => ({
      type: 'Feature' as const,
      properties: {
        id: seg.id,
        name: seg.name,
        riskLevel: seg.riskLevel,
        color: RISK_LEVEL_COLORS[seg.riskLevel],
        kmStart: seg.kmStart,
        kmEnd: seg.kmEnd,
        avgMonthlyEvents: seg.avgMonthlyEvents,
        criticalHours: seg.criticalHours,
        commonIncidentType: seg.commonIncidentType,
        recommendations: JSON.stringify(seg.recommendations),
      },
      geometry: { type: 'LineString' as const, coordinates: seg.waypoints },
    }));

    if (!m.getSource('segments')) {
      m.addSource('segments', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: segmentFeatures },
      });

      m.addLayer({
        id: 'segments-line',
        type: 'line',
        source: 'segments',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 6, 4],
          'line-opacity': 0.85,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });

      m.addLayer({
        id: 'segments-labels',
        type: 'symbol',
        source: 'segments',
        layout: {
          'symbol-placement': 'line-center',
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        },
      });
    }

    // POIs
    const poiFeatures = HIGHWAY_POIS.map(poi => ({
      type: 'Feature' as const,
      properties: {
        id: poi.id,
        name: poi.name,
        type: poi.type,
        color: POI_COLORS[poi.type] || '#888',
        description: poi.description,
      },
      geometry: { type: 'Point' as const, coordinates: poi.coordinates },
    }));

    if (!m.getSource('pois')) {
      m.addSource('pois', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: poiFeatures },
      });

      m.addLayer({
        id: 'pois-circle',
        type: 'circle',
        source: 'pois',
        paint: {
          'circle-radius': 5,
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
        },
      });
    }

    // Dead zones
    const dzFeatures = CELLULAR_DEAD_ZONES.map(dz => ({
      type: 'Feature' as const,
      properties: { name: dz.name, severity: dz.severity },
      geometry: { type: 'Polygon' as const, coordinates: [dz.polygon] },
    }));

    if (!m.getSource('dead-zones')) {
      m.addSource('dead-zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: dzFeatures },
      });

      m.addLayer({
        id: 'dead-zones-fill',
        type: 'fill',
        source: 'dead-zones',
        paint: {
          'fill-color': ['case', ['==', ['get', 'severity'], 'total'], '#6b7280', '#9ca3af'],
          'fill-opacity': 0.25,
        },
      });

      m.addLayer({
        id: 'dead-zones-outline',
        type: 'line',
        source: 'dead-zones',
        paint: { 'line-color': '#6b7280', 'line-width': 1, 'line-dasharray': [2, 2] },
      });
    }

    // Click on segment
    m.on('click', 'segments-line', (e) => {
      if (!e.features?.[0]) return;
      const props = e.features[0].properties!;
      const seg = HIGHWAY_SEGMENTS.find(s => s.id === props.id);
      if (seg) onSegmentSelect?.(seg);

      const recs = JSON.parse(props.recommendations || '[]');
      const html = `
        <div style="max-width:280px;font-size:12px;">
          <div style="font-weight:600;margin-bottom:4px;">${props.name}</div>
          <div style="display:flex;gap:8px;margin-bottom:4px;">
            <span style="background:${RISK_LEVEL_COLORS[props.riskLevel as RiskLevel]};color:#fff;padding:1px 6px;border-radius:4px;font-size:10px;">${props.riskLevel.toUpperCase()}</span>
            <span>Km ${props.kmStart}-${props.kmEnd}</span>
          </div>
          <div>📊 ${props.avgMonthlyEvents} eventos/mes · ⏰ ${props.criticalHours}</div>
          <div style="margin-top:4px;color:#d1d5db;">🔍 ${props.commonIncidentType}</div>
          ${recs.length ? `<div style="margin-top:6px;border-top:1px solid #374151;padding-top:4px;"><strong>ISO 28000:</strong><ul style="margin:2px 0 0 12px;padding:0;">${recs.map((r: string) => `<li style="margin-bottom:2px;">${r}</li>`).join('')}</ul></div>` : ''}
        </div>
      `;
      popupRef.current?.remove();
      popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: '320px' })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(m);
    });

    // Cursor
    m.on('mouseenter', 'segments-line', () => { m.getCanvas().style.cursor = 'pointer'; });
    m.on('mouseleave', 'segments-line', () => { m.getCanvas().style.cursor = ''; });
  }, [mapReady, onSegmentSelect]);

  // Add safe points when data loads
  useEffect(() => {
    if (!mapReady || !map.current || !safePoints?.length) return;
    const m = map.current;

    const spFeatures = safePoints.map(sp => ({
      type: 'Feature' as const,
      properties: { name: sp.name, type: sp.type, cert: sp.certification_level },
      geometry: { type: 'Point' as const, coordinates: [sp.lng, sp.lat] },
    }));

    if (m.getSource('safe-points')) {
      (m.getSource('safe-points') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: spFeatures,
      });
    } else {
      m.addSource('safe-points', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: spFeatures },
      });
      m.addLayer({
        id: 'safe-points-circle',
        type: 'circle',
        source: 'safe-points',
        paint: {
          'circle-radius': 7,
          'circle-color': '#22c55e',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.8,
        },
      });
    }
  }, [mapReady, safePoints]);

  // Toggle layers
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const m = map.current;
    const set = (id: string, visible: boolean) => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    };
    set('segments-line', layers.segments);
    set('segments-labels', layers.labels);
    set('pois-circle', layers.pois);
    set('safe-points-circle', layers.safePoints);
    set('dead-zones-fill', layers.deadZones);
    set('dead-zones-outline', layers.deadZones);
  }, [mapReady, layers]);

  // Fly to selected segment
  useEffect(() => {
    if (!mapReady || !map.current || !selectedSegmentId) return;
    const seg = HIGHWAY_SEGMENTS.find(s => s.id === selectedSegmentId);
    if (!seg) return;
    const mid = seg.waypoints[Math.floor(seg.waypoints.length / 2)];
    map.current.flyTo({ center: mid, zoom: 9, duration: 1200 });
  }, [mapReady, selectedSegmentId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      {/* Legend — outside zoom, absolute position */}
      {mapReady && (
        <div className="absolute bottom-2 left-2 bg-background/90 border rounded p-1.5 text-[9px] space-y-0.5 backdrop-blur-sm z-[5]">
          <div className="font-semibold text-foreground text-[9px]">Nivel de Riesgo</div>
          {(['extremo', 'alto', 'medio', 'bajo'] as RiskLevel[]).map(level => (
            <div key={level} className="flex items-center gap-1">
              <div className="w-3 h-0.5 rounded" style={{ backgroundColor: RISK_LEVEL_COLORS[level] }} />
              <span className="text-muted-foreground capitalize">{level}</span>
            </div>
          ))}
          <div className="border-t pt-0.5 mt-0.5">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full border border-white" style={{ backgroundColor: 'hsl(var(--accent))' }} />
              <span className="text-muted-foreground">Punto seguro</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded border border-dashed" style={{ backgroundColor: 'hsl(var(--muted) / 0.25)', borderColor: 'hsl(var(--muted-foreground))' }} />
              <span className="text-muted-foreground">Sin cobertura</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
