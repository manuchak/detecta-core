import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CrmForecast, CrmMetrics } from '@/types/crm';

export function useCrmForecast() {
  return useQuery({
    queryKey: ['crm-forecast'],
    queryFn: async (): Promise<CrmForecast[]> => {
      const { data, error } = await supabase
        .from('crm_forecast_view')
        .select('*')
        .order('order_nr', { ascending: true });

      if (error) {
        console.error('Error fetching forecast:', error);
        throw error;
      }

      return (data || []).map(row => ({
        stage_id: row.stage_id,
        stage_name: row.stage_name,
        order_nr: row.order_nr,
        deal_probability: row.deal_probability,
        deals_count: Number(row.deals_count) || 0,
        total_value: Number(row.total_value) || 0,
        weighted_value: Number(row.weighted_value) || 0,
      }));
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCrmMetrics() {
  return useQuery({
    queryKey: ['crm-metrics'],
    queryFn: async (): Promise<CrmMetrics> => {
      // Get all deals for metrics calculation
      const { data: deals, error } = await supabase
        .from('crm_deals')
        .select('id, value, status, stage_id')
        .eq('is_deleted', false);

      if (error) {
        console.error('Error fetching deals for metrics:', error);
        throw error;
      }

      const allDeals = deals || [];
      const openDeals = allDeals.filter(d => d.status === 'open');
      const wonDeals = allDeals.filter(d => d.status === 'won');
      const lostDeals = allDeals.filter(d => d.status === 'lost');
      const closedDeals = [...wonDeals, ...lostDeals];

      // Get forecast for weighted value
      const { data: forecast } = await supabase
        .from('crm_forecast_view')
        .select('weighted_value');

      const weightedForecast = (forecast || []).reduce(
        (sum, row) => sum + (Number(row.weighted_value) || 0),
        0
      );

      const totalPipelineValue = openDeals.reduce(
        (sum, d) => sum + (Number(d.value) || 0),
        0
      );

      const winRate = closedDeals.length > 0 
        ? (wonDeals.length / closedDeals.length) * 100 
        : 0;

      const avgDealSize = wonDeals.length > 0
        ? wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0) / wonDeals.length
        : 0;

      return {
        totalPipelineValue,
        weightedForecast,
        totalDeals: allDeals.length,
        openDeals: openDeals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        winRate,
        avgDealSize,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
