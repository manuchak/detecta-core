import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCrmGeoDistribution } from '@/hooks/useCrmGeoDistribution';
import { useCrmSupplyGap } from '@/hooks/useCrmSupplyGap';
import { Map as MapIcon, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1sb3ZhYmxlIiwiYSI6ImNtNDBhMWk1eTBiNW0yaXB4OHpsZGFzdWMifQ.y3HWUPkQu7gJk5rN0Q6M5Q';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

const GAP_STATUS_CONFIG = {
  surplus: { color: 'bg-green-500', label: 'Surplus', textColor: 'text-green-600' },
  balanced: { color: 'bg-blue-500', label: 'Balanceado', textColor: 'text-blue-600' },
  deficit: { color: 'bg-amber-500', label: 'Déficit', textColor: 'text-amber-600' },
  critical: { color: 'bg-red-500', label: 'Crítico', textColor: 'text-red-600' },
};

export default function PipelineMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [showSupplyGap, setShowSupplyGap] = useState(false);
  
  const { data: geoData, isLoading: geoLoading } = useCrmGeoDistribution();
  const { data: supplyGap, isLoading: supplyLoading } = useCrmSupplyGap();

  const isLoading = geoLoading || (showSupplyGap && supplyLoading);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-102.5528, 23.6345], // Center of Mexico
      zoom: 4.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current || !geoData) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Find max value for scaling
    const maxValue = Math.max(...geoData.map(d => d.totalValue), 1);

    // Create markers for each zone
    geoData.forEach(zone => {
      const gapInfo = supplyGap?.find(g => g.zone === zone.zone);
      const gapStatus = gapInfo?.gapStatus || 'balanced';
      const config = GAP_STATUS_CONFIG[gapStatus];

      // Calculate bubble size based on value (min 30, max 80)
      const size = Math.max(30, Math.min(80, 30 + (zone.totalValue / maxValue) * 50));

      // Create marker element
      const el = document.createElement('div');
      el.className = 'pipeline-marker';
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${showSupplyGap && gapStatus === 'critical' ? 'rgba(239, 68, 68, 0.8)' : 
                      showSupplyGap && gapStatus === 'deficit' ? 'rgba(245, 158, 11, 0.8)' :
                      'rgba(59, 130, 246, 0.8)'};
        border: 3px solid ${showSupplyGap && gapStatus === 'critical' ? '#dc2626' : 
                           showSupplyGap && gapStatus === 'deficit' ? '#d97706' :
                           '#2563eb'};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      el.innerHTML = `<span style="color: white; font-size: 12px; font-weight: 600;">${zone.dealsCount}</span>`;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create popup content
      const popupContent = `
        <div style="padding: 8px; min-width: 180px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">${zone.zoneName}</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #6b7280; font-size: 12px;">Deals:</span>
            <span style="font-weight: 500; font-size: 12px;">${zone.dealsCount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #6b7280; font-size: 12px;">Valor Total:</span>
            <span style="font-weight: 500; font-size: 12px;">${formatCurrency(zone.totalValue)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #6b7280; font-size: 12px;">Ponderado:</span>
            <span style="font-weight: 500; font-size: 12px;">${formatCurrency(zone.weightedValue)}</span>
          </div>
          ${showSupplyGap && gapInfo ? `
            <div style="border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #6b7280; font-size: 12px;">Demanda Est.:</span>
                <span style="font-weight: 500; font-size: 12px;">${gapInfo.demandProjected} servicios</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #6b7280; font-size: 12px;">Supply Actual:</span>
                <span style="font-weight: 500; font-size: 12px;">${gapInfo.supplyActual} custodios</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 12px;">Gap:</span>
                <span style="font-weight: 600; font-size: 12px; color: ${gapInfo.gap >= 0 ? '#16a34a' : '#dc2626'};">
                  ${gapInfo.gap >= 0 ? '+' : ''}${gapInfo.gap}
                </span>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([zone.lng, zone.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [geoData, supplyGap, showSupplyGap]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[500px] w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Pipeline por Zona Geográfica
            </CardTitle>
            <div className="flex items-center gap-2">
              <Switch
                id="supply-gap"
                checked={showSupplyGap}
                onCheckedChange={setShowSupplyGap}
              />
              <Label htmlFor="supply-gap" className="text-sm text-muted-foreground">
                Mostrar Gap de Supply
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapContainer} 
            className="w-full h-[500px] rounded-lg overflow-hidden"
          />
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Pipeline (tamaño = valor)</span>
            </div>
            {showSupplyGap && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500" />
                  <span className="text-xs text-muted-foreground">Déficit de Supply</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">Crítico</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Zone Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(geoData || []).slice(0, 4).map(zone => {
          const gapInfo = supplyGap?.find(g => g.zone === zone.zone);
          const gapStatus = gapInfo?.gapStatus || 'balanced';
          const config = GAP_STATUS_CONFIG[gapStatus];

          return (
            <Card key={zone.zone}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{zone.zoneName}</p>
                    <p className="text-xs text-muted-foreground">{zone.dealsCount} deals</p>
                  </div>
                  {showSupplyGap && gapInfo && (
                    <Badge variant="outline" className={config.textColor}>
                      {config.label}
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-primary mb-2">
                  {formatCurrency(zone.totalValue)}
                </div>
                {showSupplyGap && gapInfo && (
                  <div className="flex items-center gap-2 text-sm">
                    {gapInfo.gap >= 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-muted-foreground">
                      {gapInfo.supplyActual} supply / {gapInfo.demandProjected} demanda
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Supply Gap Alert */}
      {showSupplyGap && supplyGap && supplyGap.some(g => g.gapStatus === 'critical' || g.gapStatus === 'deficit') && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Alerta de Capacidad</p>
                <p className="text-sm text-amber-700 mt-1">
                  Las siguientes zonas requieren expansión de supply:{' '}
                  {supplyGap
                    .filter(g => g.gapStatus === 'critical' || g.gapStatus === 'deficit')
                    .map(g => `${g.zoneName} (${Math.abs(g.gap)} custodios)`)
                    .join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
