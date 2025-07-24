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
  cpaReal?: number;
  ingresosPorCustodio?: number;
  serviciosCompletados?: number;
}

export const useROIMarketingDetails = () => {
  const {
    data: roiMarketingData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['roi-marketing-real-details'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_roi_marketing_real_data', { 
        periodo_dias: 90 
      });
      
      if (error) {
        console.error('Error fetching ROI data:', error);
        // Fallback a datos por defecto si hay error
        return {
          roiTotal: 0,
          totalGastos: 0,
          totalIngresos: 0,
          totalCandidatos: 0,
          totalCustodiosActivos: 0,
          lastUpdated: new Date(),
          detallesPorCanal: [],
          cpaReal: 0,
          ingresosPorCustodio: 0,
          serviciosCompletados: 0
        };
      }
      
      if (!data || data.length === 0) {
        return {
          roiTotal: 0,
          totalGastos: 0,
          totalIngresos: 0,
          totalCandidatos: 0,
          totalCustodiosActivos: 0,
          lastUpdated: new Date(),
          detallesPorCanal: [],
          cpaReal: 0,
          ingresosPorCustodio: 0,
          serviciosCompletados: 0
        };
      }

      const result = data[0];
      
      // Procesar detalles por canal
      let detallesPorCanal: ROIMarketingDetails[] = [];
      
      try {
        if (result.detalles_por_canal && Array.isArray(result.detalles_por_canal)) {
          detallesPorCanal = result.detalles_por_canal.map((canal: any) => ({
            canal: canal.canal,
            gastoTotal: Number(canal.inversion) || 0,
            candidatosGenerados: Number(canal.custodios) || 0,
            custodiosActivos: Number(canal.custodios) || 0,
            cpaReal: Number(canal.custodios) > 0 ? Number(canal.inversion) / Number(canal.custodios) : 0,
            ingresosGenerados: Number(canal.ingresos) || 0,
            roiPorcentaje: Number(canal.roi) || 0,
            desglose: {
              gastos: Number(canal.inversion) || 0,
              ingresos: Number(canal.ingresos) || 0,
              candidatos: Number(canal.custodios) || 0,
              custodios_activos: Number(canal.custodios) || 0,
              periodo_dias: 90,
              fecha_limite: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
            }
          }));
        }
      } catch (e) {
        console.warn('Error parsing detalles_por_canal:', e);
        detallesPorCanal = [];
      }

      return {
        roiTotal: Number(result.roi_calculado) || 0,
        totalGastos: Number(result.inversion_total) || 0,
        totalIngresos: Number(result.ingresos_reales) || 0,
        totalCandidatos: Number(result.custodios_contratados) || 0,
        totalCustodiosActivos: Number(result.custodios_activos) || 0,
        lastUpdated: new Date(),
        detallesPorCanal,
        cpaReal: Number(result.cpa_real) || 0,
        ingresosPorCustodio: Number(result.ingresos_por_custodio) || 0,
        serviciosCompletados: Number(result.servicios_completados) || 0
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
      cpaPromedio: 0,
      lastUpdated: new Date(),
      detallesPorCanal: [],
      cpaReal: 0,
      ingresosPorCustodio: 0,
      serviciosCompletados: 0,
      loading: false
    },
    loading: isLoading,
    error,
    refetch
  };
};