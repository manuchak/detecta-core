import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowRightLeft, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { initializeMapboxToken } from '@/lib/mapbox';
import type { FlujoOrigenDestino } from '../../types/planningResources';

interface FlowMapProps {
  flujos: FlujoOrigenDestino[];
  height?: number;
}

// Colores basados en el ratio de desequilibrio
const FLOW_COLORS = {
  balanced: '#22c55e',    // green-500
  moderate: '#eab308',    // yellow-500
  high: '#f97316',        // orange-500
  critical: '#ef4444',    // red-500
};

function getFlowColor(ratio: number): string {
  if (ratio <= 1.5) return FLOW_COLORS.balanced;
  if (ratio <= 2.5) return FLOW_COLORS.moderate;
  if (ratio <= 4) return FLOW_COLORS.high;
  return FLOW_COLORS.critical;
}

function getFlowLabel(ratio: number): string {
  if (ratio <= 1.5) return 'Balanceado';
  if (ratio <= 2.5) return 'Desequilibrio moderado';
  if (ratio <= 4) return 'Desequilibrio alto';
  return 'Empty Leg crítico';
}

// Generar puntos de una curva de Bezier cuadrática
function generateBezierPoints(
  start: [number, number],
  end: [number, number],
  numPoints: number = 50
): [number, number][] {
  const midX = (start[0] + end[0]) / 2;
  const midY = (start[1] + end[1]) / 2;
  
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Offset perpendicular para crear la curva (15% de la distancia)
  const offsetFactor = 0.15;
  const perpX = -dy / distance * distance * offsetFactor;
  const perpY = dx / distance * distance * offsetFactor;
  
  const controlX = midX + perpX;
  const controlY = midY + perpY;
  
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const x = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * controlX + t * t * end[0];
    const y = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * controlY + t * t * end[1];
    points.push([x, y]);
  }
  
  return points;
}

export default function FlowMap({ flujos, height = 400 }: FlowMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showOnlyImbalanced, setShowOnlyImbalanced] = useState(false);
  
  // Filtrar flujos con coordenadas válidas
  const flujosConGeo = flujos.filter(f => 
    f.origen_lat && f.origen_lng && f.destino_lat && f.destino_lng
  );
  
  const flujosVisibles = showOnlyImbalanced 
    ? flujosConGeo.filter(f => f.ratio_desequilibrio > 1.5)
    : flujosConGeo;
  
  // Encontrar flujo más crítico para insight
  const flujoCritico = flujosConGeo.length > 0
    ? flujosConGeo.reduce((max, f) => f.ratio_desequilibrio > max.ratio_desequilibrio ? f : max)
    : null;
  
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current || flujosConGeo.length === 0) return;
      
      try {
        const token = await initializeMapboxToken();
        if (!token) {
          setMapError('No se pudo obtener el token de Mapbox');
          return;
        }
        
        mapboxgl.accessToken = token;
        
        // Calcular centro basado en todos los puntos
        const allPoints = flujosConGeo.flatMap(f => [
          { lat: f.origen_lat!, lng: f.origen_lng! },
          { lat: f.destino_lat!, lng: f.destino_lng! }
        ]);
        const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
        const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [avgLng || -99.1332, avgLat || 19.4326],
          zoom: 5,
          attributionControl: false,
        });
        
        map.current.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'top-right'
        );
        
        map.current.on('load', () => {
          setMapLoaded(true);
        });
        
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Error al inicializar el mapa');
      }
    };
    
    initMap();
    
    return () => {
      map.current?.remove();
    };
  }, []);
  
  // Dibujar flujos cuando el mapa esté listo o cambien los datos
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    const mapInstance = map.current;
    
    // Limpiar capas anteriores
    flujosConGeo.forEach((_, index) => {
      const layerId = `flow-line-${index}`;
      const sourceId = `flow-source-${index}`;
      if (mapInstance.getLayer(layerId)) mapInstance.removeLayer(layerId);
      if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
    });
    
    // Agregar nuevas líneas
    flujosVisibles.forEach((flujo, index) => {
      if (!flujo.origen_lat || !flujo.origen_lng || !flujo.destino_lat || !flujo.destino_lng) return;
      
      const start: [number, number] = [flujo.origen_lng, flujo.origen_lat];
      const end: [number, number] = [flujo.destino_lng, flujo.destino_lat];
      const curvePoints = generateBezierPoints(start, end);
      
      const sourceId = `flow-source-${index}`;
      const layerId = `flow-line-${index}`;
      
      mapInstance.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            cantidad: flujo.cantidad,
            ratio: flujo.ratio_desequilibrio,
            origen: flujo.origen,
            destino: flujo.destino,
          },
          geometry: {
            type: 'LineString',
            coordinates: curvePoints,
          },
        },
      });
      
      // Calcular grosor basado en cantidad
      const maxCantidad = Math.max(...flujosVisibles.map(f => f.cantidad), 1);
      const lineWidth = 2 + (flujo.cantidad / maxCantidad) * 6;
      
      mapInstance.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': getFlowColor(flujo.ratio_desequilibrio),
          'line-width': lineWidth,
          'line-opacity': 0.7,
        },
      });
      
      // Agregar evento de hover
      mapInstance.on('mouseenter', layerId, () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });
      
      mapInstance.on('mouseleave', layerId, () => {
        mapInstance.getCanvas().style.cursor = '';
      });
    });
    
    // Agregar popups para los flujos
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });
    
    flujosVisibles.forEach((_, index) => {
      const layerId = `flow-line-${index}`;
      
      mapInstance.on('mouseenter', layerId, (e) => {
        const properties = e.features?.[0]?.properties;
        if (!properties) return;
        
        const ratio = properties.ratio as number;
        const color = getFlowColor(ratio);
        const label = getFlowLabel(ratio);
        
        popup.setLngLat(e.lngLat).setHTML(`
          <div style="padding: 10px; min-width: 180px;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 6px; color: #1f2937;">
              ${properties.origen} → ${properties.destino}
            </div>
            <div style="font-size: 12px; color: #6b7280; space-y: 4px;">
              <div><strong>${properties.cantidad}</strong> servicios</div>
              <div style="margin-top: 4px; padding: 4px 8px; background: ${color}20; border-radius: 4px; color: ${color}; font-weight: 500;">
                ${label} (${ratio.toFixed(1)}x)
              </div>
            </div>
          </div>
        `).addTo(mapInstance);
      });
      
      mapInstance.on('mouseleave', layerId, () => {
        popup.remove();
      });
    });
    
    // Ajustar vista para mostrar todos los flujos
    if (flujosVisibles.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      flujosVisibles.forEach(f => {
        if (f.origen_lat && f.origen_lng) bounds.extend([f.origen_lng, f.origen_lat]);
        if (f.destino_lat && f.destino_lng) bounds.extend([f.destino_lng, f.destino_lat]);
      });
      mapInstance.fitBounds(bounds, { padding: 60, maxZoom: 7, duration: 500 });
    }
    
  }, [mapLoaded, flujosVisibles, showOnlyImbalanced]);
  
  if (flujosConGeo.length === 0) {
    return (
      <Card className="shadow-apple-soft">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-100">
              <ArrowRightLeft className="h-5 w-5 text-orange-600" />
            </div>
            Flujos Origen-Destino
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex flex-col items-center justify-center text-muted-foreground rounded-lg bg-muted/30"
            style={{ height }}
          >
            <AlertCircle className="h-8 w-8 mb-2 text-muted-foreground/50" />
            <p className="text-sm">Sin datos de flujos disponibles</p>
            <p className="text-xs mt-1">No hay rutas con coordenadas geocodificadas</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-apple-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-100">
              <ArrowRightLeft className="h-5 w-5 text-orange-600" />
            </div>
            Flujos Origen-Destino
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="show-imbalanced"
                checked={showOnlyImbalanced}
                onCheckedChange={setShowOnlyImbalanced}
              />
              <Label htmlFor="show-imbalanced" className="text-xs text-muted-foreground cursor-pointer">
                Solo desequilibrios
              </Label>
            </div>
            
            <Badge variant="outline" className="text-xs gap-1">
              {flujosVisibles.length} rutas
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {mapError ? (
          <div 
            className="flex flex-col items-center justify-center text-muted-foreground rounded-lg bg-muted/30"
            style={{ height }}
          >
            <AlertCircle className="h-8 w-8 mb-2 text-destructive/50" />
            <p className="text-sm">{mapError}</p>
          </div>
        ) : (
          <>
            <div 
              ref={mapContainer} 
              className="w-full rounded-lg overflow-hidden"
              style={{ height }}
            />
            
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="w-full h-full rounded-lg" />
              </div>
            )}
          </>
        )}
        
        {/* Leyenda */}
        <div className="flex items-center justify-between pt-2 border-t flex-wrap gap-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              <span>Grosor = volumen</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: FLOW_COLORS.balanced }} />
              <span className="text-xs text-muted-foreground">Balance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: FLOW_COLORS.moderate }} />
              <span className="text-xs text-muted-foreground">Moderado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: FLOW_COLORS.critical }} />
              <span className="text-xs text-muted-foreground">Empty Leg</span>
            </div>
          </div>
        </div>
        
        {/* Insight dinámico */}
        {flujoCritico && flujoCritico.ratio_desequilibrio > 2 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
            <div className="text-xs text-orange-800">
              <strong>Corredor crítico:</strong> {flujoCritico.origen} → {flujoCritico.destino} tiene{' '}
              {flujoCritico.cantidad} servicios de ida pero solo {flujoCritico.flujo_inverso} de regreso{' '}
              (ratio {flujoCritico.ratio_desequilibrio.toFixed(1)}x). Potencial oportunidad de retorno.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
