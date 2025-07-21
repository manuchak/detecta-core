import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateTemporalPatterns, generateSeasonalForecast, optimizeRecruitmentTiming } from "@/utils/temporalAnalysis";

interface TemporalMetrics {
  zona_id: string;
  mes: number;
  factor_multiplicador: number;
  tipo_patron: string;
  created_at: string;
  updated_at: string;
}

interface SeasonalForecast {
  zona_id: string;
  zona_nombre: string;
  next_month_demand: number;
  next_quarter_demand: number;
  seasonal_multiplier: number;
  recommended_recruitment_start: string;
  confidence_level: number;
}

interface RecruitmentTiming {
  zona_id: string;
  optimal_start_weeks: number;
  peak_demand_period: string;
  recruitment_intensity: 'low' | 'medium' | 'high';
  estimated_lead_time: number;
}

export const useTemporalPatternAnalysis = () => {
  // Obtener datos históricos de servicios
  const { data: historicalData, isLoading: loadingHistorical } = useQuery({
    queryKey: ['historical-services-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select(`
          fecha_hora_cita,
          estado,
          origen,
          destino,
          km_recorridos
        `)
        .not('fecha_hora_cita', 'is', null)
        .gte('fecha_hora_cita', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      return data;
    },
  });

  // Obtener métricas temporales almacenadas
  const { data: temporalMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['temporal-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patrones_demanda_temporal')
        .select('*')
        .order('fecha_analisis', { ascending: false });
      
      if (error) throw error;
      return data as TemporalMetrics[];
    },
  });

  // Obtener zonas activas
  const { data: zones, isLoading: loadingZones } = useQuery({
    queryKey: ['active-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zonas_operacion_nacional')
        .select('id, nombre');
      
      if (error) throw error;
      return data;
    },
  });

  // Calcular análisis temporal
  const temporalAnalysis = useQuery({
    queryKey: ['temporal-analysis', historicalData, zones],
    queryFn: async () => {
      if (!historicalData || !zones) return null;
      
      return calculateTemporalPatterns(historicalData, zones);
    },
    enabled: !!historicalData && !!zones,
  });

  // Generar pronósticos estacionales
  const seasonalForecast = useQuery({
    queryKey: ['seasonal-forecast', temporalMetrics, zones],
    queryFn: async () => {
      if (!temporalMetrics || !zones) return null;
      
      return generateSeasonalForecast(temporalMetrics, zones);
    },
    enabled: !!temporalMetrics && !!zones,
  });

  // Optimizar timing de reclutamiento
  const recruitmentTiming = useQuery({
    queryKey: ['recruitment-timing', temporalAnalysis.data],
    queryFn: async () => {
      if (!temporalAnalysis.data) return null;
      
      return optimizeRecruitmentTiming(temporalAnalysis.data);
    },
    enabled: !!temporalAnalysis.data,
  });

  return {
    historicalData,
    temporalMetrics,
    zones,
    temporalAnalysis: temporalAnalysis.data,
    seasonalForecast: seasonalForecast.data as SeasonalForecast[] | null,
    recruitmentTiming: recruitmentTiming.data as RecruitmentTiming[] | null,
    isLoading: loadingHistorical || loadingMetrics || loadingZones || temporalAnalysis.isLoading || seasonalForecast.isLoading || recruitmentTiming.isLoading,
    error: temporalAnalysis.error || seasonalForecast.error || recruitmentTiming.error,
  };
};