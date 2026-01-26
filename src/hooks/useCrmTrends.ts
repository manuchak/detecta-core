import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';

export interface CrmTrends {
  // Current month metrics
  currentOpenDeals: number;
  currentPipelineValue: number;
  currentWonDeals: number;
  currentWonValue: number;
  
  // Previous month metrics
  prevOpenDeals: number;
  prevPipelineValue: number;
  prevWonDeals: number;
  prevWonValue: number;
  
  // Calculated trends
  openDealsChange: number; // absolute change
  pipelineValueChange: number; // percentage change
  wonDealsChange: number;
  wonValueChange: number;
  
  // Monthly target (if available)
  monthlyTarget: number | null;
  progressVsTarget: number | null; // percentage of target achieved
}

export interface StageAverageTime {
  stageId: string;
  stageName: string;
  avgDaysInStage: number;
}

export interface DealStalledInfo {
  dealId: string;
  daysInStage: number;
  avgDaysForStage: number;
  isStalled: boolean; // true if > 1.5x average
  stalledSeverity: 'warning' | 'critical' | null; // warning: 1.5-2x, critical: >2x
}

export function useCrmTrends() {
  return useQuery({
    queryKey: ['crm-trends'],
    queryFn: async (): Promise<CrmTrends> => {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const prevMonthStart = startOfMonth(subMonths(now, 1));
      const prevMonthEnd = endOfMonth(subMonths(now, 1));

      // Get all deals
      const { data: allDeals, error } = await supabase
        .from('crm_deals')
        .select('id, value, status, created_at, won_time, updated_at')
        .eq('is_deleted', false);

      if (error) {
        console.error('Error fetching deals for trends:', error);
        throw error;
      }

      const deals = allDeals || [];

      // Current month stats
      const currentOpenDeals = deals.filter(d => d.status === 'open').length;
      const currentPipelineValue = deals
        .filter(d => d.status === 'open')
        .reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      
      const currentWonDeals = deals.filter(d => 
        d.status === 'won' && 
        d.won_time && 
        new Date(d.won_time) >= currentMonthStart
      ).length;
      
      const currentWonValue = deals
        .filter(d => 
          d.status === 'won' && 
          d.won_time && 
          new Date(d.won_time) >= currentMonthStart
        )
        .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

      // Previous month stats - won deals in previous month
      const prevWonDeals = deals.filter(d => 
        d.status === 'won' && 
        d.won_time && 
        new Date(d.won_time) >= prevMonthStart &&
        new Date(d.won_time) <= prevMonthEnd
      ).length;

      const prevWonValue = deals
        .filter(d => 
          d.status === 'won' && 
          d.won_time && 
          new Date(d.won_time) >= prevMonthStart &&
          new Date(d.won_time) <= prevMonthEnd
        )
        .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

      // For previous open deals/pipeline, use deals that were open at end of last month
      // Approximation: count deals created before end of prev month that are still open
      // or were closed this month
      const prevOpenDeals = deals.filter(d => 
        new Date(d.created_at) <= prevMonthEnd &&
        (d.status === 'open' || 
          (d.won_time && new Date(d.won_time) >= currentMonthStart) ||
          (d.status === 'lost'))
      ).length;

      const prevPipelineValue = deals
        .filter(d => 
          new Date(d.created_at) <= prevMonthEnd &&
          (d.status === 'open' || 
            (d.won_time && new Date(d.won_time) >= currentMonthStart))
        )
        .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

      // Get monthly target
      const { data: targetData } = await supabase
        .from('business_targets')
        .select('target_gmv')
        .eq('year', now.getFullYear())
        .eq('month', now.getMonth() + 1)
        .maybeSingle();

      const monthlyTarget = targetData?.target_gmv || null;

      // Calculate changes
      const openDealsChange = currentOpenDeals - prevOpenDeals;
      const pipelineValueChange = prevPipelineValue > 0 
        ? ((currentPipelineValue - prevPipelineValue) / prevPipelineValue) * 100 
        : 0;
      const wonDealsChange = currentWonDeals - prevWonDeals;
      const wonValueChange = prevWonValue > 0
        ? ((currentWonValue - prevWonValue) / prevWonValue) * 100
        : 0;

      // Progress vs target (using weighted forecast)
      const { data: forecastData } = await supabase
        .from('crm_forecast_view')
        .select('weighted_value');

      const weightedTotal = (forecastData || []).reduce(
        (sum, row) => sum + (Number(row.weighted_value) || 0),
        0
      );

      const progressVsTarget = monthlyTarget 
        ? (weightedTotal / monthlyTarget) * 100 
        : null;

      return {
        currentOpenDeals,
        currentPipelineValue,
        currentWonDeals,
        currentWonValue,
        prevOpenDeals,
        prevPipelineValue,
        prevWonDeals,
        prevWonValue,
        openDealsChange,
        pipelineValueChange,
        wonDealsChange,
        wonValueChange,
        monthlyTarget,
        progressVsTarget,
      };
    },
    staleTime: 60 * 1000,
  });
}

export function useStageAverageTimes() {
  return useQuery({
    queryKey: ['crm-stage-average-times'],
    queryFn: async (): Promise<Record<string, StageAverageTime>> => {
      // Get all stage history to calculate average time per stage
      const { data: history, error } = await supabase
        .from('crm_deal_stage_history')
        .select(`
          id,
          from_stage_id,
          to_stage_id,
          time_in_previous_stage,
          crm_pipeline_stages!crm_deal_stage_history_from_stage_id_fkey (
            id,
            name
          )
        `)
        .not('time_in_previous_stage', 'is', null);

      if (error) {
        console.error('Error fetching stage history:', error);
        // Return empty record if no history
        return {};
      }

      // Parse interval strings and calculate averages per stage
      const stageTimeAccumulators: Record<string, { total: number; count: number; name: string }> = {};

      (history || []).forEach((entry: any) => {
        if (!entry.from_stage_id || !entry.time_in_previous_stage) return;

        const intervalStr = entry.time_in_previous_stage as string;
        const days = parseIntervalToDays(intervalStr);
        
        if (days === null) return;

        const stageId = entry.from_stage_id;
        const stageName = entry.crm_pipeline_stages?.name || 'Unknown';

        if (!stageTimeAccumulators[stageId]) {
          stageTimeAccumulators[stageId] = { total: 0, count: 0, name: stageName };
        }

        stageTimeAccumulators[stageId].total += days;
        stageTimeAccumulators[stageId].count += 1;
      });

      // Convert to final format
      const result: Record<string, StageAverageTime> = {};
      
      for (const [stageId, data] of Object.entries(stageTimeAccumulators)) {
        result[stageId] = {
          stageId,
          stageName: data.name,
          avgDaysInStage: data.count > 0 ? Math.round(data.total / data.count) : 7, // Default 7 days
        };
      }

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Parse PostgreSQL interval string to days
 * Examples: "5 days", "1 day 02:30:00", "7 days 12:00:00"
 */
function parseIntervalToDays(intervalStr: string): number | null {
  if (!intervalStr) return null;

  // Match patterns like "X days" or "X day"
  const daysMatch = intervalStr.match(/(\d+)\s*days?/);
  if (daysMatch) {
    return parseInt(daysMatch[1], 10);
  }

  // If just time component (HH:MM:SS), it's less than a day
  if (/^\d{2}:\d{2}:\d{2}$/.test(intervalStr)) {
    return 0;
  }

  return null;
}

/**
 * Calculate if a deal is stalled based on time in current stage vs average
 */
export function calculateDealStalledInfo(
  dealUpdatedAt: string,
  stageId: string | null,
  stageAverages: Record<string, StageAverageTime>
): DealStalledInfo {
  const now = new Date();
  const updatedAt = new Date(dealUpdatedAt);
  const daysInStage = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

  const avgForStage = stageId ? stageAverages[stageId]?.avgDaysInStage ?? 14 : 14;
  const ratio = daysInStage / avgForStage;

  let isStalled = false;
  let stalledSeverity: 'warning' | 'critical' | null = null;

  if (ratio >= 2) {
    isStalled = true;
    stalledSeverity = 'critical';
  } else if (ratio >= 1.5) {
    isStalled = true;
    stalledSeverity = 'warning';
  }

  return {
    dealId: '',
    daysInStage,
    avgDaysForStage: avgForStage,
    isStalled,
    stalledSeverity,
  };
}
