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
      const { data, error } = await supabase.rpc('get_real_marketing_roi_v2', { 
        periodo_dias: 90 
      });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          roiTotal: 0,
          detallesPorCanal: [],
          totalGastos: 0,
          totalIngresos: 0,
          totalCandidatos: 0,
          totalCustodiosActivos: 0,
          cpaPromedio: 0,
          lastUpdated: new Date()
        };
      }

      const detallesPorCanal: ROIMarketingDetails[] = data.map(item => {
        const desglose = typeof item.desglose_calculo === 'object' && item.desglose_calculo !== null 
          ? item.desglose_calculo as any
          : {
              gastos: 0,
              ingresos: 0,
              candidatos: 0,
              custodios_activos: 0,
              periodo_dias: 90,
              fecha_limite: new Date().toISOString()
            };

        return {
          canal: item.canal || 'Sin canal',
          gastoTotal: Number(item.gasto_total) || 0,
          candidatosGenerados: Number(item.candidatos_generados) || 0,
          custodiosActivos: Number(item.custodios_activos) || 0,
          cpaReal: Number(item.cpa_real) || 0,
          ingresosGenerados: Number(item.ingresos_generados) || 0,
          roiPorcentaje: Number(item.roi_porcentaje) || 0,
          desglose: {
            gastos: Number(desglose.gastos) || 0,
            ingresos: Number(desglose.ingresos) || 0,
            candidatos: Number(desglose.candidatos) || 0,
            custodios_activos: Number(desglose.custodios_activos) || 0,
            periodo_dias: Number(desglose.periodo_dias) || 90,
            fecha_limite: String(desglose.fecha_limite) || new Date().toISOString()
          }
        };
      });

      const totales = detallesPorCanal.reduce((acc, canal) => ({
        gastos: acc.gastos + canal.gastoTotal,
        ingresos: acc.ingresos + canal.ingresosGenerados,
        candidatos: acc.candidatos + canal.candidatosGenerados,
        custodiosActivos: acc.custodiosActivos + canal.custodiosActivos
      }), { gastos: 0, ingresos: 0, candidatos: 0, custodiosActivos: 0 });

      const roiTotal = totales.gastos > 0 
        ? ((totales.ingresos - totales.gastos) / totales.gastos) * 100 
        : 0;

      const cpaPromedio = totales.candidatos > 0 
        ? totales.gastos / totales.candidatos 
        : 0;

      return {
        roiTotal,
        detallesPorCanal,
        totalGastos: totales.gastos,
        totalIngresos: totales.ingresos,
        totalCandidatos: totales.candidatos,
        totalCustodiosActivos: totales.custodiosActivos,
        cpaPromedio,
        lastUpdated: new Date()
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000
  });

  const getROITrend = () => {
    if (!roiMarketingData?.detallesPorCanal) return [];
    
    return roiMarketingData.detallesPorCanal
      .sort((a, b) => b.roiPorcentaje - a.roiPorcentaje)
      .slice(0, 5);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return {
    metrics: roiMarketingData || {
      roiTotal: 0,
      detallesPorCanal: [],
      totalGastos: 0,
      totalIngresos: 0,
      totalCandidatos: 0,
      totalCustodiosActivos: 0,
      cpaPromedio: 0,
      lastUpdated: new Date()
    },
    loading: isLoading,
    error,
    refetch,
    getROITrend,
    formatCurrency,
    formatPercentage
  };
};