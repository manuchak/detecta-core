import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Home, Plane, CircleDot, Loader2, Phone, Star, Check,
  User, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PreferenciaTipoServicio = 'local' | 'foraneo' | 'indistinto';

export interface OperativeData {
  id: string;
  nombre: string;
  telefono?: string | null;
  zona_base?: string | null;
  preferencia_tipo_servicio?: PreferenciaTipoServicio | null;
  numero_servicios?: number;
  rating_promedio?: number | null;
  nivel_actividad?: string;
}

interface QuickEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operative: OperativeData | null;
  onSave: (id: string, zona: string, preferencia: PreferenciaTipoServicio) => Promise<void>;
  isLoading?: boolean;
}

const ZONAS_DISPONIBLES = [
  { value: 'Ciudad de México', label: 'CDMX' },
  { value: 'Estado de México', label: 'EDOMEX' },
  { value: 'Jalisco', label: 'Jalisco' },
  { value: 'Nuevo León', label: 'Nuevo León' },
  { value: 'Puebla', label: 'Puebla' },
  { value: 'Querétaro', label: 'Querétaro' },
  { value: 'Guanajuato', label: 'Guanajuato' },
  { value: 'Michoacán', label: 'Michoacán' },
  { value: 'Veracruz', label: 'Veracruz' },
  { value: 'Chihuahua', label: 'Chihuahua' },
  { value: 'Sonora', label: 'Sonora' },
  { value: 'Sinaloa', label: 'Sinaloa' },
  { value: 'Tamaulipas', label: 'Tamaulipas' },
  { value: 'Coahuila', label: 'Coahuila' },
  { value: 'Baja California', label: 'Baja California' },
  { value: 'Aguascalientes', label: 'Aguascalientes' },
  { value: 'Hidalgo', label: 'Hidalgo' },
  { value: 'Morelos', label: 'Morelos' },
  { value: 'Tlaxcala', label: 'Tlaxcala' },
  { value: 'San Luis Potosí', label: 'San Luis Potosí' },
];

const PREFERENCIA_OPTIONS: { value: PreferenciaTipoServicio; label: string; icon: typeof Home; description: string }[] = [
  { value: 'local', label: 'Local', icon: Home, description: 'Prefiere servicios cercanos a su zona' },
  { value: 'foraneo', label: 'Foráneo', icon: Plane, description: 'Prefiere servicios fuera de su zona' },
  { value: 'indistinto', label: 'Indistinto', icon: CircleDot, description: 'Sin preferencia específica' },
];

export function QuickEditSheet({ 
  open, 
  onOpenChange, 
  operative, 
  onSave,
  isLoading = false 
}: QuickEditSheetProps) {
  const [selectedZona, setSelectedZona] = useState<string>('');
  const [selectedPreferencia, setSelectedPreferencia] = useState<PreferenciaTipoServicio>('indistinto');

  // Sync state when operative changes
  useEffect(() => {
    if (operative) {
      setSelectedZona(operative.zona_base || '');
      setSelectedPreferencia(operative.preferencia_tipo_servicio || 'indistinto');
    }
  }, [operative]);

  const handleSave = async () => {
    if (!operative) return;
    await onSave(operative.id, selectedZona, selectedPreferencia);
    onOpenChange(false);
  };

  const hasChanges = operative && (
    selectedZona !== (operative.zona_base || '') ||
    selectedPreferencia !== (operative.preferencia_tipo_servicio || 'indistinto')
  );

  if (!operative) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edición Rápida
          </SheetTitle>
          <SheetDescription>
            Modificar zona y preferencia del operativo
          </SheetDescription>
        </SheetHeader>

        {/* Operative Info Header */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{operative.nombre}</h3>
              {operative.telefono && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {operative.telefono}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {operative.rating_promedio !== null && operative.rating_promedio !== undefined && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  {operative.rating_promedio.toFixed(1)}
                </Badge>
              )}
              <Badge variant="outline">
                {operative.numero_servicios || 0} servicios
              </Badge>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-320px)] mt-4 pr-4">
          {/* Zona Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Zona Base
            </Label>
            <RadioGroup 
              value={selectedZona} 
              onValueChange={setSelectedZona}
              className="grid grid-cols-2 gap-2"
            >
              {ZONAS_DISPONIBLES.map((zona) => (
                <div key={zona.value}>
                  <RadioGroupItem
                    value={zona.value}
                    id={`zona-${zona.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`zona-${zona.value}`}
                    className={cn(
                      "flex items-center justify-between rounded-md border-2 border-muted bg-popover p-3 cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground transition-colors",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                      "[&:has([data-state=checked])]:border-primary"
                    )}
                  >
                    <span className="text-sm">{zona.label}</span>
                    {selectedZona === zona.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator className="my-6" />

          {/* Preferencia Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Preferencia de Servicio
            </Label>
            <RadioGroup 
              value={selectedPreferencia} 
              onValueChange={(v) => setSelectedPreferencia(v as PreferenciaTipoServicio)}
              className="space-y-2"
            >
              {PREFERENCIA_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.value}>
                    <RadioGroupItem
                      value={option.value}
                      id={`pref-${option.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`pref-${option.value}`}
                      className={cn(
                        "flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-4 cursor-pointer",
                        "hover:bg-accent hover:text-accent-foreground transition-colors",
                        "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                        "[&:has([data-state=checked])]:border-primary"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      {selectedPreferencia === option.value && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        </ScrollArea>

        <SheetFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
