import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Home, Plane, CircleDot, Loader2, Phone, Star, Check,
  User
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
  { value: 'San Luis Potosí', label: 'SLP' },
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
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edición Rápida
          </SheetTitle>
        </SheetHeader>

        {/* Operative Info Header */}
        <div className="p-3 rounded-lg bg-muted/50 mt-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-sm">{operative.nombre}</h3>
              {operative.telefono && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />
                  {operative.telefono}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {operative.rating_promedio !== null && operative.rating_promedio !== undefined && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  {operative.rating_promedio.toFixed(1)}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {operative.numero_servicios || 0} servicios
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabs for Zona and Preferencia */}
        <Tabs defaultValue="zona" className="flex-1 flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="zona" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Zona Base
            </TabsTrigger>
            <TabsTrigger value="preferencia" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Preferencia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="zona" className="flex-1 mt-4">
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
          </TabsContent>

          <TabsContent value="preferencia" className="flex-1 mt-4">
            <RadioGroup 
              value={selectedPreferencia} 
              onValueChange={(v) => setSelectedPreferencia(v as PreferenciaTipoServicio)}
              className="space-y-3"
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
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-4 gap-2 border-t pt-4">
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
