
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DailyLeadsData {
  date: string;
  leads_received: number;
  calls_made: number;
}

export interface AnalystPerformance {
  analyst_name: string;
  leads_assigned: number;
  calls_made: number;
  contacts_made: number;
  conversion_rate: number;
  avg_response_time_hours: number;
}

export const useLeadsAnalytics = (dateFrom?: string, dateTo?: string) => {
  const [dailyData, setDailyData] = useState<DailyLeadsData[]>([]);
  const [analystPerformance, setAnalystPerformance] = useState<AnalystPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [dateFrom, dateTo]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Obtener rango de fechas (últimos 30 días por defecto)
      const endDate = dateTo ? new Date(dateTo) : new Date();
      const startDate = dateFrom ? new Date(dateFrom) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Fetch leads data
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('fecha_creacion, asignado_a, fecha_contacto, estado')
        .gte('fecha_creacion', startDate.toISOString())
        .lte('fecha_creacion', endDate.toISOString())
        .order('fecha_creacion', { ascending: true });

      if (leadsError) throw leadsError;

      // Fetch call logs data
      const { data: callsData, error: callsError } = await supabase
        .from('manual_call_logs')
        .select('created_at, caller_id, call_outcome, lead_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (callsError) throw callsError;

      // Process daily data
      const dailyMap = new Map<string, { leads: number; calls: number }>();
      
      // Initialize all dates in range with 0 values
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dailyMap.set(dateKey, { leads: 0, calls: 0 });
      }

      // Count leads by date
      leadsData?.forEach(lead => {
        if (lead.fecha_creacion) {
          const dateKey = lead.fecha_creacion.split('T')[0];
          const current = dailyMap.get(dateKey) || { leads: 0, calls: 0 };
          dailyMap.set(dateKey, { ...current, leads: current.leads + 1 });
        }
      });

      // Count calls by date
      callsData?.forEach(call => {
        if (call.created_at) {
          const dateKey = call.created_at.split('T')[0];
          const current = dailyMap.get(dateKey) || { leads: 0, calls: 0 };
          dailyMap.set(dateKey, { ...current, calls: current.calls + 1 });
        }
      });

      // Convert to array format for chart
      const dailyDataArray: DailyLeadsData[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          leads_received: data.leads,
          calls_made: data.calls
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setDailyData(dailyDataArray);

      // Process analyst performance
      const analystMap = new Map<string, {
        leads_assigned: number;
        calls_made: number;
        contacts_made: number;
        response_times: number[];
      }>();

      // Get analysts from user profiles
      const { data: analysts, error: analystsError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', [...new Set([
          ...(leadsData?.map(lead => lead.asignado_a).filter(Boolean) || []),
          ...(callsData?.map(call => call.caller_id).filter(Boolean) || [])
        ])]);

      if (analystsError) throw analystsError;

      const analystNames = new Map(
        analysts?.map(analyst => [
          analyst.id, 
          analyst.display_name || analyst.email?.split('@')[0] || 'Analista'
        ]) || []
      );

      // Count leads assigned to each analyst
      leadsData?.forEach(lead => {
        if (lead.asignado_a) {
          const name = analystNames.get(lead.asignado_a) || 'Analista';
          const current = analystMap.get(name) || {
            leads_assigned: 0,
            calls_made: 0,
            contacts_made: 0,
            response_times: []
          };
          
          analystMap.set(name, {
            ...current,
            leads_assigned: current.leads_assigned + 1
          });

          // Calculate response time if contacted
          if (lead.fecha_contacto && lead.fecha_creacion) {
            const responseTime = (new Date(lead.fecha_contacto).getTime() - new Date(lead.fecha_creacion).getTime()) / (1000 * 60 * 60);
            current.response_times.push(responseTime);
          }
        }
      });

      // Count calls made by each analyst
      callsData?.forEach(call => {
        if (call.caller_id) {
          const name = analystNames.get(call.caller_id) || 'Analista';
          const current = analystMap.get(name) || {
            leads_assigned: 0,
            calls_made: 0,
            contacts_made: 0,
            response_times: []
          };
          
          analystMap.set(name, {
            ...current,
            calls_made: current.calls_made + 1,
            contacts_made: current.contacts_made + (
              call.call_outcome === 'successful' || call.call_outcome === 'reschedule_requested' ? 1 : 0
            )
          });
        }
      });

      // Convert to array format
      const analystPerformanceArray: AnalystPerformance[] = Array.from(analystMap.entries())
        .map(([name, data]) => ({
          analyst_name: name,
          leads_assigned: data.leads_assigned,
          calls_made: data.calls_made,
          contacts_made: data.contacts_made,
          conversion_rate: data.calls_made > 0 ? Math.round((data.contacts_made / data.calls_made) * 100) : 0,
          avg_response_time_hours: data.response_times.length > 0 
            ? Math.round(data.response_times.reduce((a, b) => a + b, 0) / data.response_times.length)
            : 0
        }))
        .sort((a, b) => b.calls_made - a.calls_made);

      setAnalystPerformance(analystPerformanceArray);

    } catch (error) {
      console.error('Error fetching leads analytics:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las analíticas de leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    dailyData,
    analystPerformance,
    loading,
    refetch: fetchAnalytics
  };
};
