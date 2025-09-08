
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, subDays, parseISO } from 'date-fns';

export interface DailyLeadsCallsData {
  fecha: string;
  leads: number;
  llamadas: number;
}

export interface DailyLeadsCallsFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  leadSource?: string;
  callOutcome?: string;
}

export const useDailyLeadsCallsData = (filters?: DailyLeadsCallsFilters) => {
  // Default filters if none provided (backward compatibility)
  const defaultFilters: DailyLeadsCallsFilters = {
    dateRange: {
      from: subDays(new Date(), 28),
      to: new Date()
    },
    leadSource: undefined,
    callOutcome: undefined
  };

  const actualFilters = filters || defaultFilters;

  return useQuery({
    queryKey: ['daily-leads-calls', actualFilters],
    queryFn: async (): Promise<DailyLeadsCallsData[]> => {
      const { dateRange } = actualFilters;
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      // Fetch leads data
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('fecha_creacion, fuente')
        .gte('fecha_creacion', startDate)
        .lte('fecha_creacion', endDate)
        .order('fecha_creacion', { ascending: true });

      if (leadsError) throw leadsError;

      // Fetch calls data
      const { data: callsData, error: callsError } = await supabase
        .from('manual_call_logs')
        .select('call_datetime, call_outcome')
        .gte('call_datetime', startDate)
        .lte('call_datetime', endDate)
        .order('call_datetime', { ascending: true });

      if (callsError) throw callsError;

      // Process data by day
      const dataMap = new Map<string, { leads: number; llamadas: number }>();

      // Initialize all days in range with zero values
      const currentDate = new Date(dateRange.from);
      while (currentDate <= dateRange.to) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        dataMap.set(dateKey, { leads: 0, llamadas: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count leads per day
      leadsData?.forEach(lead => {
        if (lead.fecha_creacion) {
          const dateKey = format(parseISO(lead.fecha_creacion), 'yyyy-MM-dd');
          const existing = dataMap.get(dateKey);
          if (existing) {
            if (!actualFilters.leadSource || lead.fuente === actualFilters.leadSource) {
              existing.leads += 1;
            }
          }
        }
      });

      // Count calls per day
      callsData?.forEach(call => {
        if (call.call_datetime) {
          const dateKey = format(parseISO(call.call_datetime), 'yyyy-MM-dd');
          const existing = dataMap.get(dateKey);
          if (existing) {
            if (!actualFilters.callOutcome || call.call_outcome === actualFilters.callOutcome) {
              existing.llamadas += 1;
            }
          }
        }
      });

      // Convert to array and format
      return Array.from(dataMap.entries())
        .map(([fecha, data]) => ({
          fecha: format(parseISO(fecha), 'dd/MM'),
          leads: data.leads,
          llamadas: data.llamadas
        }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};
