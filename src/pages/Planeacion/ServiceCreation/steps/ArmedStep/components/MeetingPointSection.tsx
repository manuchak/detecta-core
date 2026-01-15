import { memo, useState, useCallback, useEffect } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SmartLocationDropdown } from '@/components/ui/smart-location-dropdown';

interface MeetingPointSectionProps {
  puntoEncuentro: string;
  horaEncuentro: string;
  horaCita?: string;
  armadoInternoId?: string;
  proveedorId?: string;
  onPuntoEncuentroChange: (value: string) => void;
  onHoraEncuentroChange: (value: string) => void;
}

/**
 * MeetingPointSection - Memoized component for meeting point input
 * Isolated to prevent re-renders of the parent ArmedStep when typing
 * Uses SmartLocationDropdown with 1.2s debounce for optimized performance
 */
export const MeetingPointSection = memo(function MeetingPointSection({
  puntoEncuentro,
  horaEncuentro,
  horaCita,
  armadoInternoId,
  proveedorId,
  onPuntoEncuentroChange,
  onHoraEncuentroChange
}: MeetingPointSectionProps) {
  // Local state for location to isolate re-renders
  const [localPunto, setLocalPunto] = useState(puntoEncuentro);

  // Sync external changes (e.g., form reset)
  useEffect(() => {
    if (puntoEncuentro !== localPunto) {
      setLocalPunto(puntoEncuentro);
    }
  }, [puntoEncuentro]);

  // Handle location selection from SmartLocationDropdown
  const handleLocationChange = useCallback((value: string) => {
    setLocalPunto(value);
    onPuntoEncuentroChange(value);
  }, [onPuntoEncuentroChange]);

  return (
    <div className="space-y-4 p-4 rounded-lg bg-muted/30 border animate-in fade-in-50">
      <h4 className="font-medium flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        Punto de Encuentro
      </h4>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {/* SmartLocationDropdown with debounce and autocomplete */}
        <SmartLocationDropdown
          value={localPunto}
          onChange={handleLocationChange}
          label="Ubicación"
          placeholder="Buscar punto de encuentro..."
          armadoInternoId={armadoInternoId}
          proveedorId={proveedorId}
          tipoArmado={armadoInternoId ? 'interno' : 'proveedor'}
        />

        <div className="space-y-2">
          <Label htmlFor="horaEncuentro" className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Hora de Encuentro
          </Label>
          <Input
            id="horaEncuentro"
            type="time"
            value={horaEncuentro}
            onChange={(e) => onHoraEncuentroChange(e.target.value)}
          />
          {horaCita && (
            <p className="text-xs text-muted-foreground">
              Sugerido: 30 min antes de la cita ({horaCita})
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
