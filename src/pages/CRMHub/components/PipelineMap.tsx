import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCrmGeoDistribution } from '@/hooks/useCrmGeoDistribution';
import { useCrmSupplyGap } from '@/hooks/useCrmSupplyGap';
import { CRMHeroCard, type HealthStatus } from './CRMHeroCard';
import { Map as MapIcon, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1sb3ZhYmxlIiwiYSI6ImNtNDBhMWk1eTBiNW0yaXB4OHpsZGFzdWMifQ.y3HWUPkQu7gJk5rN0Q6M5Q';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

const GAP_STATUS_CONFIG = {
  surplus: { color: 'bg-green-500', label: 'OK', textColor: 'text-green-600', borderColor: 'border-green-200' },
  balanced: { color: 'bg-blue-500', label: 'OK', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
  deficit: { color: 'bg-amber-500', label: 'Déficit', textColor: 'text-amber-600', borderColor: 'border-amber-200' },
  critical: { color: 'bg-red-500', label: 'Crítico', textColor: 'text-red-600', borderColor: 'border-red-200' },
};

export default function PipelineMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const { data: geoData, isLoading: geoLoading } = useCrmGeoDistribution();
  const { data: supplyGap, isLoading: supplyLoading } = useCrmSupplyGap();

  const isLoading = geoLoading || supplyLoading;

  // Calculate key metrics
  const metrics = {
    totalZones: geoData?.length || 0,
    zonesWithDeficit: supplyGap?.filter(g => g.gapStatus === 'deficit' || g.gapStatus === 'critical').length || 0,
    totalPipeline: geoData?.reduce((sum, z) => sum + z.totalValue, 0) || 0,
    totalDeficitValue: supplyGap?.filter(g => g.gapStatus === 'deficit' || g.gapStatus === 'critical')
      .reduce((sum, g) => {
        const zone = geoData?.find(z => z.zone === g.zone);
        return sum + (zone?.totalValue || 0);
      }, 0) || 0,
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-102.5528, 23.6345],
      zoom: 4.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers - supply gap enabled by default
  useEffect(() => {
    if (!map.current || !geoData) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const maxValue = Math.max(...geoData.map(d => d.totalValue), 1);

    geoData.forEach(zone => {
      const gapInfo = supplyGap?.find(g => g.zone === zone.zone);
      const gapStatus = gapInfo?.gapStatus || 'balanced';
      const config = GAP_STATUS_CONFIG[gapStatus];

      const size = Math.max(40, Math.min(80, 40 + (zone.totalValue / maxValue) * 40));

      // Marker element with zone label
      const el = document.createElement('div');
      el.className = 'pipeline-marker';
      el.style.cssText = `
        position: relative;
        width: ${size}px;
        height: ${size}px;
      `;

      // Bubble
      const bubble = document.createElement('div');
      bubble.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: ${gapStatus === 'critical' ? 'rgba(239, 68, 68, 0.85)' : 
                      gapStatus === 'deficit' ? 'rgba(245, 158, 11, 0.85)' :
                      'rgba(59, 130, 246, 0.85)'};
        border: 3px solid ${gapStatus === 'critical' ? '#dc2626' : 
                           gapStatus === 'deficit' ? '#d97706' :
                           '#2563eb'};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      `;
      bubble.innerHTML = `<span style="color: white; font-size: 11px; font-weight: 700;">${zone.dealsCount}</span>`;

      // Zone label below bubble
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        text-shadow: 0 1px 2px rgba(255,255,255,0.8);
      `;
      label.textContent = zone.zoneName;

      el.appendChild(bubble);
      el.appendChild(label);

      bubble.addEventListener('mouseenter', () => {
        bubble.style.transform = 'scale(1.15)';
      });
      bubble.addEventListener('mouseleave', () => {
        bubble.style.transform = 'scale(1)';
      });

      const popupContent = `
        <div style="padding: 12px; min-width: 200px;">
          <div style="font-weight: 700; font-size: 15px; margin-bottom: 10px; color: #111827;">${zone.zoneName}</div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #6b7280; font-size: 12px;">Pipeline:</span>
            <span style="font-weight: 600; font-size: 13px; color: #2563eb;">${formatCurrency(zone.totalValue)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #6b7280; font-size: 12px;">Deals:</span>
            <span style="font-weight: 500; font-size: 12px;">${zone.dealsCount}</span>
          </div>
          
          ${gapInfo ? `
            <div style="border-top: 1px solid #e5e7eb; margin-top: 10px; padding-top: 10px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #6b7280; font-size: 12px;">Demanda Est.:</span>
                <span style="font-weight: 500; font-size: 12px;">${gapInfo.demandProjected} servicios</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #6b7280; font-size: 12px;">Supply:</span>
                <span style="font-weight: 500; font-size: 12px;">${gapInfo.supplyActual} custodios</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 12px;">Gap:</span>
                <span style="font-weight: 700; font-size: 13px; color: ${gapInfo.gap >= 0 ? '#16a34a' : '#dc2626'}; padding: 2px 8px; border-radius: 4px; background: ${gapInfo.gap >= 0 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)'};">
                  ${gapInfo.gap >= 0 ? '+' : ''}${gapInfo.gap}
                </span>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: [0, -size/2 - 5] }).setHTML(popupContent);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([zone.lng, zone.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [geoData, supplyGap]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  // Health status based on zones with deficit
  const health: HealthStatus = metrics.zonesWithDeficit === 0 ? 'healthy'
    : metrics.zonesWithDeficit <= 2 ? 'warning'
    : 'critical';

  // Priority zones (sorted by gap severity)
  const priorityZones = (supplyGap || [])
    .filter(g => g.gapStatus === 'critical' || g.gapStatus === 'deficit')
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <CRMHeroCard
        title="¿Dónde necesitamos crecer capacidad?"
        value={`${metrics.zonesWithDeficit} zona${metrics.zonesWithDeficit !== 1 ? 's' : ''} con déficit`}
        subtitle={`${formatCurrency(metrics.totalDeficitValue)} en pipeline sin cobertura suficiente`}
        health={health}
        secondaryMetrics={[
          { label: 'Total pipeline', value: formatCurrency(metrics.totalPipeline) },
          { label: 'Zonas activas', value: String(metrics.totalZones) },
        ]}
        icon={<MapIcon className="h-8 w-8 text-muted-foreground/20" />}
      />

      {/* Priority Zones Alert */}
      {priorityZones.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                <TrendingDown className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900 mb-2">
                  Zonas que requieren expansión (ordenadas por urgencia)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {priorityZones.map((zone, index) => {
                    const zoneData = geoData?.find(z => z.zone === zone.zone);
                    return (
                      <div 
                        key={zone.zone}
                        className="flex items-center justify-between p-2 bg-background rounded-md border"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 w-5 h-5 rounded-full flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-medium text-sm">{zone.zoneName}</span>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                            {Math.abs(zone.gap)} custodios
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatCurrency(zoneData?.totalValue || 0)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapIcon className="h-4 w-4" />
            Pipeline por Zona Geográfica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapContainer} 
            className="w-full h-[400px] rounded-lg overflow-hidden"
          />
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Supply OK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Déficit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Crítico</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>Tamaño = valor pipeline</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(geoData || []).slice(0, 4).map(zone => {
          const gapInfo = supplyGap?.find(g => g.zone === zone.zone);
          const gapStatus = gapInfo?.gapStatus || 'balanced';
          const config = GAP_STATUS_CONFIG[gapStatus];

          return (
            <Card key={zone.zone} className={`border-l-4 ${config.borderColor}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{zone.zoneName}</p>
                  {gapInfo && (gapStatus === 'deficit' || gapStatus === 'critical') && (
                    <AlertTriangle className={`h-4 w-4 ${config.textColor}`} />
                  )}
                  {gapInfo && gapStatus === 'surplus' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(zone.totalValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {zone.dealsCount} deals
                </p>
                {gapInfo && (
                  <p className={`text-xs font-medium mt-1 ${config.textColor}`}>
                    {gapInfo.supplyActual} supply / {gapInfo.demandProjected} demanda
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
