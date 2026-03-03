import React, { useState, useCallback } from 'react';
import { RouteBuilderMap } from './RouteBuilderMap';
import { RouteBuilderControls } from './RouteBuilderControls';
import { SegmentAuditor } from './SegmentAuditor';
import { useRouteCalculation } from '@/hooks/security/useRouteCalculation';
import { useSaveTruckRoute } from '@/hooks/security/useTruckRoutes';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

export const TruckRouteBuilder: React.FC = () => {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const [vehicleProfile, setVehicleProfile] = useState('TRUCK_53');
  const [maxWidth, setMaxWidth] = useState(2.6);
  const [maxWeight, setMaxWeight] = useState(40);
  const [alleyBias, setAlleyBias] = useState(-1);
  const [excludeFlags, setExcludeFlags] = useState({ unpaved: true, ferry: true, toll: false, tunnel: false });

  const { result, isCalculating, error, calculate, calculateDebounced } = useRouteCalculation();
  const saveMutation = useSaveTruckRoute();

  const buildParams = useCallback(() => {
    if (!origin || !destination) return null;
    const exclude = Object.entries(excludeFlags).filter(([, v]) => v).map(([k]) => k);
    return {
      origin, destination, waypoints,
      max_width_m: maxWidth, max_weight_tons: maxWeight,
      alley_bias: alleyBias, exclude,
    };
  }, [origin, destination, waypoints, maxWidth, maxWeight, alleyBias, excludeFlags]);

  const handleCalculate = () => {
    const params = buildParams();
    if (params) calculate(params);
  };

  const handleWaypointDrag = useCallback((index: number, coords: [number, number]) => {
    setWaypoints(prev => {
      const next = [...prev];
      next[index] = coords;
      return next;
    });
    // Debounced recalculate
    setTimeout(() => {
      const params = buildParams();
      if (params) {
        const updated = { ...params, waypoints: params.waypoints.map((w, i) => i === index ? coords : w) };
        calculateDebounced(updated);
      }
    }, 0);
  }, [buildParams, calculateDebounced]);

  const handleOriginDrag = useCallback((coords: [number, number]) => {
    setOrigin(coords);
    const params = buildParams();
    if (params) calculateDebounced({ ...params, origin: coords });
  }, [buildParams, calculateDebounced]);

  const handleDestDrag = useCallback((coords: [number, number]) => {
    setDestination(coords);
    const params = buildParams();
    if (params) calculateDebounced({ ...params, destination: coords });
  }, [buildParams, calculateDebounced]);

  const handleSave = async (name: string, status: string) => {
    if (!origin || !destination || !result) return;
    try {
      await saveMutation.mutateAsync({
        name,
        origin_lat: origin[1],
        origin_lon: origin[0],
        dest_lat: destination[1],
        dest_lon: destination[0],
        waypoints: waypoints.map((wp, i) => ({ lon: wp[0], lat: wp[1], order: i })),
        vehicle_profile: vehicleProfile,
        max_width_m: maxWidth,
        max_weight_tons: maxWeight,
        alley_bias: alleyBias,
        exclude_flags: excludeFlags,
        route_geojson: result.route_geojson,
        alt_route_geojson: result.alt_route_geojson,
        route_distance_km: result.distance_km,
        route_duration_min: result.duration_min,
        status,
      });
      toast.success(`Ruta "${name}" guardada como ${status}`);
    } catch (err: any) {
      toast.error(`Error guardando ruta: ${err.message}`);
    }
  };

  return (
    <Tabs defaultValue="builder" className="flex flex-col h-full min-h-0">
      <TabsList className="shrink-0 mx-2 mt-2 w-fit">
        <TabsTrigger value="builder" className="text-xs">🚛 Crear Ruta</TabsTrigger>
        <TabsTrigger value="auditor" className="text-xs">🔍 Auditoría Segmentos</TabsTrigger>
      </TabsList>

      <TabsContent value="builder" className="flex-1 min-h-0 mt-0">
        <div className="flex h-full min-h-0 gap-0 border rounded-lg overflow-hidden bg-background">
          {/* Sidebar */}
          <div className="w-[300px] shrink-0 border-r overflow-hidden flex flex-col">
            <div className="shrink-0 px-3 py-2 border-b bg-muted/30">
              <h3 className="text-xs font-bold">🚛 Truck Route Builder</h3>
              <p className="text-[10px] text-muted-foreground">Rutas realistas para transporte de carga</p>
            </div>
            <RouteBuilderControls
              origin={origin}
              destination={destination}
              waypoints={waypoints}
              onOriginChange={setOrigin}
              onDestinationChange={setDestination}
              onWaypointsChange={setWaypoints}
              onCalculate={handleCalculate}
              onSave={handleSave}
              isCalculating={isCalculating}
              result={result}
              error={error}
              vehicleProfile={vehicleProfile}
              onVehicleProfileChange={setVehicleProfile}
              maxWidth={maxWidth}
              onMaxWidthChange={setMaxWidth}
              maxWeight={maxWeight}
              onMaxWeightChange={setMaxWeight}
              alleyBias={alleyBias}
              onAlleyBiasChange={setAlleyBias}
              excludeFlags={excludeFlags}
              onExcludeFlagsChange={setExcludeFlags}
            />
          </div>

          {/* Map */}
          <div className="flex-1 min-w-0">
            <RouteBuilderMap
              origin={origin}
              destination={destination}
              waypoints={waypoints}
              routeGeojson={result?.route_geojson || null}
              altRouteGeojson={result?.alt_route_geojson || null}
              onOriginChange={handleOriginDrag}
              onDestinationChange={handleDestDrag}
              onWaypointChange={handleWaypointDrag}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="auditor" className="flex-1 min-h-0 mt-0">
        <div className="h-full border rounded-lg overflow-hidden bg-background">
          <SegmentAuditor />
        </div>
      </TabsContent>
    </Tabs>
  );
};
