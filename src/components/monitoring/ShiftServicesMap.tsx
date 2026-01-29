import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { initializeMapboxToken } from '@/lib/mapbox';
import { ServicioTurno, COLORES_ESTADO, EstadoVisual } from '@/hooks/useServiciosTurno';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ShiftServicesMapProps {
  servicios: ServicioTurno[];
  className?: string;
  onServiceClick?: (servicio: ServicioTurno) => void;
  selectedServiceId?: string | null;
  filterEstado?: EstadoVisual | null;
}

// SVG icons for markers
const MARKER_ICONS: Record<EstadoVisual, string> = {
  en_sitio: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  proximo: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  asignado: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  sin_asignar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`
};

const ShiftServicesMap = ({ 
  servicios, 
  className, 
  onServiceClick,
  selectedServiceId,
  filterEstado
}: ShiftServicesMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Create marker element
  const createMarkerElement = useCallback((servicio: ServicioTurno, isSelected: boolean) => {
    const config = COLORES_ESTADO[servicio.estadoVisual];
    const isFiltered = filterEstado && filterEstado !== servicio.estadoVisual;
    
    const el = document.createElement('div');
    el.className = 'shift-marker';
    el.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: white;
      border: 3px solid ${config.border};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ${isFiltered ? 'opacity: 0.3;' : ''}
      ${isSelected ? 'transform: scale(1.3); z-index: 100;' : ''}
      ${servicio.estadoVisual === 'en_sitio' ? 'animation: pulse-ring 2s infinite;' : ''}
    `;
    
    const iconWrapper = document.createElement('div');
    iconWrapper.style.cssText = `color: ${config.primary};`;
    iconWrapper.innerHTML = MARKER_ICONS[servicio.estadoVisual];
    el.appendChild(iconWrapper);
    
    // Hover effects
    el.addEventListener('mouseenter', () => {
      if (!isFiltered) {
        el.style.transform = isSelected ? 'scale(1.4)' : 'scale(1.15)';
      }
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = isSelected ? 'scale(1.3)' : 'scale(1)';
    });
    
    return el;
  }, [filterEstado]);

  // Create popup content
  const createPopupContent = useCallback((servicio: ServicioTurno) => {
    const config = COLORES_ESTADO[servicio.estadoVisual];
    const horaCita = servicio.fecha_hora_cita 
      ? format(new Date(servicio.fecha_hora_cita), "HH:mm", { locale: es })
      : '--:--';
    
    return `
      <div style="min-width: 200px; font-family: system-ui, sans-serif;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            background: ${config.bg};
            color: ${config.primary};
          ">${config.label}</span>
          <span style="font-size: 12px; color: #666;">${horaCita}</span>
        </div>
        <p style="font-weight: 600; margin: 0 0 4px 0; font-size: 14px;">
          ${servicio.nombre_cliente || 'Sin cliente'}
        </p>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
          📍 ${servicio.origen || 'Origen no especificado'}
        </p>
        <p style="margin: 0; font-size: 12px; color: #666;">
          🎯 ${servicio.destino || 'Destino no especificado'}
        </p>
        ${servicio.custodio_asignado ? `
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #333;">
            👤 ${servicio.custodio_asignado}
          </p>
        ` : `
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #ef4444; font-weight: 500;">
            ⚠️ Sin custodio asignado
          </p>
        `}
      </div>
    `;
  }, []);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current || map.current) return;

      const token = await initializeMapboxToken();
      if (!token) {
        console.error('No se pudo obtener el token de Mapbox');
        return;
      }

      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-99.1332, 19.4326], // CDMX
        zoom: 5,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Add CSS for pulse animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `;
      document.head.appendChild(style);
    };

    initMap();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when services change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create popup instance
    if (!popupRef.current) {
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 25
      });
    }

    // Add markers for services with coordinates
    const serviciosConCoords = servicios.filter(s => s.lat && s.lng);
    
    serviciosConCoords.forEach(servicio => {
      if (!servicio.lat || !servicio.lng) return;
      
      const isSelected = servicio.id === selectedServiceId;
      const el = createMarkerElement(servicio, isSelected);
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([servicio.lng, servicio.lat])
        .addTo(map.current!);

      // Hover popup
      el.addEventListener('mouseenter', () => {
        popupRef.current!
          .setLngLat([servicio.lng!, servicio.lat!])
          .setHTML(createPopupContent(servicio))
          .addTo(map.current!);
      });

      el.addEventListener('mouseleave', () => {
        popupRef.current!.remove();
      });

      // Click handler
      el.addEventListener('click', () => {
        onServiceClick?.(servicio);
        map.current?.flyTo({
          center: [servicio.lng!, servicio.lat!],
          zoom: 10,
          duration: 1000
        });
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have services
    if (serviciosConCoords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      serviciosConCoords.forEach(s => {
        if (s.lat && s.lng) bounds.extend([s.lng, s.lat]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 10,
        duration: 1000
      });
    }
  }, [servicios, selectedServiceId, filterEstado, createMarkerElement, createPopupContent, onServiceClick]);

  // Fly to selected service
  useEffect(() => {
    if (!map.current || !selectedServiceId) return;
    
    const servicio = servicios.find(s => s.id === selectedServiceId);
    if (servicio?.lat && servicio?.lng) {
      map.current.flyTo({
        center: [servicio.lng, servicio.lat],
        zoom: 12,
        duration: 1000
      });
    }
  }, [selectedServiceId, servicios]);

  return (
    <Card className={`overflow-hidden ${className || 'h-[400px]'}`}>
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(COLORES_ESTADO).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full border-2"
                style={{ 
                  borderColor: config.border,
                  backgroundColor: key === 'en_sitio' ? config.bg : 'white'
                }}
              />
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div ref={mapContainer} className="w-full h-full" />
    </Card>
  );
};

export default ShiftServicesMap;
