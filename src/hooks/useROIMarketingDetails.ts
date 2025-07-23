import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ROIMarketingDetails {
  canal: string;
  gastoTotal: number;
  candidatosGenerados: number;
  custodiosActivos: number;
  cpaReal: number;
  ingresosGenerados: number;
  roiPorcentaje: number;
  desglose: {
    gastos: number;
    ingresos: number;
    candidatos: number;
    custodios_activos: number;
    periodo_dias: number;
    fecha_limite: string;
  };
}

export interface ROIMarketingMetrics {
  roiTotal: number;
  detallesPorCanal: ROIMarketingDetails[];
  totalGastos: number;
  totalIngresos: number;
  totalCandidatos: number;
  totalCustodiosActivos: number;
  cpaPromedio: number;
  loading: boolean;
  lastUpdated: Date;
}

export const useROIMarketingDetails = () => {
  const {
    data: roiMarketingData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['roi-marketing-details'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_marketing_roi_simple', { 
        periodo_dias: 90 
      });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          roiTotal: 0,
          totalGastos: 0,
          totalIngresos: 0,
          totalCandidatos: 0,
          totalCustodiosActivos: 0,
          lastUpdated: new Date()
        };
      }

      const result = data[0];
      return {
        roiTotal: Number(result.roi_porcentaje) || 0,
        totalGastos: Number(result.total_gastos_marketing) || 0,
        totalIngresos: Number(result.total_ingresos_estimados) || 0,
        totalCandidatos: Number(result.candidatos_totales) || 0,
        totalCustodiosActivos: Number(result.custodios_activos) || 0,
        lastUpdated: new Date()
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000
  });

  return {
    metrics: roiMarketingData || {
      roiTotal: 0,
      totalGastos: 0,
      totalIngresos: 0,
      totalCandidatos: 0,
      totalCustodiosActivos: 0,
      lastUpdated: new Date()
    },
    loading: isLoading,
    error,
    refetch
  };
};