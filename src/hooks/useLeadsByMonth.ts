// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyLeadsData {
  month: string;
  leads: number;
  year: number;
  monthNumber: number;
}

export const useLeadsByMonth = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyLeadsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonthlyLeads();
  }, []);

  const fetchMonthlyLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get leads by month for the last 6 months to show meaningful data
      const { data, error } = await supabase
        .from('candidatos_custodios')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Group by month
      const monthlyStats: { [key: string]: MonthlyLeadsData } = {};
      
      data?.forEach(candidate => {
        const date = new Date(candidate.created_at);
        const year = date.getFullYear();
        const monthNumber = date.getMonth() + 1;
        const monthKey = `${year}-${monthNumber.toString().padStart(2, '0')}`;
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            month: date.toLocaleDateString('es-ES', { month: 'short' }),
            leads: 0,
            year,
            monthNumber
          };
        }
        monthlyStats[monthKey].leads++;
      });

      // Convert to array and sort by date
      const sortedData = Object.values(monthlyStats)
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.monthNumber - b.monthNumber;
        });

      setMonthlyData(sortedData);
    } catch (err) {
      console.error('Error fetching monthly leads:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return {
    monthlyData,
    loading,
    error,
    refetch: fetchMonthlyLeads,
  };
};