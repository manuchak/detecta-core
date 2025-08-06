
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

      // Obtener leads por día
      const { data: leadsData, error: leadsError } = await supabase
        .from('candidatos_custodios')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (leadsError) throw leadsError;

      // Obtener llamadas por día
      const { data: callsData, error: callsError } = await supabase
        .from('manual_call_logs')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (callsError) throw callsError;

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
