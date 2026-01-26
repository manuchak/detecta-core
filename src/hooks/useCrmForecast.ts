import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CrmForecast, CrmMetrics } from '@/types/crm';

export interface EnhancedCrmMetrics extends CrmMetrics {
  // Sales velocity
  salesVelocity: number; // $ per day
  avgCycleTime: number; // days
  
  // Comparisons
  pipelineChangePercent: number;
  winRateChange: number; // percentage points
}

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
    queryFn: async (): Promise<EnhancedCrmMetrics> => {
      // Get all deals for metrics calculation
      const { data: deals, error } = await supabase
        .from('crm_deals')
        .select('id, value, status, stage_id, created_at, won_time')
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

      // Calculate average cycle time for won deals
      const cycleTimes = wonDeals
        .filter(d => d.created_at && d.won_time)
        .map(d => {
          const created = new Date(d.created_at);
          const won = new Date(d.won_time!);
          return Math.floor((won.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });

      const avgCycleTime = cycleTimes.length > 0
        ? cycleTimes.reduce((sum, t) => sum + t, 0) / cycleTimes.length
        : 30; // Default 30 days

      // Sales Velocity = (Open Deals × Avg Deal Size × Win Rate) / Avg Cycle Time
      const salesVelocity = avgCycleTime > 0
        ? (openDeals.length * avgDealSize * (winRate / 100)) / avgCycleTime
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
        salesVelocity,
        avgCycleTime: Math.round(avgCycleTime),
        pipelineChangePercent: 0, // Will be calculated in useCrmTrends
        winRateChange: 0, // Will be calculated in useCrmTrends
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
