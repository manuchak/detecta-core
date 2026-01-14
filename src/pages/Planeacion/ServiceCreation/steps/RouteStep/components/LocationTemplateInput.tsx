import { useState, useEffect, useMemo } from 'react';
import { MapPin, AlertTriangle, Check, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEstadosYCiudades } from '@/hooks/useEstadosYCiudades';
import {
  normalizeLocationText,
  formatLocation,
  findSimilarLocations,
  autoDetectState,
  STATE_CODES,
} from '@/lib/locationUtils';

interface LocationTemplateInputProps {
  initialValue?: string;
  existingLocations: string[];
  onConfirm: (formattedLocation: string) => void;
  onCancel: () => void;
  onUseExisting?: (location: string) => void;
  type: 'origen' | 'destino';
}

export function LocationTemplateInput({
  initialValue = '',
  existingLocations,
  onConfirm,
  onCancel,
  onUseExisting,
  type,
}: LocationTemplateInputProps) {
  const { estados, loading: loadingEstados } = useEstadosYCiudades();
  
  const [ciudad, setCiudad] = useState(() => normalizeLocationText(initialValue));
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>('');
  
  // Try to auto-detect state from initial value
  useEffect(() => {
    if (initialValue && !estadoSeleccionado) {
      const detected = autoDetectState(initialValue);
      if (detected) {
        // Find the estado that matches the detected code
        const matchingEstado = estados.find(e => 
          normalizeLocationText(e.codigo) === detected ||
          normalizeLocationText(e.nombre) === detected
        );
        if (matchingEstado) {
          setEstadoSeleccionado(matchingEstado.id);
        }
      }
    }
  }, [initialValue, estados, estadoSeleccionado]);

  // Handle city input changes - auto uppercase and normalize
  const handleCiudadChange = (value: string) => {
    setCiudad(normalizeLocationText(value));
  };

  // Get the formatted preview
  const formattedPreview = useMemo(() => {
    if (!ciudad || !estadoSeleccionado) return null;
    
    const estado = estados.find(e => e.id === estadoSeleccionado);
    if (!estado) return null;
    
    // Use state code if available, otherwise use full name
    const estadoCode = STATE_CODES[normalizeLocationText(estado.nombre)] || 
                       normalizeLocationText(estado.codigo) ||
                       normalizeLocationText(estado.nombre);
    
    return formatLocation(ciudad, estadoCode);
  }, [ciudad, estadoSeleccionado, estados]);

  // Find similar existing locations
  const similarLocations = useMemo(() => {
    if (!formattedPreview) return [];
    return findSimilarLocations(formattedPreview, existingLocations, 0.75);
  }, [formattedPreview, existingLocations]);

  const hasSimilar = similarLocations.length > 0;
  const isValid = ciudad.length >= 2 && estadoSeleccionado;

  const handleConfirm = () => {
    if (formattedPreview) {
      onConfirm(formattedPreview);
    }
  };

  const handleUseExisting = (location: string) => {
    onUseExisting?.(location);
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MapPin className="h-4 w-4 text-primary" />
        <span>Nuevo {type === 'origen' ? 'Origen' : 'Destino'}</span>
        <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
          Estructurado
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* City Input */}
        <div className="space-y-1.5">
          <Label htmlFor="ciudad" className="text-xs text-muted-foreground">
            Ciudad / Lugar
          </Label>
          <Input
            id="ciudad"
            value={ciudad}
            onChange={(e) => handleCiudadChange(e.target.value)}
            placeholder="Ej: LAZARO CARDENAS"
            className="uppercase font-mono text-sm"
          />
        </div>

        {/* State Select */}
        <div className="space-y-1.5">
          <Label htmlFor="estado" className="text-xs text-muted-foreground">
            Estado
          </Label>
          <Select
            value={estadoSeleccionado}
            onValueChange={setEstadoSeleccionado}
            disabled={loadingEstados}
          >
            <SelectTrigger id="estado" className="text-sm">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent className="z-[250]">
              {estados.map((estado) => (
                <SelectItem key={estado.id} value={estado.id}>
                  {estado.nombre}
                  {estado.codigo && (
                    <span className="text-muted-foreground ml-1">
                      ({estado.codigo})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview */}
      {formattedPreview && (
        <div className="flex items-center gap-2 p-2 bg-background rounded border">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Resultado:</span>
          <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
            {formattedPreview}
          </code>
        </div>
      )}

      {/* Similar locations warning */}
      {hasSimilar && (
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Ya existe un {type} similar:
              </p>
              {similarLocations.slice(0, 3).map((match) => (
                <div 
                  key={match.location}
                  className="flex items-center justify-between p-2 bg-white rounded border border-amber-200"
                >
                  <span className="text-sm font-mono">{match.location}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(match.similarity * 100)}% similar
                    </Badge>
                    {onUseExisting && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseExisting(match.location)}
                        className="text-xs h-7"
                      >
                        Usar este
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={!isValid}
          className="gap-1"
        >
          <Check className="h-3.5 w-3.5" />
          Confirmar
        </Button>
      </div>
    </div>
  );
}
