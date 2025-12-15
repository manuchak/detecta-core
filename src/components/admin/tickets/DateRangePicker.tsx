import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const presets = [
    {
      label: 'Esta semana',
      getValue: () => ({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: new Date()
      })
    },
    {
      label: 'Este mes',
      getValue: () => ({
        start: startOfMonth(new Date()),
        end: new Date()
      })
    },
    {
      label: 'Mes anterior',
      getValue: () => ({
        start: startOfMonth(subMonths(new Date(), 1)),
        end: endOfMonth(subMonths(new Date(), 1))
      })
    },
    {
      label: 'Últimos 3 meses',
      getValue: () => ({
        start: startOfMonth(subMonths(new Date(), 2)),
        end: new Date()
      })
    }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          {format(value.start, 'd MMM', { locale: es })} - {format(value.end, 'd MMM yyyy', { locale: es })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onChange(preset.getValue())}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
