import * as React from "react";
import { CalendarIcon, Clock, Plus } from "lucide-react";
import { format, addHours, addDays, startOfTomorrow, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface DateTimePickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  minDate?: Date;
}

// Presets útiles para selección rápida
const QUICK_PRESETS = [
  {
    label: "En 1 hora",
    getValue: () => addHours(new Date(), 1),
  },
  {
    label: "En 3 horas", 
    getValue: () => addHours(new Date(), 3),
  },
  {
    label: "Mañana 9:00",
    getValue: () => {
      const tomorrow = startOfTomorrow();
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    },
  },
  {
    label: "En 3 días",
    getValue: () => {
      const threeDays = addDays(startOfDay(new Date()), 3);
      threeDays.setHours(9, 0, 0, 0);
      return threeDays;
    },
  },
  {
    label: "En una semana",
    getValue: () => {
      const oneWeek = addDays(startOfDay(new Date()), 7);
      oneWeek.setHours(9, 0, 0, 0);
      return oneWeek;
    },
  },
];

export function DateTimePicker({
  value,
  onChange,
  className,
  placeholder = "Seleccionar fecha y hora",
  label,
  required = false,
  minDate = new Date(),
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [timeValue, setTimeValue] = React.useState<string>(
    value ? format(new Date(value), "HH:mm") : "09:00"
  );

  // Actualizar cuando cambie el valor externo
  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setTimeValue(format(date, "HH:mm"));
    } else {
      setSelectedDate(undefined);
      setTimeValue("09:00");
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    
    // Combinar fecha seleccionada con hora actual
    const [hours, minutes] = timeValue.split(':');
    const newDateTime = new Date(date);
    newDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    // Formatear para datetime-local input
    onChange(format(newDateTime, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleTimeChange = (time: string) => {
    setTimeValue(time);
    
    if (selectedDate) {
      const [hours, minutes] = time.split(':');
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      // Formatear para datetime-local input
      onChange(format(newDateTime, "yyyy-MM-dd'T'HH:mm"));
    }
  };

  const handlePresetSelect = (preset: typeof QUICK_PRESETS[0]) => {
    const presetDate = preset.getValue();
    setSelectedDate(presetDate);
    setTimeValue(format(presetDate, "HH:mm"));
    onChange(format(presetDate, "yyyy-MM-dd'T'HH:mm"));
    setIsOpen(false);
  };

  const displayValue = React.useMemo(() => {
    if (!value) return null;
    
    const date = new Date(value);
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    // Formatear fecha de manera amigable
    let dateStr = format(date, "d 'de' MMMM", { locale: es });
    
    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      dateStr = "Hoy";
    } else if (format(date, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd")) {
      dateStr = "Mañana";
    }
    
    const timeStr = format(date, "HH:mm");
    return `${dateStr} a las ${timeStr}`;
  }, [value]);

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-auto min-h-[2.5rem] p-3",
              !value && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center gap-2 text-primary">
                <CalendarIcon className="h-4 w-4" />
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1">
                {displayValue || (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
              </div>
              {value && (
                <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                  {format(new Date(value), "dd/MM/yyyy HH:mm")}
                </div>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets rápidos */}
            <div className="flex flex-col border-r bg-muted/30 min-w-[140px]">
              <div className="p-3 pb-2">
                <h4 className="font-medium text-sm text-foreground">Accesos rápidos</h4>
              </div>
              <div className="flex flex-col gap-1 p-2 pt-0">
                {QUICK_PRESETS.map((preset, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs h-8 px-2"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <Plus className="h-3 w-3 mr-2 opacity-50" />
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Selector de fecha y hora */}
            <div className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < minDate}
                initialFocus
                locale={es}
                className="pointer-events-auto"
              />
              
              <Separator className="my-3" />
              
              {/* Selector de hora mejorado */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Hora</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={timeValue}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="font-mono"
                  />
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    (formato 24h)
                  </div>
                </div>
              </div>

              {selectedDate && (
                <div className="mt-3 p-2 bg-accent/50 rounded-md">
                  <div className="text-xs text-muted-foreground">Vista previa:</div>
                  <div className="text-sm font-medium">
                    {format(new Date(`${format(selectedDate, "yyyy-MM-dd")}T${timeValue}`), 
                      "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", 
                      { locale: es }
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}