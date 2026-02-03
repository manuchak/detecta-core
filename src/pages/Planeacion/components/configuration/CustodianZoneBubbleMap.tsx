/**
 * CustodianZoneBubbleMap - Visualiza la distribución de custodios por zona base
 * en un mapa de burbujas interactivo
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// Card wrapper removed for compact layout
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, Info, AlertCircle, Users } from 'lucide-react';
import { initializeMapboxToken } from '@/lib/mapbox';

interface ZonaDistribucion {
  zona: string;
  cantidad: number;
  lat: number;
  lng: number;
}

interface CustodianZoneBubbleMapProps {
  estadisticasZona: [string, number][];
  height?: number | string;
}

// Coordenadas centrales de los estados de México más comunes
const COORDENADAS_ESTADOS: Record<string, { lat: number; lng: number }> = {
  'Ciudad de México': { lat: 19.4326, lng: -99.1332 },
  'CDMX': { lat: 19.4326, lng: -99.1332 },
  'Estado de México': { lat: 19.4969, lng: -99.7233 },
  'EDOMEX': { lat: 19.4969, lng: -99.7233 },
  'Jalisco': { lat: 20.6597, lng: -103.3496 },
  'Nuevo León': { lat: 25.5922, lng: -99.9962 },
  'Puebla': { lat: 19.0414, lng: -98.2063 },
  'Querétaro': { lat: 20.5888, lng: -100.3899 },
  'Guanajuato': { lat: 21.0190, lng: -101.2574 },
  'Veracruz': { lat: 19.1738, lng: -96.1342 },
  'Michoacán': { lat: 19.5665, lng: -101.7068 },
  'Hidalgo': { lat: 20.0911, lng: -98.7624 },
  'Morelos': { lat: 18.6813, lng: -99.1013 },
  'Aguascalientes': { lat: 21.8853, lng: -102.2916 },
  'San Luis Potosí': { lat: 22.1565, lng: -100.9855 },
  'Tamaulipas': { lat: 24.2669, lng: -98.8363 },
  'Chihuahua': { lat: 28.6353, lng: -106.0889 },
  'Sonora': { lat: 29.0729, lng: -110.9559 },
  'Baja California': { lat: 30.8406, lng: -115.2838 },
  'Sinaloa': { lat: 24.8091, lng: -107.3940 },
  'Yucatán': { lat: 20.9674, lng: -89.6243 },
  'Quintana Roo': { lat: 19.1817, lng: -88.4791 },
  'Oaxaca': { lat: 17.0732, lng: -96.7266 },
  'Guerrero': { lat: 17.4392, lng: -99.5451 },
  'Chiapas': { lat: 16.7569, lng: -93.1292 },
  'Tabasco': { lat: 17.8409, lng: -92.6189 },
  'Coahuila': { lat: 27.0587, lng: -101.7068 },
  'Durango': { lat: 24.0277, lng: -104.6532 },
  'Zacatecas': { lat: 22.7709, lng: -102.5832 },
  'Nayarit': { lat: 21.7514, lng: -104.8455 },
  'Colima': { lat: 19.2452, lng: -103.7241 },
  'Tlaxcala': { lat: 19.3182, lng: -98.2375 },
  'Campeche': { lat: 19.8301, lng: -90.5349 },
  'Baja California Sur': { lat: 26.0444, lng: -111.6661 },
};

// Colores para las burbujas (verde = más custodios, escala según cantidad)
const ZONE_COLORS = {
  high: 'hsl(142, 76%, 36%)',      // green-600
  medium: 'hsl(142, 70%, 45%)',    // green-500
  low: 'hsl(142, 60%, 55%)',       // green-400
  veryLow: 'hsl(142, 50%, 65%)',   // green-300
};

export function CustodianZoneBubbleMap({ estadisticasZona, height = 'calc(100vh - 280px)' }: CustodianZoneBubbleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Convertir estadísticas a zonas con coordenadas
  const zonasConGeo: ZonaDistribucion[] = estadisticasZona
    .filter(([zona]) => zona !== 'Sin asignar' && zona !== 'Por asignar')
    .map(([zona, cantidad]) => {
      const coords = COORDENADAS_ESTADOS[zona];
      return coords ? { zona, cantidad, ...coords } : null;
    })
    .filter((z): z is ZonaDistribucion => z !== null);
    
  const maxCustodios = zonasConGeo.length > 0 
    ? Math.max(...zonasConGeo.map(z => z.cantidad)) 
    : 1;
    
  const totalCustodios = estadisticasZona.reduce((sum, [, count]) => sum + count, 0);
  const sinZona = estadisticasZona.find(([zona]) => zona === 'Sin asignar' || zona === 'Por asignar')?.[1] || 0;
  
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current || zonasConGeo.length === 0) return;
      
      try {
        const token = await initializeMapboxToken();
        if (!token) {
          setMapError('No se pudo obtener el token de Mapbox');
          return;
        }
        
        mapboxgl.accessToken = token;
        
        // Calcular el centro basado en las zonas
        const avgLat = zonasConGeo.reduce((sum, z) => sum + z.lat, 0) / zonasConGeo.length;
        const avgLng = zonasConGeo.reduce((sum, z) => sum + z.lng, 0) / zonasConGeo.length;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [avgLng || -99.1332, avgLat || 19.4326],
          zoom: 4.5,
          attributionControl: false,
        });
        
        map.current.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'top-right'
        );
        
        map.current.on('load', () => {
          setMapLoaded(true);
          addBubbles();
        });
        
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Error al inicializar el mapa');
      }
    };
    
    initMap();
    
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, []);
  
  // Actualizar burbujas cuando cambien las estadísticas
  useEffect(() => {
    if (mapLoaded && map.current) {
      addBubbles();
    }
  }, [estadisticasZona, mapLoaded]);
  
  const addBubbles = () => {
    if (!map.current) return;
    
    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    zonasConGeo.forEach((zona, index) => {
      // Calcular tamaño del círculo basado en la cantidad
      const sizeRatio = zona.cantidad / maxCustodios;
      const minSize = 28;
      const maxSize = 65;
      const size = minSize + (sizeRatio * (maxSize - minSize));
      
      // Determinar color basado en el ranking
      const color = index < 2 ? ZONE_COLORS.high 
        : index < 4 ? ZONE_COLORS.medium 
        : index < 6 ? ZONE_COLORS.low 
        : ZONE_COLORS.veryLow;
      
      // Crear elemento HTML para el marcador con estructura anidada
      const markerRoot = document.createElement('div');
      markerRoot.className = 'custodian-zone-marker-root';
      markerRoot.style.cssText = `
        width: ${size}px;
        height: ${size}px;
      `;
      
      const bubble = document.createElement('div');
      bubble.className = 'custodian-zone-bubble';
      bubble.style.cssText = `
        width: 100%;
        height: 100%;
        background-color: ${color};
        opacity: 0.8;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.max(11, size / 3.5)}px;
        font-weight: 600;
        color: white;
        transition: transform 0.2s ease, opacity 0.2s ease;
      `;
      bubble.textContent = String(zona.cantidad);
      markerRoot.appendChild(bubble);
      
      // Hover effects
      bubble.addEventListener('mouseenter', () => {
        bubble.style.transform = 'scale(1.15)';
        bubble.style.opacity = '1';
        markerRoot.style.zIndex = '100';
      });
      
      bubble.addEventListener('mouseleave', () => {
        bubble.style.transform = 'scale(1)';
        bubble.style.opacity = '0.8';
        markerRoot.style.zIndex = '1';
      });
      
      // Crear popup
      const porcentaje = Math.round((zona.cantidad / totalCustodios) * 100);
      const popup = new mapboxgl.Popup({
        offset: [0, -size / 2 - 5],
        closeButton: false,
        closeOnClick: false,
        className: 'custodian-zone-popup',
      }).setHTML(`
        <div style="padding: 8px; min-width: 130px;">
          <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #1f2937;">
            ${zona.zona}
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            <div><strong>${zona.cantidad}</strong> custodios</div>
            <div>${porcentaje}% del total</div>
          </div>
        </div>
      `);
      
      bubble.addEventListener('mouseenter', () => {
        if (map.current) {
          popup.setLngLat([zona.lng, zona.lat]).addTo(map.current);
        }
      });
      
      bubble.addEventListener('mouseleave', () => {
        popup.remove();
      });

      // Click to fly to the zone
      bubble.addEventListener('click', (e) => {
        e.stopPropagation();
        map.current?.flyTo({
          center: [zona.lng, zona.lat],
          zoom: 7,
          duration: 800
        });
      });

      if (!map.current) return;
      
      const marker = new mapboxgl.Marker({ element: markerRoot })
        .setLngLat([zona.lng, zona.lat])
        .addTo(map.current);
      
      markersRef.current.push(marker);
    });
    
    // Ajustar vista para mostrar todas las burbujas
    if (zonasConGeo.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      zonasConGeo.forEach(z => {
        bounds.extend([z.lng, z.lat]);
      });
      map.current.fitBounds(bounds, { 
        padding: 40,
        maxZoom: 6,
        duration: 500
      });
    }
  };
  
  if (zonasConGeo.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Map className="h-4 w-4 text-primary" />
            Distribución por Zona
          </div>
        </div>
        <div className="p-3">
          <div 
            className="flex flex-col items-center justify-center text-muted-foreground rounded-lg bg-muted/30 min-h-[320px]"
            style={{ height }}
          >
            <AlertCircle className="h-8 w-8 mb-2 text-muted-foreground/50" />
            <p className="text-sm">Sin zonas geolocalizables</p>
            <p className="text-xs mt-1">Asigna zonas a los custodios para visualizar el mapa</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Helper function to get color based on ranking
  const getColorForIndex = (index: number) => {
    if (index < 2) return ZONE_COLORS.high;
    if (index < 4) return ZONE_COLORS.medium;
    if (index < 6) return ZONE_COLORS.low;
    return ZONE_COLORS.veryLow;
  };

  return (
    <div className="rounded-lg border bg-card">
      {/* Header compacto inline */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Map className="h-4 w-4 text-primary" />
          Distribución por Zona
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Users className="h-3 w-3" />
            {zonasConGeo.length} zonas
          </Badge>
          {sinZona > 0 && (
            <Badge variant="secondary" className="text-xs bg-warning/10 text-warning border-warning/30">
              {sinZona} sin zona
            </Badge>
          )}
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="p-3">
        {mapError ? (
          <div 
            className="flex flex-col items-center justify-center text-muted-foreground rounded-lg bg-muted/30 min-h-[320px]"
            style={{ height }}
          >
            <AlertCircle className="h-8 w-8 mb-2 text-destructive/50" />
            <p className="text-sm">{mapError}</p>
          </div>
        ) : (
          <div className="flex gap-3 min-h-[320px]" style={{ height }}>
            {/* Mapa */}
            <div className="relative flex-1">
              <div 
                ref={mapContainer} 
                className="w-full h-full rounded-lg overflow-hidden"
              />
              
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              )}
            </div>
            
            {/* Leyenda lateral compacta */}
            <div className="w-52 flex-shrink-0 rounded-lg border bg-card p-3 overflow-y-auto">
              <div className="space-y-0.5 mb-3">
                <h4 className="text-sm font-semibold text-foreground">Zonas</h4>
                <p className="text-xs text-muted-foreground">Custodios por ubicación</p>
              </div>
              
              <div className="space-y-1.5">
                {zonasConGeo.map((zona, index) => {
                  const porcentaje = Math.round((zona.cantidad / totalCustodios) * 100);
                  const color = getColorForIndex(index);
                  
                  return (
                    <div 
                      key={zona.zona}
                      className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        map.current?.flyTo({
                          center: [zona.lng, zona.lat],
                          zoom: 7,
                          duration: 800
                        });
                      }}
                    >
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {zona.cantidad}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate text-foreground">
                          {zona.zona}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {porcentaje}%
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {sinZona > 0 && (
                  <div className="flex items-center gap-2 p-1.5 rounded-md bg-warning/5 border border-warning/20">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-warning/20 text-warning text-xs font-semibold flex-shrink-0">
                      {sinZona}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-warning">Sin asignar</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((sinZona / totalCustodios) * 100)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mini leyenda de colores */}
              <div className="mt-3 pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1.5">Ranking</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS.high }} />
                    <span className="text-[10px] text-muted-foreground">Alta</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS.medium }} />
                    <span className="text-[10px] text-muted-foreground">Media</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS.low }} />
                    <span className="text-[10px] text-muted-foreground">Baja</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer compacto */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-t text-xs text-muted-foreground">
        <Info className="h-3 w-3" />
        <span>Clic en zona para centrar mapa</span>
      </div>
    </div>
  );
}
