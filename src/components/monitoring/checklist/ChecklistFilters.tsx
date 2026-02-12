/**
 * Barra de filtros avanzados para checklists de monitoreo
 * Permite filtrar por fecha, rango horario y presets rápidos
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, RotateCcw } from 'lucide-react';
import { format, subDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type PresetFiltro = 'turno_actual' | 'hoy' | 'ayer' | 'esta_semana' | 'personalizado';

export interface FiltrosChecklist {
  preset: PresetFiltro;
  fechaSeleccionada?: Date;
  horaDesde?: string;
  horaHasta?: string;
}

interface ChecklistFiltersProps {
  filtros: FiltrosChecklist;
  onFiltrosChange: (filtros: FiltrosChecklist) => void;
  timeWindow: number;
}

const HORAS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0');
  return { value: `${h}:00`, label: `${h}:00` };
});

const FILTRO_DEFAULT: FiltrosChecklist = {
  preset: 'turno_actual',
  fechaSeleccionada: undefined,
  horaDesde: undefined,
  horaHasta: undefined,
};

export function ChecklistFilters({
  filtros,
  onFiltrosChange,
  timeWindow,
}: ChecklistFiltersProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handlePreset = (preset: PresetFiltro) => {
    switch (preset) {
      case 'turno_actual':
        onFiltrosChange({ ...FILTRO_DEFAULT });
        break;
      case 'hoy':
        onFiltrosChange({
          preset: 'hoy',
          fechaSeleccionada: new Date(),
          horaDesde: '00:00',
          horaHasta: '23:00',
        });
        break;
      case 'ayer':
        onFiltrosChange({
          preset: 'ayer',
          fechaSeleccionada: subDays(new Date(), 1),
          horaDesde: '00:00',
          horaHasta: '23:00',
        });
        break;
      case 'esta_semana':
        onFiltrosChange({
          preset: 'esta_semana',
          fechaSeleccionada: startOfWeek(new Date(), { weekStartsOn: 1 }),
          horaDesde: '00:00',
          horaHasta: '23:00',
        });
        break;
    }
  };

  const handleFechaChange = (date: Date | undefined) => {
    setCalendarOpen(false);
    if (!date) return;
    onFiltrosChange({
      preset: 'personalizado',
      fechaSeleccionada: date,
      horaDesde: filtros.horaDesde || '00:00',
      horaHasta: filtros.horaHasta || '23:00',
    });
  };

  const handleHoraDesde = (hora: string) => {
    onFiltrosChange({
      ...filtros,
      preset: filtros.preset === 'turno_actual' ? 'personalizado' : filtros.preset,
      horaDesde: hora,
      fechaSeleccionada: filtros.fechaSeleccionada || new Date(),
    });
  };

  const handleHoraHasta = (hora: string) => {
    onFiltrosChange({
      ...filtros,
      preset: filtros.preset === 'turno_actual' ? 'personalizado' : filtros.preset,
      horaHasta: hora,
      fechaSeleccionada: filtros.fechaSeleccionada || new Date(),
    });
  };

  const handleLimpiar = () => {
    onFiltrosChange({ ...FILTRO_DEFAULT });
  };

  const presets: { id: PresetFiltro; label: string }[] = [
    { id: 'turno_actual', label: `Turno actual (±${timeWindow}h)` },
    { id: 'hoy', label: 'Hoy completo' },
    { id: 'ayer', label: 'Ayer' },
    { id: 'esta_semana', label: 'Esta semana' },
  ];

  const isDefault = filtros.preset === 'turno_actual';

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border">
      {/* Presets rápidos */}
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((p) => (
          <Button
            key={p.id}
            variant={filtros.preset === p.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePreset(p.id)}
            className="h-7 text-xs"
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

      {/* Date picker */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 text-xs gap-1.5',
              filtros.fechaSeleccionada && filtros.preset !== 'turno_actual'
                ? 'border-primary text-primary'
                : 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {filtros.fechaSeleccionada && filtros.preset !== 'turno_actual'
              ? format(filtros.fechaSeleccionada, 'd MMM yyyy', { locale: es })
              : 'Fecha'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filtros.fechaSeleccionada}
            onSelect={handleFechaChange}
            disabled={(date) => date > new Date()}
            locale={es}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Time range selectors */}
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <Select
          value={filtros.horaDesde || ''}
          onValueChange={handleHoraDesde}
        >
          <SelectTrigger className="h-7 w-[80px] text-xs">
            <SelectValue placeholder="Desde" />
          </SelectTrigger>
          <SelectContent>
            {HORAS.map((h) => (
              <SelectItem key={h.value} value={h.value} className="text-xs">
                {h.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">-</span>
        <Select
          value={filtros.horaHasta || ''}
          onValueChange={handleHoraHasta}
        >
          <SelectTrigger className="h-7 w-[80px] text-xs">
            <SelectValue placeholder="Hasta" />
          </SelectTrigger>
          <SelectContent>
            {HORAS.map((h) => (
              <SelectItem key={h.value} value={h.value} className="text-xs">
                {h.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Limpiar */}
      {!isDefault && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLimpiar}
          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Limpiar
        </Button>
      )}

      {/* Indicador de filtro activo */}
      {!isDefault && (
        <Badge variant="secondary" className="text-xs ml-auto">
          Filtro personalizado activo
        </Badge>
      )}
    </div>
  );
}
