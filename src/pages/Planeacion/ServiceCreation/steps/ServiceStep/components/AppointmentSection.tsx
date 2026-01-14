/**
 * AppointmentSection - Date/time selection with timezone awareness
 * Includes reception info (readonly) and appointment scheduling
 */

import { useMemo } from 'react';
import { Calendar, Clock, Inbox, Sparkles, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AppointmentSectionProps {
  // Reception (readonly)
  formattedRecepcion: string;
  
  // Appointment (editable)
  fecha: string;
  hora: string;
  onFechaChange: (value: string) => void;
  onHoraChange: (value: string) => void;
  
  // Validation
  minDate: string;
  isDateValid: boolean;
  formattedFecha: string;
  
  // Auto-fill indicators
  wasHoraOptimized: boolean;
  distanciaKm: number;
}

// Top 5 horarios más frecuentes basados en datos históricos de servicios_custodia
const HOUR_PRESETS = ['04:00', '05:00', '06:00', '07:00', '08:00'];

export function AppointmentSection({
  formattedRecepcion,
  fecha,
  hora,
  onFechaChange,
  onHoraChange,
  minDate,
  isDateValid,
  formattedFecha,
  wasHoraOptimized,
  distanciaKm,
}: AppointmentSectionProps) {
  
  // Quick date presets
  const datePresets = useMemo(() => [
    { label: 'Mañana', date: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: 'Pasado mañana', date: format(addDays(new Date(), 2), 'yyyy-MM-dd') },
    { label: 'En 3 días', date: format(addDays(new Date(), 3), 'yyyy-MM-dd') },
  ], []);

  return (
    <div className="space-y-6">
      {/* Reception info (readonly) */}
      <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          Solicitud Recibida
        </div>
        <p className="text-sm capitalize">{formattedRecepcion} (CDMX)</p>
      </div>

      {/* Appointment scheduling */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Programar Cita
        </h4>
        
        {/* Date selection */}
        <div className="space-y-2">
          <Label htmlFor="fecha" className="text-sm">
            Fecha <span className="text-destructive">*</span>
          </Label>
          
          {/* Display formatted date */}
          {fecha && formattedFecha && (
            <p className="text-sm font-medium capitalize text-primary">
              {formattedFecha}
            </p>
          )}
          
          <Input
            id="fecha"
            type="date"
            value={fecha}
            min={minDate}
            onChange={(e) => onFechaChange(e.target.value)}
            className={cn(
              !isDateValid && fecha && "border-destructive focus-visible:ring-destructive"
            )}
          />
          
          {/* Date presets */}
          <div className="flex flex-wrap gap-2 pt-1">
            {datePresets.map((preset) => (
              <Button
                key={preset.date}
                type="button"
                variant={fecha === preset.date ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => onFechaChange(preset.date)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          {!isDateValid && fecha && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              La fecha debe ser mañana o posterior
            </p>
          )}
        </div>

        {/* Time selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="hora" className="text-sm">
              <Clock className="h-4 w-4 inline mr-1" />
              Hora <span className="text-destructive">*</span>
            </Label>
            {wasHoraOptimized && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                Optimizada
              </Badge>
            )}
          </div>
          
          <Input
            id="hora"
            type="time"
            value={hora}
            onChange={(e) => onHoraChange(e.target.value)}
          />
          
          {/* Hour presets */}
          <div className="flex flex-wrap gap-2 pt-1">
            {HOUR_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={hora === preset ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => onHoraChange(preset)}
              >
                {preset.replace(':00', ' AM').replace('10 AM', '10 AM')}
              </Button>
            ))}
          </div>
          
          {distanciaKm > 100 && (
            <p className="text-xs text-muted-foreground">
              ↑ Sugerido: salida temprana para distancias {'>'} 100 km ({Math.round(distanciaKm)} km)
            </p>
          )}
        </div>
        
        {/* Timezone indicator */}
        <p className="text-xs text-muted-foreground border-t pt-2">
          📍 Hora del centro de México (CDMX, UTC-6)
        </p>
      </div>
    </div>
  );
}
