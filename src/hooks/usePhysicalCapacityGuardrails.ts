/**
 * Hook para calcular guardrails de capacidad física basados en máximos históricos
 * Previene proyecciones imposibles basándose en límites operativos reales
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CapacityMetrics {
  maxDailyServices: number;
  avgDailyServices: number;
  maxDailyGMV: number;
  avgDailyGMV: number;
  maxMonthlyServices: number;
  avgMonthlyServices: number;
  maxMonthlyGMV: number;
  avgMonthlyGMV: number;
  monthsAnalyzed: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface PhysicalGuardrails {
  // Límites absolutos basados en capacidad histórica
  maxPossibleDailyServices: number;
  maxPossibleDailyGMV: number;
  maxPossibleMonthlyServices: number;
  maxPossibleMonthlyGMV: number;
  
  // Límites realistas (95th percentile)
  realisticMaxDailyServices: number;
  realisticMaxDailyGMV: number;
  realisticMaxMonthlyServices: number;
  realisticMaxMonthlyGMV: number;
  
  // Factores de stretch permitidos
  optimisticStretchFactor: number;  // máx 1.2x del máximo histórico
  pessimisticFloorFactor: number;   // mín 0.6x del promedio
}

export interface IrrealismWarning {
  type: 'impossible' | 'highly_unlikely' | 'optimistic_but_possible';
  message: string;
  requiredDailyPace: number;
  historicalMaxDailyPace: number;
  excessFactor: number;  // cuántas veces excede el máximo histórico
}

export function usePhysicalCapacityGuardrails() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['physical-capacity-guardrails'],
    queryFn: async (): Promise<{
      metrics: CapacityMetrics;
      guardrails: PhysicalGuardrails;
    }> => {
      // Obtener datos de los últimos 12 meses
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: dailyData, error: dailyError } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita, cobro_cliente, estado')
        .gte('fecha_hora_cita', twelveMonthsAgo.toISOString())
        .in('estado', ['Finalizado', 'finalizado', 'completado', 'Completado'])
        .not('fecha_hora_cita', 'is', null);

      if (dailyError) throw dailyError;

      if (!dailyData || dailyData.length === 0) {
        return getDefaultCapacityMetrics();
      }

      // Agrupar por día
      const dailyAggregates: Record<string, { services: number; gmv: number }> = {};
      
      dailyData.forEach(service => {
        if (!service.fecha_hora_cita) return;
        const dateKey = service.fecha_hora_cita.split('T')[0];
        if (!dailyAggregates[dateKey]) {
          dailyAggregates[dateKey] = { services: 0, gmv: 0 };
        }
        dailyAggregates[dateKey].services++;
        dailyAggregates[dateKey].gmv += Number(service.cobro_cliente) || 0;
      });

      const dailyValues = Object.values(dailyAggregates);
      const dailyServices = dailyValues.map(d => d.services);
      const dailyGMVs = dailyValues.map(d => d.gmv);

      // Calcular métricas diarias
      const maxDailyServices = Math.max(...dailyServices);
      const avgDailyServices = dailyServices.reduce((a, b) => a + b, 0) / dailyServices.length;
      const maxDailyGMV = Math.max(...dailyGMVs);
      const avgDailyGMV = dailyGMVs.reduce((a, b) => a + b, 0) / dailyGMVs.length;

      // Agrupar por mes
      const monthlyAggregates: Record<string, { services: number; gmv: number }> = {};
      
      Object.entries(dailyAggregates).forEach(([dateKey, data]) => {
        const monthKey = dateKey.substring(0, 7); // 'YYYY-MM'
        if (!monthlyAggregates[monthKey]) {
          monthlyAggregates[monthKey] = { services: 0, gmv: 0 };
        }
        monthlyAggregates[monthKey].services += data.services;
        monthlyAggregates[monthKey].gmv += data.gmv;
      });

      const monthlyValues = Object.values(monthlyAggregates);
      const monthlyServices = monthlyValues.map(m => m.services);
      const monthlyGMVs = monthlyValues.map(m => m.gmv);

      const maxMonthlyServices = Math.max(...monthlyServices);
      const avgMonthlyServices = monthlyServices.reduce((a, b) => a + b, 0) / monthlyServices.length;
      const maxMonthlyGMV = Math.max(...monthlyGMVs);
      const avgMonthlyGMV = monthlyGMVs.reduce((a, b) => a + b, 0) / monthlyGMVs.length;

      // Calcular percentil 95 para límites realistas
      const sortedDailyServices = [...dailyServices].sort((a, b) => a - b);
      const sortedDailyGMV = [...dailyGMVs].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedDailyServices.length * 0.95);
      
      const realisticMaxDailyServices = sortedDailyServices[p95Index] || maxDailyServices;
      const realisticMaxDailyGMV = sortedDailyGMV[p95Index] || maxDailyGMV;

      // Calcular calidad de datos
      const monthsAnalyzed = Object.keys(monthlyAggregates).length;
      let dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
      if (monthsAnalyzed >= 12 && dailyValues.length >= 300) {
        dataQuality = 'excellent';
      } else if (monthsAnalyzed >= 6 && dailyValues.length >= 150) {
        dataQuality = 'good';
      } else if (monthsAnalyzed >= 3 && dailyValues.length >= 60) {
        dataQuality = 'fair';
      } else {
        dataQuality = 'poor';
      }

      const metrics: CapacityMetrics = {
        maxDailyServices,
        avgDailyServices,
        maxDailyGMV,
        avgDailyGMV,
        maxMonthlyServices,
        avgMonthlyServices,
        maxMonthlyGMV,
        avgMonthlyGMV,
        monthsAnalyzed,
        dataQuality
      };

      // Factores de stretch basados en calidad de datos
      const optimisticStretchFactor = dataQuality === 'excellent' ? 1.15 : 
                                       dataQuality === 'good' ? 1.20 : 1.30;
      const pessimisticFloorFactor = 0.60;

      const guardrails: PhysicalGuardrails = {
        maxPossibleDailyServices: maxDailyServices,
        maxPossibleDailyGMV: maxDailyGMV,
        maxPossibleMonthlyServices: maxMonthlyServices,
        maxPossibleMonthlyGMV: maxMonthlyGMV,
        
        realisticMaxDailyServices,
        realisticMaxDailyGMV,
        realisticMaxMonthlyServices: Math.round(realisticMaxDailyServices * 25), // ~25 días efectivos/mes
        realisticMaxMonthlyGMV: realisticMaxDailyGMV * 25,
        
        optimisticStretchFactor,
        pessimisticFloorFactor
      };

      console.log('📊 Physical Capacity Analysis:', {
        maxDailyServices,
        avgDailyServices: avgDailyServices.toFixed(1),
        maxDailyGMV: `$${(maxDailyGMV/1000).toFixed(0)}K`,
        maxMonthlyServices,
        maxMonthlyGMV: `$${(maxMonthlyGMV/1000000).toFixed(2)}M`,
        monthsAnalyzed,
        dataQuality
      });

      return { metrics, guardrails };
    },
    enabled: !!user,
    staleTime: 60 * 60 * 1000, // 1 hora - datos históricos no cambian rápido
  });
}

/**
 * Valida si una proyección es físicamente posible
 */
export function validateProjectionRealism(
  projectedServices: number,
  currentServices: number,
  daysRemaining: number,
  guardrails: PhysicalGuardrails
): IrrealismWarning | null {
  if (daysRemaining <= 0) return null;
  
  const requiredDailyPace = (projectedServices - currentServices) / daysRemaining;
  const maxHistorical = guardrails.maxPossibleDailyServices;
  const stretchedMax = maxHistorical * guardrails.optimisticStretchFactor;
  
  const excessFactor = requiredDailyPace / maxHistorical;
  
  if (requiredDailyPace > stretchedMax * 1.5) {
    return {
      type: 'impossible',
      message: `Requiere ${requiredDailyPace.toFixed(0)} servicios/día pero el máximo histórico es ${maxHistorical}. Físicamente imposible.`,
      requiredDailyPace,
      historicalMaxDailyPace: maxHistorical,
      excessFactor
    };
  }
  
  if (requiredDailyPace > stretchedMax) {
    return {
      type: 'highly_unlikely',
      message: `Requiere ${requiredDailyPace.toFixed(0)} servicios/día (${(excessFactor * 100).toFixed(0)}% del máximo histórico). Altamente improbable.`,
      requiredDailyPace,
      historicalMaxDailyPace: maxHistorical,
      excessFactor
    };
  }
  
  if (requiredDailyPace > maxHistorical) {
    return {
      type: 'optimistic_but_possible',
      message: `Requiere superar el máximo histórico de ${maxHistorical} servicios/día. Posible pero optimista.`,
      requiredDailyPace,
      historicalMaxDailyPace: maxHistorical,
      excessFactor
    };
  }
  
  return null;
}

/**
 * Calcula el techo físico para una proyección
 */
export function calculatePhysicalCeiling(
  currentServices: number,
  daysRemaining: number,
  guardrails: PhysicalGuardrails
): number {
  const maxPossible = currentServices + (daysRemaining * guardrails.maxPossibleDailyServices * guardrails.optimisticStretchFactor);
  return Math.round(maxPossible);
}

/**
 * Calcula el piso físico para una proyección
 */
export function calculatePhysicalFloor(
  currentServices: number,
  avgDailyServices: number,
  daysRemaining: number,
  guardrails: PhysicalGuardrails
): number {
  const minExpected = currentServices + (daysRemaining * avgDailyServices * guardrails.pessimisticFloorFactor);
  return Math.round(Math.max(currentServices, minExpected));
}

function getDefaultCapacityMetrics(): { metrics: CapacityMetrics; guardrails: PhysicalGuardrails } {
  return {
    metrics: {
      maxDailyServices: 50,
      avgDailyServices: 33.6,
      maxDailyGMV: 520000,
      avgDailyGMV: 288000,
      maxMonthlyServices: 1100,
      avgMonthlyServices: 850,
      maxMonthlyGMV: 9500000,
      avgMonthlyGMV: 7200000,
      monthsAnalyzed: 0,
      dataQuality: 'poor'
    },
    guardrails: {
      maxPossibleDailyServices: 50,
      maxPossibleDailyGMV: 520000,
      maxPossibleMonthlyServices: 1100,
      maxPossibleMonthlyGMV: 9500000,
      realisticMaxDailyServices: 45,
      realisticMaxDailyGMV: 450000,
      realisticMaxMonthlyServices: 1000,
      realisticMaxMonthlyGMV: 8500000,
      optimisticStretchFactor: 1.30,
      pessimisticFloorFactor: 0.60
    }
  };
}
