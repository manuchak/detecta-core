import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  differenceInMinutes, 
  addMinutes, 
  setHours, 
  setMinutes, 
  startOfDay,
  getDay,
  addDays,
  isAfter,
  isBefore,
  format
} from 'date-fns';

export interface BusinessHours {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  es_dia_laboral: boolean;
}

export interface Holiday {
  fecha: string;
  nombre: string;
}

interface BusinessHoursSLAConfig {
  businessHours: BusinessHours[];
  holidays: Holiday[];
  loading: boolean;
}

// Parse time string to hours and minutes
const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

// Get working minutes for a specific day
const getWorkingMinutesForDay = (
  date: Date,
  businessHours: BusinessHours[],
  holidays: Holiday[],
  startTime?: Date,
  endTime?: Date
): number => {
  const dayOfWeek = getDay(date);
  const dayConfig = businessHours.find(bh => bh.dia_semana === dayOfWeek);
  
  // Not a work day
  if (!dayConfig?.es_dia_laboral) return 0;
  
  // Check if it's a holiday
  const dateStr = format(date, 'yyyy-MM-dd');
  if (holidays.some(h => h.fecha === dateStr)) return 0;
  
  const workStart = parseTime(dayConfig.hora_inicio);
  const workEnd = parseTime(dayConfig.hora_fin);
  
  const dayStart = setMinutes(setHours(startOfDay(date), workStart.hours), workStart.minutes);
  const dayEnd = setMinutes(setHours(startOfDay(date), workEnd.hours), workEnd.minutes);
  
  // Calculate effective start and end for this day
  const effectiveStart = startTime && isAfter(startTime, dayStart) ? startTime : dayStart;
  const effectiveEnd = endTime && isBefore(endTime, dayEnd) ? endTime : dayEnd;
  
  // If the effective period is outside work hours, return 0
  if (isAfter(effectiveStart, dayEnd) || isBefore(effectiveEnd, dayStart)) return 0;
  if (isAfter(effectiveStart, effectiveEnd)) return 0;
  
  return Math.max(0, differenceInMinutes(effectiveEnd, effectiveStart));
};

// Calculate business hours remaining until deadline
export const calculateBusinessMinutesRemaining = (
  deadline: Date,
  businessHours: BusinessHours[],
  holidays: Holiday[]
): number => {
  const now = new Date();
  
  if (isAfter(now, deadline)) {
    // Deadline passed - calculate negative minutes
    return -calculateBusinessMinutesBetween(deadline, now, businessHours, holidays);
  }
  
  return calculateBusinessMinutesBetween(now, deadline, businessHours, holidays);
};

// Calculate business hours between two dates
export const calculateBusinessMinutesBetween = (
  start: Date,
  end: Date,
  businessHours: BusinessHours[],
  holidays: Holiday[]
): number => {
  if (isAfter(start, end)) return 0;
  
  let totalMinutes = 0;
  let currentDate = new Date(start);
  
  // Iterate through each day
  while (isBefore(currentDate, end) || format(currentDate, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
    const isStartDay = format(currentDate, 'yyyy-MM-dd') === format(start, 'yyyy-MM-dd');
    const isEndDay = format(currentDate, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');
    
    totalMinutes += getWorkingMinutesForDay(
      currentDate,
      businessHours,
      holidays,
      isStartDay ? start : undefined,
      isEndDay ? end : undefined
    );
    
    if (format(currentDate, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) break;
    currentDate = addDays(currentDate, 1);
  }
  
  return totalMinutes;
};

// Add business hours to a date
export const addBusinessHours = (
  start: Date,
  hoursToAdd: number,
  businessHours: BusinessHours[],
  holidays: Holiday[]
): Date => {
  let minutesRemaining = hoursToAdd * 60;
  let currentDate = new Date(start);
  
  while (minutesRemaining > 0) {
    const dayOfWeek = getDay(currentDate);
    const dayConfig = businessHours.find(bh => bh.dia_semana === dayOfWeek);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    // Skip non-work days and holidays
    if (!dayConfig?.es_dia_laboral || holidays.some(h => h.fecha === dateStr)) {
      currentDate = addDays(startOfDay(currentDate), 1);
      continue;
    }
    
    const workStart = parseTime(dayConfig.hora_inicio);
    const workEnd = parseTime(dayConfig.hora_fin);
    
    const dayStart = setMinutes(setHours(startOfDay(currentDate), workStart.hours), workStart.minutes);
    const dayEnd = setMinutes(setHours(startOfDay(currentDate), workEnd.hours), workEnd.minutes);
    
    // If we're before work hours, move to work start
    if (isBefore(currentDate, dayStart)) {
      currentDate = dayStart;
    }
    
    // If we're after work hours, move to next day
    if (isAfter(currentDate, dayEnd)) {
      currentDate = addDays(startOfDay(currentDate), 1);
      continue;
    }
    
    // Calculate available minutes today
    const availableMinutes = differenceInMinutes(dayEnd, currentDate);
    
    if (availableMinutes >= minutesRemaining) {
      // We can finish today
      return addMinutes(currentDate, minutesRemaining);
    } else {
      // Use all available time and continue tomorrow
      minutesRemaining -= availableMinutes;
      currentDate = addDays(startOfDay(currentDate), 1);
    }
  }
  
  return currentDate;
};

// Hook to load business hours configuration
export const useBusinessHoursConfig = (): BusinessHoursSLAConfig => {
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [hoursRes, holidaysRes] = await Promise.all([
          supabase
            .from('ticket_business_hours')
            .select('dia_semana, hora_inicio, hora_fin, es_dia_laboral')
            .order('dia_semana'),
          supabase
            .from('calendario_feriados_mx')
            .select('fecha, nombre')
            .eq('activo', true)
            .gte('fecha', format(new Date(), 'yyyy-MM-dd'))
        ]);

        if (hoursRes.data) setBusinessHours(hoursRes.data);
        if (holidaysRes.data) setHolidays(holidaysRes.data);
      } catch (error) {
        console.error('Error loading business hours config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { businessHours, holidays, loading };
};

// Hook to calculate SLA with business hours
export const useBusinessHoursSLA = (
  deadline: Date | null,
  completedAt: Date | null
) => {
  const { businessHours, holidays, loading } = useBusinessHoursConfig();

  return useMemo(() => {
    if (loading || !deadline || businessHours.length === 0) {
      return {
        minutesRemaining: null,
        hoursRemaining: null,
        isOverdue: false,
        loading
      };
    }

    if (completedAt) {
      const wasOnTime = isBefore(completedAt, deadline);
      return {
        minutesRemaining: null,
        hoursRemaining: null,
        isOverdue: !wasOnTime,
        loading: false
      };
    }

    const minutesRemaining = calculateBusinessMinutesRemaining(deadline, businessHours, holidays);
    
    return {
      minutesRemaining,
      hoursRemaining: Math.round(minutesRemaining / 60 * 10) / 10,
      isOverdue: minutesRemaining < 0,
      loading: false
    };
  }, [deadline, completedAt, businessHours, holidays, loading]);
};

export default useBusinessHoursSLA;
