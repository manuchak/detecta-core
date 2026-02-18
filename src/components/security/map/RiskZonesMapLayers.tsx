import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Layers, Route, MapPin, Shield, WifiOff, Type } from 'lucide-react';

export interface LayerVisibility {
  segments: boolean;
  pois: boolean;
  safePoints: boolean;
  deadZones: boolean;
  labels: boolean;
}

interface RiskZonesMapLayersProps {
  layers: LayerVisibility;
  onToggle: (layer: keyof LayerVisibility) => void;
}

const LAYER_CONFIG: { key: keyof LayerVisibility; label: string; icon: React.ElementType }[] = [
  { key: 'segments', label: 'Tramos', icon: Route },
  { key: 'pois', label: 'POIs', icon: MapPin },
  { key: 'safePoints', label: 'Puntos Seguros', icon: Shield },
  { key: 'deadZones', label: 'Sin señal', icon: WifiOff },
  { key: 'labels', label: 'Etiquetas', icon: Type },
];

export function RiskZonesMapLayers({ layers, onToggle }: RiskZonesMapLayersProps) {
  return (
    <div className="bg-background/90 border rounded-lg p-3 backdrop-blur-sm space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
        <Layers className="h-3.5 w-3.5" />
        Capas
      </div>
      {LAYER_CONFIG.map(({ key, label, icon: Icon }) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <Icon className="h-3 w-3" />
            {label}
          </Label>
          <Switch checked={layers[key]} onCheckedChange={() => onToggle(key)} className="scale-75" />
        </div>
      ))}
    </div>
  );
}
