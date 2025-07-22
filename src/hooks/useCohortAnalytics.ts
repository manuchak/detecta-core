import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IncomeDistribution {
  nivel: number;
  rango_min: number;
  rango_max: number;
  custodios_count: number;
  porcentaje: number;
  promedio_servicios: number;
  promedio_ingresos: number;
}

interface ActivationMetrics {
  promedio_dias_activacion: number;
  mediana_dias_activacion: number;
  activaciones_rapidas_7d: number;
  activaciones_lentas_14d: number;
  total_activaciones: number;
  tasa_activacion_rapida: number;
}

interface CohortRetention {
  cohorte_mes: string;
  mes_0: number;
  mes_1: number;
  mes_2: number;
  mes_3: number;
  mes_4: number;
  mes_5: number;
  custodios_iniciales: number;
}

interface ProductivityStats {
  mes: string;
  custodios_activos: number;
  servicios_promedio: number;
  ingresos_promedio: number;
  servicios_totales: number;
  ingresos_totales: number;
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