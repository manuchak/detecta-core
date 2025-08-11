
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';

interface MapDisplayProps {
  className?: string;
  title?: string;
}

const MapDisplay = ({ className, title = "Monitoreo en Tiempo Real" }: MapDisplayProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with the provided token
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGV0ZWN0YXNlYyIsImEiOiJjbTlzdjg3ZmkwNGVoMmpwcGg3MWMwNXlhIn0.zIQ8khHoZsJt8bL4jXf35Q';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-99.1332, 19.4326], // Default to Mexico City
      zoom: 9,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add scale
    map.current.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }),
      'bottom-left'
    );

    // Sample marker (this would be replaced with real data)
    new mapboxgl.Marker({ color: '#3FB1CE' })
      .setLngLat([-99.1332, 19.4326])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setText('Vehículo 1 - En ruta')
      )
      .addTo(map.current);

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <Card className={`overflow-hidden ${className || 'h-[400px]'}`}>
      {title && (
        <div className="p-4 bg-background border-b border-border/40">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </Card>
  );
};

export default MapDisplay;
