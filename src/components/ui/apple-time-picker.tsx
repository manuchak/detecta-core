import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface AppleTimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  defaultTime?: string;
  label?: string;
  className?: string;
}

export function AppleTimePicker({ 
  value, 
  onChange, 
  defaultTime, 
  label = "Hora de encuentro",
  className 
}: AppleTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  // Initialize from value or defaultTime
  useEffect(() => {
    const timeStr = value || defaultTime;
    if (timeStr) {
      const [hour, minute] = timeStr.split(':').map(Number);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      
      setSelectedHour(displayHour);
      setSelectedMinute(minute);
      setSelectedPeriod(period);
    }
  }, [value, defaultTime]);

  // Generate arrays for picker wheels
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleTimeChange = (hour: number, minute: number, period: 'AM' | 'PM') => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    
    // Convert to 24h format for the value
    let hour24 = hour === 12 ? 0 : hour;
    if (period === 'PM' && hour !== 12) hour24 += 12;
    if (period === 'AM' && hour === 12) hour24 = 0;
    
    const timeString = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(timeString);
  };

  const displayTime = `${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`;

  return (
    <div className={cn("relative", className)}>
      <label className="block text-sm font-medium mb-2">
        {label} *
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-input rounded-lg bg-background text-left flex items-center justify-between hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{displayTime}</span>
        </div>
        <div className={cn(
          "transition-transform duration-200",
          isOpen && "rotate-180"
        )}>
          <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-popover border border-border rounded-lg shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-center gap-4">
              {/* Hours Wheel */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-2">Hora</div>
                <div className="h-32 overflow-y-auto scrollbar-thin">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => handleTimeChange(hour, selectedMinute, selectedPeriod)}
                      className={cn(
                        "w-12 h-8 text-center transition-colors rounded",
                        selectedHour === hour
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xl font-bold text-muted-foreground">:</div>

              {/* Minutes Wheel */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-2">Min</div>
                <div className="h-32 overflow-y-auto scrollbar-thin">
                  {minutes.filter(m => m % 5 === 0).map((minute) => (
                    <button
                      key={minute}
                      onClick={() => handleTimeChange(selectedHour, minute, selectedPeriod)}
                      className={cn(
                        "w-12 h-8 text-center transition-colors rounded",
                        selectedMinute === minute
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM/PM */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-2">Periodo</div>
                <div className="flex flex-col gap-1">
                  {(['AM', 'PM'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => handleTimeChange(selectedHour, selectedMinute, period)}
                      className={cn(
                        "w-12 h-8 text-center transition-colors rounded text-sm",
                        selectedPeriod === period
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}