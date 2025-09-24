import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MultiDateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MultiDateSelector({ selectedDate, onDateChange }: MultiDateSelectorProps) {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'EEE d', { locale: es });
  };

  const getDateClass = (date: Date) => {
    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    
    return cn(
      "relative px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
      isSelected
        ? "bg-primary text-primary-foreground shadow-md scale-105"
        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-102"
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarIcon className="h-4 w-4" />
          Seleccionar Fecha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Date Buttons */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDateChange(yesterday)}
            className={getDateClass(yesterday)}
          >
            {formatDateLabel(yesterday)}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDateChange(today)}
            className={getDateClass(today)}
          >
            {formatDateLabel(today)}
          </Button>
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => onDateChange(tomorrow)}
            className={getDateClass(tomorrow)}
          >
            {formatDateLabel(tomorrow)}
          </Button>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addDays(selectedDate, -1))}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-3 w-3" />
            Anterior
          </Button>
          
          <div className="text-sm font-medium text-center">
            {format(selectedDate, 'PPP', { locale: es })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addDays(selectedDate, 1))}
            className="flex items-center gap-1"
          >
            Siguiente
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Custom Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Seleccionar fecha específica
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
      </CardContent>
    </Card>
  );
}