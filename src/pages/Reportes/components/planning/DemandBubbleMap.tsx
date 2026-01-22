import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, Info, AlertCircle } from 'lucide-react';
import { initializeMapboxToken } from '@/lib/mapbox';
import type { ZonaDemanda } from '../../types/planningResources';

interface DemandBubbleMapProps {
  zonas: ZonaDemanda[];
  height?: number;
}

// Escala de colores para la demanda (de menor a mayor)
const DEMAND_COLORS = {
  low: '#60a5fa',    // blue-400
  medium: '#3b82f6', // blue-500
  high: '#1d4ed8',   // blue-700
  veryHigh: '#1e3a8a', // blue-900
};

export default function DemandBubbleMap({ zonas, height = 350 }: DemandBubbleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Filtrar zonas con coordenadas válidas
  const zonasConGeo = zonas.filter(z => z.lat && z.lng);
  const maxServicios = zonasConGeo.length > 0 
    ? Math.max(...zonasConGeo.map(z => z.cantidad_servicios)) 
    : 1;
  
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
        const avgLat = zonasConGeo.reduce((sum, z) => sum + (z.lat || 0), 0) / zonasConGeo.length;
        const avgLng = zonasConGeo.reduce((sum, z) => sum + (z.lng || 0), 0) / zonasConGeo.length;
        
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
      popupRef.current?.remove();
      map.current?.remove();
    };
  }, []);
  
  // Actualizar burbujas cuando cambien las zonas
  useEffect(() => {
    if (mapLoaded && map.current) {
      addBubbles();
    }
  }, [zonas, mapLoaded]);
  
  const addBubbles = () => {
    if (!map.current) return;
    
    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    zonasConGeo.forEach((zona, index) => {
      if (!zona.lat || !zona.lng) return;
      
      // Calcular tamaño del círculo basado en la cantidad de servicios
      const sizeRatio = zona.cantidad_servicios / maxServicios;
      const minSize = 20;
      const maxSize = 60;
      const size = minSize + (sizeRatio * (maxSize - minSize));
      
      // Determinar color basado en el ranking
      const color = index < 3 ? DEMAND_COLORS.veryHigh 
        : index < 5 ? DEMAND_COLORS.high 
        : index < 10 ? DEMAND_COLORS.medium 
        : DEMAND_COLORS.low;
      
      // Crear elemento HTML para el marcador
      const el = document.createElement('div');
      el.className = 'demand-bubble';
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        opacity: 0.75;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.max(10, size / 4)}px;
        font-weight: bold;
        color: white;
        transition: transform 0.2s, opacity 0.2s;
      `;
      el.textContent = String(zona.cantidad_servicios);
      
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.15)';
        el.style.opacity = '1';
        el.style.zIndex = '100';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.opacity = '0.75';
        el.style.zIndex = '1';
      });
      
      // Crear popup
      const popup = new mapboxgl.Popup({
        offset: [0, -size / 2 - 5],
        closeButton: false,
        closeOnClick: false,
        className: 'demand-popup',
      }).setHTML(`
        <div style="padding: 8px; min-width: 150px;">
          <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #1f2937;">
            #${index + 1} ${zona.origen}
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            <div><strong>${zona.cantidad_servicios}</strong> servicios</div>
            <div>${zona.porcentaje}% del total</div>
            ${zona.estado ? `<div style="margin-top: 4px; font-size: 11px;">${zona.estado}</div>` : ''}
          </div>
        </div>
      `);
      
      el.addEventListener('mouseenter', () => {
        popup.addTo(map.current!);
      });
      
      el.addEventListener('mouseleave', () => {
        popup.remove();
      });
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([zona.lng, zona.lat])
        .setPopup(popup)
        .addTo(map.current!);
      
      markersRef.current.push(marker);
    });
    
    // Ajustar vista para mostrar todas las burbujas
    if (zonasConGeo.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      zonasConGeo.forEach(z => {
        if (z.lat && z.lng) {
          bounds.extend([z.lng, z.lat]);
        }
      });
      map.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 7,
        duration: 500
      });
    }
  };
  
  if (zonasConGeo.length === 0) {
    return (
      <Card className="shadow-apple-soft">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Map className="h-5 w-5 text-primary" />
            </div>
            Mapa de Demanda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex flex-col items-center justify-center text-muted-foreground rounded-lg bg-muted/30"
            style={{ height }}
          >
            <AlertCircle className="h-8 w-8 mb-2 text-muted-foreground/50" />
            <p className="text-sm">Sin datos geográficos disponibles</p>
            <p className="text-xs mt-1">Las zonas de origen no pudieron ser geocodificadas</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-apple-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Map className="h-5 w-5 text-primary" />
            </div>
            Mapa de Demanda
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {zonasConGeo.length} geolocalizadas
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
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              <span>Tamaño = volumen de servicios</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Demanda:</span>
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: DEMAND_COLORS.low }} 
                title="Baja"
              />
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: DEMAND_COLORS.medium }} 
                title="Media"
              />
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: DEMAND_COLORS.high }} 
                title="Alta"
              />
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: DEMAND_COLORS.veryHigh }} 
                title="Muy Alta"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
