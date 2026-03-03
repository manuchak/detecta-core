import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { initializeMapboxToken } from '@/lib/mapbox';
import { HIGHWAY_SEGMENTS, HIGHWAY_POIS, RISK_LEVEL_COLORS, CORRIDOR_ROUTE_INFO, getSegmentRouteType, getSegmentHighwayDesignation, getOperationalCategory, type HighwaySegment, type RiskLevel, type RouteType, type OperationalCategory } from '@/lib/security/highwaySegments';
import { CELLULAR_DEAD_ZONES } from '@/lib/security/cellularCoverage';
import { useSafePoints } from '@/hooks/security/useSafePoints';
import { useSegmentGeometries } from '@/hooks/security/useSegmentGeometries';
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

const OPERATIONAL_STYLES: Record<OperationalCategory, { color: string; radius: number; opacity: number; strokeWidth: number; label: string; icon: string }> = {
  alerta:     { color: '#ef4444', radius: 7, opacity: 1,   strokeWidth: 2, label: '⚠️ NO detenerse', icon: '🔴' },
  pernocta:   { color: '#3b82f6', radius: 6, opacity: 0.9, strokeWidth: 2, label: '✅ Puede pernoctar', icon: '🛏️' },
  descanso:   { color: '#22c55e', radius: 4, opacity: 0.85, strokeWidth: 1, label: '⛽ Parada breve', icon: '⛽' },
  referencia: { color: '#9ca3af', radius: 3, opacity: 0.6, strokeWidth: 1, label: 'ℹ️ Referencia', icon: '📍' },
};

export function RiskZonesMap({ layers, selectedSegmentId, onSegmentSelect }: RiskZonesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { data: safePoints } = useSafePoints({ activeOnly: true });
  const { data: geometries } = useSegmentGeometries();

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
    const segmentFeatures = HIGHWAY_SEGMENTS.map(seg => {
      const cached = geometries?.[seg.id];
      const coordinates = cached?.coordinates?.length ? cached.coordinates : seg.waypoints;
      const routeType = getSegmentRouteType(seg);
      const highwayDesignation = getSegmentHighwayDesignation(seg);
      return {
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
          routeType,
          highwayDesignation,
        },
        geometry: { type: 'LineString' as const, coordinates },
      };
    });

    if (!m.getSource('segments')) {
      m.addSource('segments', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: segmentFeatures },
      });

      // Glow layer (underneath main line for visibility)
      m.addLayer({
        id: 'segments-glow',
        type: 'line',
        source: 'segments',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 12,
          'line-opacity': 0.25,
          'line-blur': 6,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });

      // Cuota layer (solid line)
      m.addLayer({
        id: 'segments-line-cuota',
        type: 'line',
        source: 'segments',
        filter: ['==', ['get', 'routeType'], 'cuota'],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 8, 5],
          'line-opacity': 0.95,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });

      // Libre layer (dashed line)
      m.addLayer({
        id: 'segments-line-libre',
        type: 'line',
        source: 'segments',
        filter: ['==', ['get', 'routeType'], 'libre'],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 8, 5],
          'line-opacity': 0.95,
          'line-dasharray': [4, 3],
        },
        layout: { 'line-cap': 'butt', 'line-join': 'round' },
      });

      // Mixta layer (dot-dash line)
      m.addLayer({
        id: 'segments-line-mixta',
        type: 'line',
        source: 'segments',
        filter: ['==', ['get', 'routeType'], 'mixta'],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 8, 5],
          'line-opacity': 0.95,
          'line-dasharray': [8, 3, 2, 3],
        },
        layout: { 'line-cap': 'butt', 'line-join': 'round' },
      });

      // Selected segment outline (white border highlight)
      m.addLayer({
        id: 'segments-selected-outline',
        type: 'line',
        source: 'segments',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'line-color': '#ffffff',
          'line-width': 10,
          'line-opacity': 0.6,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });

      m.addLayer({
        id: 'segments-labels',
        type: 'symbol',
        source: 'segments',
        layout: {
          'symbol-placement': 'line',
          'text-field': ['concat', ['get', 'highwayDesignation'], ' ', ['get', 'name']],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            5, 8,
            7, 10,
            9, 12,
            12, 14,
          ],
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-anchor': 'center',
          'text-offset': [0, -1],
          'text-max-angle': 30,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'symbol-spacing': 250,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0, 0, 0, 0.85)',
          'text-halo-width': 2,
          'text-halo-blur': 1,
        },
      });
    }

    // POIs — differentiated by operational category
    const poiFeatures = HIGHWAY_POIS.map(poi => {
      const cat = getOperationalCategory(poi);
      const style = OPERATIONAL_STYLES[cat];
      return {
        type: 'Feature' as const,
        properties: {
          id: poi.id,
          name: poi.name,
          type: poi.type,
          subtype: poi.subtype || '',
          category: cat,
          color: style.color,
          radius: style.radius,
          opacity: style.opacity,
          strokeWidth: style.strokeWidth,
          description: poi.description,
          services: JSON.stringify(poi.services || []),
          catLabel: style.label,
          catIcon: style.icon,
        },
        geometry: { type: 'Point' as const, coordinates: poi.coordinates },
      };
    });

    if (!m.getSource('pois')) {
      m.addSource('pois', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: poiFeatures },
      });

      // Alerta: pulsing glow ring
      m.addLayer({
        id: 'pois-alerta-glow',
        type: 'circle',
        source: 'pois',
        filter: ['==', ['get', 'category'], 'alerta'],
        paint: {
          'circle-radius': 12,
          'circle-color': '#ef4444',
          'circle-opacity': 0.2,
          'circle-blur': 0.8,
        },
      });

      // Main circle for all POIs — data-driven
      m.addLayer({
        id: 'pois-circle',
        type: 'circle',
        source: 'pois',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': ['get', 'opacity'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': ['get', 'strokeWidth'],
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

    // Click handlers for all interactive segment layers
    const segmentLayers = ['segments-line-cuota', 'segments-line-libre', 'segments-line-mixta'];
    
    segmentLayers.forEach(layerId => {
      m.on('click', layerId, (e) => {
        if (!e.features?.[0]) return;
        const props = e.features[0].properties!;
        const seg = HIGHWAY_SEGMENTS.find(s => s.id === props.id);
        if (seg) onSegmentSelect?.(seg);

        const recs = JSON.parse(props.recommendations || '[]');
        const routeTypeLabels: Record<string, string> = { cuota: '🛣️ Cuota', libre: '🛤️ Libre', mixta: '🔀 Mixta' };
        const html = `
          <div style="max-width:280px;font-size:12px;">
            <div style="font-weight:600;margin-bottom:4px;">${props.highwayDesignation ? `[${props.highwayDesignation}] ` : ''}${props.name}</div>
            <div style="display:flex;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
              <span style="background:${RISK_LEVEL_COLORS[props.riskLevel as RiskLevel]};color:#fff;padding:1px 6px;border-radius:4px;font-size:10px;">${props.riskLevel.toUpperCase()}</span>
              <span style="background:#374151;color:#d1d5db;padding:1px 6px;border-radius:4px;font-size:10px;">${routeTypeLabels[props.routeType] || props.routeType}</span>
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
    });

    // Click on POI
    m.on('click', 'pois-circle', (e) => {
      if (!e.features?.[0]) return;
      const props = e.features[0].properties!;
      const services = JSON.parse(props.services || '[]');
      const servicesHtml = services.length
        ? `<div style="margin-top:4px;font-size:10px;color:#9ca3af;">🔧 ${services.join(' · ')}</div>`
        : '';
      const html = `
        <div style="max-width:260px;font-size:12px;">
          <div style="font-weight:600;margin-bottom:4px;">${props.name}</div>
          <div style="margin-bottom:4px;display:flex;gap:6px;align-items:center;">
            <span style="background:${props.color};color:#fff;padding:1px 6px;border-radius:4px;font-size:10px;">${props.catLabel}</span>
            ${props.subtype ? `<span style="font-size:10px;color:#9ca3af;">${props.subtype.replace(/_/g, ' ')}</span>` : ''}
          </div>
          <div style="color:#d1d5db;">${props.description || ''}</div>
          ${servicesHtml}
        </div>
      `;
      popupRef.current?.remove();
      popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: '300px' })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(m);
    });

    // Click on safe point
    m.on('click', 'safe-points-circle', (e) => {
      if (!e.features?.[0]) return;
      const props = e.features[0].properties!;
      const certColors: Record<string, string> = { oro: '#f59e0b', plata: '#94a3b8', bronce: '#d97706', precaucion: '#ef4444' };
      const certLabels: Record<string, string> = { oro: '🥇 Oro', plata: '🥈 Plata', bronce: '🥉 Bronce', precaucion: '⚠️ Precaución' };
      const html = `
        <div style="max-width:260px;font-size:12px;">
          <div style="font-weight:600;margin-bottom:4px;">🛡️ ${props.name}</div>
          <div style="display:flex;gap:6px;margin-bottom:4px;">
            <span style="background:${certColors[props.cert] || '#22c55e'};color:#fff;padding:1px 6px;border-radius:4px;font-size:10px;">${certLabels[props.cert] || props.cert}</span>
            <span style="font-size:10px;color:#9ca3af;">${props.type || ''}</span>
          </div>
        </div>
      `;
      popupRef.current?.remove();
      popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: '300px' })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(m);
    });

    // Cursor for all interactive layers
    [...segmentLayers, 'pois-circle', 'safe-points-circle'].forEach(layer => {
      m.on('mouseenter', layer, () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', layer, () => { m.getCanvas().style.cursor = ''; });
    });
  }, [mapReady, onSegmentSelect, geometries]);

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
    set('segments-glow', layers.segments);
    set('segments-line-cuota', layers.segments);
    set('segments-line-libre', layers.segments);
    set('segments-line-mixta', layers.segments);
    set('segments-selected-outline', layers.segments);
    set('segments-labels', layers.labels);
    set('pois-circle', layers.pois);
    set('pois-alerta-glow', layers.pois);
    set('safe-points-circle', layers.safePoints);
    set('dead-zones-fill', layers.deadZones);
    set('dead-zones-outline', layers.deadZones);
  }, [mapReady, layers]);

  // Fly to selected segment
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const m = map.current;

    // Update selected outline filter
    if (m.getLayer('segments-selected-outline')) {
      m.setFilter('segments-selected-outline', selectedSegmentId
        ? ['==', ['get', 'id'], selectedSegmentId]
        : ['==', ['get', 'id'], '']);
    }

    if (!selectedSegmentId) return;
    const seg = HIGHWAY_SEGMENTS.find(s => s.id === selectedSegmentId);
    if (!seg) return;
    const mid = seg.waypoints[Math.floor(seg.waypoints.length / 2)];
    m.flyTo({ center: mid, zoom: 9, duration: 1200 });
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
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {/* Legend */}
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
            <div className="font-semibold text-foreground text-[9px]">Tipo de Vía</div>
            <div className="flex items-center gap-1">
              <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="hsl(var(--foreground))" strokeWidth="2" /></svg>
              <span className="text-muted-foreground">Cuota</span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="hsl(var(--foreground))" strokeWidth="2" strokeDasharray="4,3" /></svg>
              <span className="text-muted-foreground">Libre</span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="hsl(var(--foreground))" strokeWidth="2" strokeDasharray="6,2,2,2" /></svg>
              <span className="text-muted-foreground">Mixta</span>
            </div>
          </div>
          <div className="border-t pt-0.5 mt-0.5">
            <div className="font-semibold text-foreground text-[9px]">POIs Operativos</div>
            {(Object.entries(OPERATIONAL_STYLES) as [OperationalCategory, typeof OPERATIONAL_STYLES[OperationalCategory]][]).map(([cat, style]) => (
              <div key={cat} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: style.color, opacity: style.opacity }} />
                <span className="text-muted-foreground text-[8px]">{style.icon} {cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              </div>
            ))}
          </div>
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