import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, MapPin, Truck, Save, Calculator, Loader2 } from 'lucide-react';
import { geocodeAddress } from '@/lib/mapbox';
import { RouteCalculationResult } from '@/hooks/security/useRouteCalculation';

const VEHICLE_PROFILES: Record<string, { label: string; width: number; weight: number; alley: number }> = {
  TRUCK_53: { label: 'Camión 53 pies (tractor + caja)', width: 2.6, weight: 40, alley: -1 },
  TORTON: { label: 'Torton / Rabón', width: 2.6, weight: 20, alley: -0.5 },
  SUV: { label: 'Pickup / SUV (referencia)', width: 2.1, weight: 3.5, alley: 0 },
};

interface Props {
  origin: [number, number] | null;
  destination: [number, number] | null;
  waypoints: [number, number][];
  onOriginChange: (c: [number, number]) => void;
  onDestinationChange: (c: [number, number]) => void;
  onWaypointsChange: (wps: [number, number][]) => void;
  onCalculate: () => void;
  onSave: (name: string, status: string) => void;
  isCalculating: boolean;
  result: RouteCalculationResult | null;
  error: string | null;
  vehicleProfile: string;
  onVehicleProfileChange: (p: string) => void;
  maxWidth: number;
  onMaxWidthChange: (v: number) => void;
  maxWeight: number;
  onMaxWeightChange: (v: number) => void;
  alleyBias: number;
  onAlleyBiasChange: (v: number) => void;
  excludeFlags: { unpaved: boolean; ferry: boolean; toll: boolean; tunnel: boolean };
  onExcludeFlagsChange: (f: { unpaved: boolean; ferry: boolean; toll: boolean; tunnel: boolean }) => void;
}

export const RouteBuilderControls: React.FC<Props> = ({
  origin, destination, waypoints,
  onOriginChange, onDestinationChange, onWaypointsChange,
  onCalculate, onSave, isCalculating, result, error,
  vehicleProfile, onVehicleProfileChange,
  maxWidth, onMaxWidthChange, maxWeight, onMaxWeightChange,
  alleyBias, onAlleyBiasChange,
  excludeFlags, onExcludeFlagsChange,
}) => {
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [routeName, setRouteName] = useState('');
  const [searching, setSearching] = useState<'origin' | 'dest' | null>(null);

  const handleGeocode = async (query: string, type: 'origin' | 'dest') => {
    if (!query.trim()) return;
    setSearching(type);
    const { suggestions } = await geocodeAddress(query, { limit: 1, country: 'MX' });
    if (suggestions.length > 0) {
      const [lon, lat] = suggestions[0].center;
      if (type === 'origin') onOriginChange([lon, lat]);
      else onDestinationChange([lon, lat]);
    }
    setSearching(null);
  };

  const addWaypoint = () => {
    if (!origin || !destination) return;
    const midLon = (origin[0] + destination[0]) / 2;
    const midLat = (origin[1] + destination[1]) / 2;
    onWaypointsChange([...waypoints, [midLon, midLat]]);
  };

  const removeWaypoint = (idx: number) => {
    onWaypointsChange(waypoints.filter((_, i) => i !== idx));
  };

  const handleProfileChange = (profile: string) => {
    onVehicleProfileChange(profile);
    const p = VEHICLE_PROFILES[profile];
    if (p) {
      onMaxWidthChange(p.width);
      onMaxWeightChange(p.weight);
      onAlleyBiasChange(p.alley);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto h-full text-xs">
      {/* Origin / Destination */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1"><MapPin className="h-3 w-3 text-green-600" /> Origen</Label>
        <div className="flex gap-1">
          <Input value={originSearch} onChange={e => setOriginSearch(e.target.value)} placeholder="Buscar ciudad/dirección..." className="text-xs h-7" onKeyDown={e => e.key === 'Enter' && handleGeocode(originSearch, 'origin')} />
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => handleGeocode(originSearch, 'origin')} disabled={searching === 'origin'}>
            {searching === 'origin' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Ir'}
          </Button>
        </div>
        {origin && <p className="text-[10px] text-muted-foreground">{origin[1].toFixed(4)}, {origin[0].toFixed(4)}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1"><MapPin className="h-3 w-3 text-red-600" /> Destino</Label>
        <div className="flex gap-1">
          <Input value={destSearch} onChange={e => setDestSearch(e.target.value)} placeholder="Buscar ciudad/dirección..." className="text-xs h-7" onKeyDown={e => e.key === 'Enter' && handleGeocode(destSearch, 'dest')} />
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => handleGeocode(destSearch, 'dest')} disabled={searching === 'dest'}>
            {searching === 'dest' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Ir'}
          </Button>
        </div>
        {destination && <p className="text-[10px] text-muted-foreground">{destination[1].toFixed(4)}, {destination[0].toFixed(4)}</p>}
      </div>

      {/* Waypoints */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Waypoints ({waypoints.length})</Label>
          <Button size="sm" variant="ghost" className="h-6 px-1 text-[10px]" onClick={addWaypoint} disabled={!origin || !destination}>
            <Plus className="h-3 w-3 mr-1" /> Agregar
          </Button>
        </div>
        {waypoints.map((wp, i) => (
          <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
            <span className="font-mono">{i + 1}.</span>
            <span className="flex-1 truncate">{wp[1].toFixed(3)}, {wp[0].toFixed(3)}</span>
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => removeWaypoint(i)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Vehicle Profile */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold flex items-center gap-1"><Truck className="h-3 w-3" /> Perfil Vehicular</Label>
        <Select value={vehicleProfile} onValueChange={handleProfileChange}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(VEHICLE_PROFILES).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Truck Params */}
      <div className="space-y-2 border rounded-md p-2 bg-muted/30">
        <div className="space-y-1">
          <Label className="text-[10px]">Ancho máx: {maxWidth}m</Label>
          <Slider value={[maxWidth]} onValueChange={v => onMaxWidthChange(v[0])} min={1.5} max={5} step={0.1} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Peso máx: {maxWeight}t</Label>
          <Slider value={[maxWeight]} onValueChange={v => onMaxWeightChange(v[0])} min={1} max={80} step={1} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Alley bias: {alleyBias}</Label>
          <Slider value={[alleyBias]} onValueChange={v => onAlleyBiasChange(v[0])} min={-1} max={1} step={0.1} />
        </div>
      </div>

      {/* Exclude toggles */}
      <div className="space-y-1.5 border rounded-md p-2 bg-muted/30">
        <Label className="text-[10px] font-semibold">Preferencias de ruta</Label>
        {[
          { key: 'unpaved' as const, label: 'Evitar sin pavimentar' },
          { key: 'ferry' as const, label: 'Evitar ferry' },
          { key: 'toll' as const, label: 'Evitar cuota' },
          { key: 'tunnel' as const, label: 'Evitar túneles' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-[10px]">{label}</span>
            <Switch checked={excludeFlags[key]} onCheckedChange={v => onExcludeFlagsChange({ ...excludeFlags, [key]: v })} />
          </div>
        ))}
      </div>

      {/* Actions */}
      <Button onClick={onCalculate} disabled={!origin || !destination || isCalculating} className="w-full h-8 text-xs font-bold">
        {isCalculating ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Calculando...</> : <><Calculator className="h-3 w-3 mr-1" /> CALCULAR RUTA REALISTA</>}
      </Button>

      {/* Result metrics */}
      {result && (
        <div className="rounded-md border p-2 bg-background space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Distancia:</span>
            <span className="font-bold">{result.distance_km.toLocaleString()} km</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Duración est.:</span>
            <span className="font-bold">{Math.round(result.duration_min / 60)}h {Math.round(result.duration_min % 60)}m</span>
          </div>
          {result.warnings.map((w, i) => (
            <p key={i} className="text-[10px] text-amber-600">⚠️ {w}</p>
          ))}
        </div>
      )}

      {error && <p className="text-[10px] text-destructive">❌ {error}</p>}

      {/* Save */}
      {result && (
        <div className="space-y-1">
          <Input value={routeName} onChange={e => setRouteName(e.target.value)} placeholder="Nombre de la ruta..." className="text-xs h-7" />
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px]" onClick={() => onSave(routeName || 'Sin nombre', 'DRAFT')} disabled={!routeName}>
              <Save className="h-3 w-3 mr-1" /> Guardar borrador
            </Button>
            <Button size="sm" className="flex-1 h-7 text-[10px]" onClick={() => onSave(routeName || 'Sin nombre', 'OFFICIAL')} disabled={!routeName}>
              <Save className="h-3 w-3 mr-1" /> Publicar oficial
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
