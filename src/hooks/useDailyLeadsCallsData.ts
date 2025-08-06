
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DailyData {
  date: string;
  leads: number;
  llamadas: number;
  dayLabel: string;
}

export const useDailyLeadsCallsData = () => {
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDailyData();
  }, []);

  const fetchDailyData = async () => {
    try {
      setLoading(true);

      // Obtener fecha de 28 días atrás
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      console.log('Fetching data from', startDate.toISOString(), 'to', endDate.toISOString());

      // Obtener leads por día de la tabla 'leads'
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        throw leadsError;
      }

      console.log('Leads data:', leadsData);

      // Obtener llamadas por día del equipo de supply
      // Asumiendo que las llamadas están en 'manual_call_logs' o una tabla similar
      const { data: callsData, error: callsError } = await supabase
        .from('manual_call_logs')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (callsError) {
        console.error('Error fetching calls:', callsError);
        throw callsError;
      }

      console.log('Calls data:', callsData);

      // Procesar datos por día
      const dailyStats: { [key: string]: DailyData } = {};

      // Inicializar todos los días con 0
      for (let i = 0; i < 28; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateKey = currentDate.toISOString().split('T')[0];
        
        dailyStats[dateKey] = {
          date: dateKey,
          leads: 0,
          llamadas: 0,
          dayLabel: currentDate.toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric' 
          })
        };
      }

      // Contar leads por día
      leadsData?.forEach(lead => {
        const dateKey = lead.created_at.split('T')[0];
        if (dailyStats[dateKey]) {
          dailyStats[dateKey].leads++;
        }
      });

      // Contar llamadas por día
      callsData?.forEach(call => {
        const dateKey = call.created_at?.split('T')[0];
        if (dateKey && dailyStats[dateKey]) {
          dailyStats[dateKey].llamadas++;
        }
      });

      // Convertir a array y ordenar por fecha
      const sortedData = Object.values(dailyStats).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      console.log('Final processed data:', sortedData);

      setData(sortedData);
    } catch (error) {
      console.error('Error fetching daily data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos diarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    refetch: fetchDailyData
  };
};
