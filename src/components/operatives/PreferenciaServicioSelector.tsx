/**
 * PreferenciaServicioSelector - Component for selecting service type preference
 * Options: local, foraneo, indistinto
 */

import { Home, Plane, CircleDot } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type PreferenciaTipoServicio = 'local' | 'foraneo' | 'indistinto';

interface PreferenciaServicioSelectorProps {
  value: PreferenciaTipoServicio;
  onChange: (value: PreferenciaTipoServicio) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

const opciones: Array<{
  value: PreferenciaTipoServicio;
  label: string;
  description: string;
  icon: typeof Home;
  color: string;
}> = [
  {
    value: 'local',
    label: 'Solo Local',
    description: '< 100 km desde base',
    icon: Home,
    color: 'text-blue-600'
  },
  {
    value: 'foraneo',
    label: 'Solo Foráneo',
    description: '> 100 km desde base',
    icon: Plane,
    color: 'text-emerald-600'
  },
  {
    value: 'indistinto',
    label: 'Indistinto',
    description: 'Cualquier servicio',
    icon: CircleDot,
    color: 'text-muted-foreground'
  }
];

export function PreferenciaServicioSelector({
  value,
  onChange,
  disabled = false,
  compact = false,
  className
}: PreferenciaServicioSelectorProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {opciones.map((opcion) => {
          const Icon = opcion.icon;
          const isSelected = value === opcion.value;
          
          return (
            <Badge
              key={opcion.value}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all gap-1 px-2 py-1",
                isSelected && opcion.value === 'local' && "bg-blue-600 hover:bg-blue-700",
                isSelected && opcion.value === 'foraneo' && "bg-emerald-600 hover:bg-emerald-700",
                isSelected && opcion.value === 'indistinto' && "bg-muted text-muted-foreground",
                !isSelected && "hover:bg-muted/50",
                disabled && "opacity-50 pointer-events-none"
              )}
              onClick={() => !disabled && onChange(opcion.value)}
            >
              <Icon className="h-3 w-3" />
              {opcion.label}
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">Preferencia de Servicio</Label>
      
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as PreferenciaTipoServicio)}
        disabled={disabled}
        className="space-y-2"
      >
        {opciones.map((opcion) => {
          const Icon = opcion.icon;
          const isSelected = value === opcion.value;
          
          return (
            <div
              key={opcion.value}
              className={cn(
                "flex items-center space-x-3 rounded-lg border p-3 transition-all cursor-pointer",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:bg-muted/30",
                disabled && "opacity-50 pointer-events-none"
              )}
              onClick={() => !disabled && onChange(opcion.value)}
            >
              <RadioGroupItem value={opcion.value} id={`pref-${opcion.value}`} />
              <Icon className={cn("h-5 w-5", opcion.color)} />
              <div className="flex-1">
                <Label 
                  htmlFor={`pref-${opcion.value}`} 
                  className="font-medium cursor-pointer"
                >
                  {opcion.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {opcion.description}
                </p>
              </div>
            </div>
          );
        })}
      </RadioGroup>
      
      <p className="text-xs text-muted-foreground">
        Esta preferencia afecta el algoritmo de asignación. Los servicios que no coincidan
        con la preferencia mostrarán una advertencia.
      </p>
    </div>
  );
}

/**
 * Badge-only display for read-only contexts
 */
export function PreferenciaServicioBadge({ 
  value 
}: { 
  value: PreferenciaTipoServicio 
}) {
  if (value === 'indistinto') return null;
  
  const opcion = opciones.find(o => o.value === value);
  if (!opcion) return null;
  
  const Icon = opcion.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 text-xs",
        value === 'local' && "border-blue-500 text-blue-600 bg-blue-500/10",
        value === 'foraneo' && "border-emerald-500 text-emerald-600 bg-emerald-500/10"
      )}
    >
      <Icon className="h-3 w-3" />
      Pref. {opcion.label}
    </Badge>
  );
}
