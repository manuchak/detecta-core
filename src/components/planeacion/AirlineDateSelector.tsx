import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AirlineDateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function AirlineDateSelector({ selectedDate, onDateChange }: AirlineDateSelectorProps) {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);

  const formatDateChip = (date: Date) => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'EEE d MMM', { locale: es });
  };

  const isSelected = (date: Date) => 
    format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

  const getChipClass = (date: Date) => cn(
    "date-chip",
    isSelected(date) ? "date-chip-selected" : "date-chip-default"
  );

  return (
    <div className="flex items-center gap-2">
      {/* Previous Day Navigation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDateChange(addDays(selectedDate, -1))}
        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Date Chips */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onDateChange(yesterday)}
          className={getChipClass(yesterday)}
        >
          {formatDateChip(yesterday)}
        </button>
        
        <button
          onClick={() => onDateChange(today)}
          className={getChipClass(today)}
        >
          {formatDateChip(today)}
        </button>
        
        <button
          onClick={() => onDateChange(tomorrow)}
          className={getChipClass(tomorrow)}
        >
          {formatDateChip(tomorrow)}
        </button>
      </div>

      {/* Next Day Navigation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDateChange(addDays(selectedDate, 1))}
        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Custom Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateChange(date)}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}