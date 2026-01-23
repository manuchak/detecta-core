import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Truck, 
  Ticket, 
  Banknote, 
  StickyNote, 
  RefreshCw,
  CalendarIcon,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TimelineEventType } from '../../../hooks/useProfileTimeline';
import { cn } from '@/lib/utils';

interface TimelineFiltersProps {
  selectedTypes: TimelineEventType[];
  onTypesChange: (types: TimelineEventType[]) => void;
  dateRange: { from?: Date; to?: Date };
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  periodo: string;
  onPeriodoChange: (periodo: string) => void;
}

const FILTER_OPTIONS: { 
  value: TimelineEventType[]; 
  label: string; 
  icon: any;
  available: boolean;
}[] = [
  { 
    value: ['servicio_completado', 'servicio_asignado', 'servicio_confirmado', 'servicio_rechazado', 'servicio_cancelado'], 
    label: 'Servicios', 
    icon: Truck,
    available: true
  },
  { 
    value: ['ticket_creado', 'ticket_resuelto'], 
    label: 'Tickets', 
    icon: Ticket,
    available: true
  },
  { 
    value: ['adelanto'], 
    label: 'Adelantos', 
    icon: Banknote,
    available: false // Pendiente
  },
  { 
    value: ['nota'], 
    label: 'Notas', 
    icon: StickyNote,
    available: false // Pendiente
  },
  { 
    value: ['estado_cambio'], 
    label: 'Estados', 
    icon: RefreshCw,
    available: false // Pendiente
  },
];

const PERIODO_OPTIONS = [
  { value: '7d', label: 'Última semana' },
  { value: '30d', label: 'Último mes' },
  { value: '90d', label: 'Últimos 3 meses' },
  { value: '180d', label: 'Últimos 6 meses' },
  { value: '365d', label: 'Último año' },
  { value: 'all', label: 'Todo el historial' },
  { value: 'custom', label: 'Personalizado' },
];

export function TimelineFilters({
  selectedTypes,
  onTypesChange,
  dateRange,
  onDateRangeChange,
  periodo,
  onPeriodoChange
}: TimelineFiltersProps) {
  const toggleFilter = (types: TimelineEventType[], available: boolean) => {
    if (!available) return;
    
    const allIncluded = types.every(t => selectedTypes.includes(t));
    
    if (allIncluded) {
      // Remove these types
      onTypesChange(selectedTypes.filter(t => !types.includes(t)));
    } else {
      // Add these types
      const newTypes = [...new Set([...selectedTypes, ...types])];
      onTypesChange(newTypes);
    }
  };

  const isFilterActive = (types: TimelineEventType[]) => {
    return types.every(t => selectedTypes.includes(t));
  };

  const clearFilters = () => {
    onTypesChange([]);
    onPeriodoChange('180d');
    onDateRangeChange({});
  };

  return (
    <div className="space-y-4">
      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = isFilterActive(option.value);
          
          return (
            <Button
              key={option.label}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter(option.value, option.available)}
              disabled={!option.available}
              className={cn(
                "gap-2",
                !option.available && "opacity-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {option.label}
              {!option.available && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  Pendiente
                </Badge>
              )}
            </Button>
          );
        })}
        
        {selectedTypes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={periodo} onValueChange={onPeriodoChange}>
          <SelectTrigger className="w-[180px]">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            {PERIODO_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {periodo === 'custom' && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {dateRange.from 
                    ? format(dateRange.from, "d MMM yyyy", { locale: es })
                    : "Desde"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => onDateRangeChange({ ...dateRange, from: date })}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">→</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {dateRange.to 
                    ? format(dateRange.to, "d MMM yyyy", { locale: es })
                    : "Hasta"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => onDateRangeChange({ ...dateRange, to: date })}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}
