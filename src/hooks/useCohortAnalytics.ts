import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IncomeDistribution {
  income_level: string;
  income_range: string;
  custodian_count: number;
  percentage: number;
  avg_services: number;
  avg_income: number;
}

interface ActivationMetrics {
  avg_activation_days: number;
  median_activation_days: number;
  fast_activations: number;
  slow_activations: number;
  total_activations: number;
  fast_activation_rate: number;
}

interface CohortRetention {
  cohort_month: string;
  initial_size: number;
  month_1: number;
  month_2: number;
  month_3: number;
  month_4: number;
  month_5: number;
  month_6: number;
}

interface ProductivityStats {
  month_year: string;
  active_custodians: number;
  avg_services_per_custodian: number;
  total_services: number;
  avg_income_per_custodian: number;
  total_income: number;
}

export const useCohortAnalytics = () => {
  const incomeDistributionQuery = useQuery({
    queryKey: ['cohort-income-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_income_distribution_by_threshold');
      if (error) throw error;
      return data as IncomeDistribution[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const activationMetricsQuery = useQuery({
    queryKey: ['cohort-activation-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_activation_metrics');
      if (error) throw error;
      return data?.[0] as ActivationMetrics;
    },
    staleTime: 5 * 60 * 1000,
  });

  const cohortRetentionQuery = useQuery({
    queryKey: ['cohort-retention-matrix'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cohort_retention_matrix');
      if (error) throw error;
      return data as CohortRetention[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const productivityStatsQuery = useQuery({
    queryKey: ['monthly-productivity-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_monthly_productivity_stats');
      if (error) throw error;
      return data as ProductivityStats[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    incomeDistribution: incomeDistributionQuery.data || [],
    activationMetrics: activationMetricsQuery.data,
    cohortRetention: cohortRetentionQuery.data || [],
    productivityStats: productivityStatsQuery.data || [],
    isLoading: incomeDistributionQuery.isLoading || 
               activationMetricsQuery.isLoading || 
               cohortRetentionQuery.isLoading || 
               productivityStatsQuery.isLoading,
    error: incomeDistributionQuery.error || 
           activationMetricsQuery.error || 
           cohortRetentionQuery.error || 
           productivityStatsQuery.error
  };
};