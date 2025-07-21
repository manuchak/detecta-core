
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdvancedRecruitmentPrediction } from './useAdvancedRecruitmentPrediction';
import { useForecastData } from './useForecastData';
import { useRealNationalRecruitment } from './useRealNationalRecruitment';

export interface MonthlyNeed {
  month: number;
  year: number;
  monthName: string;
  clustersNeeds: ClusterNeed[];
  totalNeed: number;
  budgetEstimate: number;
  urgencyLevel: 'critico' | 'urgente' | 'estable' | 'sobreabastecido';
  daysToRecruitmentDeadline: number;
  recommendedStartDate: Date;
}

export interface ClusterNeed {
  clusterId: string;
  clusterName: string;
  currentCustodians: number;
  projectedServices: number;
  averageServicesPerCustodian: number;
  requiredCustodians: number;
  currentGap: number;
  rotationImpact: number;
  finalNeed: number;
  urgencyScore: number;
  budgetRequired: number;
  urgencyLevel: 'critico' | 'urgente' | 'estable' | 'sobreabastecido';
}

export interface MultiMonthPrediction {
  targetMonth: MonthlyNeed;
  nextMonth: MonthlyNeed;
  overallBudget: number;
  monitoringTeamImpact: {
    currentCapacity: number;
    requiredCapacity: number;
    needsExpansion: boolean;
  };
  criticalActions: string[];
  kpis: {
    totalRecruitmentNeed: number;
    criticalClusters: number;
    urgentClusters: number;
    daysUntilAction: number;
    budgetRequired: number;
  };
}

const RECRUITMENT_PIPELINE_DAYS = 25;
const COST_PER_CUSTODIAN = 5000; // Costo promedio de reclutamiento por custodio
const AVERAGE_SERVICES_PER_CUSTODIAN = 8; // Promedio de servicios por custodio por mes

export function useMultiMonthRecruitmentPrediction() {
  const [loading, setLoading] = useState(true);
  const [multiMonthData, setMultiMonthData] = useState<MultiMonthPrediction | null>(null);
  
  // Hooks existentes
  const { 
    deficitConRotacion, 
    datosRotacion, 
    loading: advancedLoading 
  } = useAdvancedRecruitmentPrediction();
  
  const forecastData = useForecastData(0, 0);
  
  const { 
    zonasReales, 
    metricasReales, 
    loading: realDataLoading 
  } = useRealNationalRecruitment();

  // Función para calcular el mes target y siguiente
  const calculateTargetMonths = useCallback(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = daysInCurrentMonth - currentDay;
    
    // Si quedan menos días en el mes actual que el pipeline de reclutamiento, target es el mes siguiente
    const monthsToAdd = daysLeft < RECRUITMENT_PIPELINE_DAYS ? 2 : 1;
    
    const targetDate = new Date(today.getFullYear(), today.getMonth() + monthsToAdd, 1);
    const nextDate = new Date(today.getFullYear(), today.getMonth() + monthsToAdd + 1, 1);
    
    return {
      target: {
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
        monthName: targetDate.toLocaleDateString('es-ES', { month: 'long' }),
        date: targetDate
      },
      next: {
        month: nextDate.getMonth() + 1,
        year: nextDate.getFullYear(),
        monthName: nextDate.toLocaleDateString('es-ES', { month: 'long' }),
        date: nextDate
      },
      daysToDeadline: Math.max(0, daysLeft - RECRUITMENT_PIPELINE_DAYS)
    };
  }, []);

  // Calcular necesidades por cluster usando datos reales
  const calculateClusterNeeds = useCallback((monthData: any, rotationData: any[]): ClusterNeed[] => {
    console.log('🧮 Calculando necesidades por cluster para:', monthData.monthName);
    
    return deficitConRotacion.map(cluster => {
      // Obtener datos de rotación correspondientes
      const rotationInfo = rotationData.find(r => 
        r.zona_id.toLowerCase().includes(cluster.zona_nombre.toLowerCase()) ||
        cluster.zona_nombre.toLowerCase().includes(r.zona_id.toLowerCase())
      ) || {
        custodiosActivos: 0,
        custodiosEnRiesgo: 0,
        tasaRotacionMensual: 15,
        proyeccionEgresos30Dias: 0
      };

      // Proyectar servicios basado en tendencia histórica y estacionalidad
      const baseServices = cluster.deficit_total + rotationInfo.custodiosActivos * AVERAGE_SERVICES_PER_CUSTODIAN;
      const seasonalFactor = getSeasonalFactor(monthData.month);
      const projectedServices = Math.round(baseServices * seasonalFactor);
      
      // Calcular necesidades
      const currentCustodians = rotationInfo.custodiosActivos;
      const requiredCustodians = Math.ceil(projectedServices / AVERAGE_SERVICES_PER_CUSTODIAN);
      const currentGap = Math.max(0, requiredCustodians - currentCustodians);
      const rotationImpact = Math.ceil(currentCustodians * (rotationInfo.tasaRotacionMensual / 100));
      const finalNeed = currentGap + rotationImpact;
      
      // Calcular urgencia
      const urgencyScore = calculateUrgencyScore(finalNeed, currentCustodians, monthData.daysToDeadline);
      const urgencyLevel = getUrgencyLevel(urgencyScore);
      
      return {
        clusterId: cluster.zona_id,
        clusterName: cluster.zona_nombre,
        currentCustodians,
        projectedServices,
        averageServicesPerCustodian: AVERAGE_SERVICES_PER_CUSTODIAN,
        requiredCustodians,
        currentGap,
        rotationImpact,
        finalNeed,
        urgencyScore,
        budgetRequired: finalNeed * COST_PER_CUSTODIAN,
        urgencyLevel
      };
    });
  }, [deficitConRotacion]);

  // Factores estacionales por mes
  const getSeasonalFactor = (month: number): number => {
    const factors: Record<number, number> = {
      1: 0.90, 2: 0.95, 3: 1.05, 4: 1.10, 5: 1.00, 6: 0.95,
      7: 0.85, 8: 0.90, 9: 1.00, 10: 1.10, 11: 1.15, 12: 0.95
    };
    return factors[month] || 1.0;
  };

  // Calcular score de urgencia
  const calculateUrgencyScore = (need: number, currentCustodians: number, daysToDeadline: number): number => {
    const gapRatio = currentCustodians > 0 ? need / currentCustodians : 1;
    const timeUrgency = Math.max(0, (RECRUITMENT_PIPELINE_DAYS - daysToDeadline) / RECRUITMENT_PIPELINE_DAYS);
    const needUrgency = Math.min(1, gapRatio / 0.5); // 50% gap = máxima urgencia por necesidad
    
    return Math.round((timeUrgency * 0.6 + needUrgency * 0.4) * 10);
  };

  // Obtener nivel de urgencia
  const getUrgencyLevel = (score: number): 'critico' | 'urgente' | 'estable' | 'sobreabastecido' => {
    if (score >= 8) return 'critico';
    if (score >= 6) return 'urgente';
    if (score >= 3) return 'estable';
    return 'sobreabastecido';
  };

  // Calcular datos de un mes específico
  const calculateMonthlyNeed = useCallback((monthInfo: any, daysToDeadline: number): MonthlyNeed => {
    const clustersNeeds = calculateClusterNeeds(monthInfo, datosRotacion);
    const totalNeed = clustersNeeds.reduce((sum, cluster) => sum + cluster.finalNeed, 0);
    const budgetEstimate = clustersNeeds.reduce((sum, cluster) => sum + cluster.budgetRequired, 0);
    
    // Calcular urgencia general del mes
    const avgUrgencyScore = clustersNeeds.length > 0 
      ? clustersNeeds.reduce((sum, c) => sum + c.urgencyScore, 0) / clustersNeeds.length 
      : 0;
    
    const urgencyLevel = getUrgencyLevel(avgUrgencyScore);
    
    // Fecha recomendada para iniciar reclutamiento
    const recommendedStartDate = new Date();
    recommendedStartDate.setDate(recommendedStartDate.getDate() + Math.max(0, daysToDeadline));
    
    return {
      month: monthInfo.month,
      year: monthInfo.year,
      monthName: monthInfo.monthName,
      clustersNeeds,
      totalNeed,
      budgetEstimate,
      urgencyLevel,
      daysToRecruitmentDeadline: daysToDeadline,
      recommendedStartDate
    };
  }, [calculateClusterNeeds, datosRotacion]);

  // Generar acciones críticas
  const generateCriticalActions = useCallback((targetMonth: MonthlyNeed, nextMonth: MonthlyNeed): string[] => {
    const actions: string[] = [];
    
    // Acciones para clusters críticos
    const criticalClusters = targetMonth.clustersNeeds.filter(c => c.urgencyLevel === 'critico');
    if (criticalClusters.length > 0) {
      actions.push(`🔴 CRÍTICO: Iniciar reclutamiento inmediato en ${criticalClusters.length} clusters`);
      actions.push(`📍 Clusters: ${criticalClusters.map(c => c.clusterName).join(', ')}`);
    }
    
    // Acciones para clusters urgentes
    const urgentClusters = targetMonth.clustersNeeds.filter(c => c.urgencyLevel === 'urgente');
    if (urgentClusters.length > 0) {
      actions.push(`🟡 URGENTE: Planificar reclutamiento en ${urgentClusters.length} clusters adicionales`);
    }
    
    // Preparación para el mes siguiente
    if (nextMonth.totalNeed > 0) {
      actions.push(`📅 PLANIFICACIÓN: Preparar ${nextMonth.totalNeed} reclutamientos para ${nextMonth.monthName}`);
    }
    
    // Alerta de presupuesto
    const totalBudget = targetMonth.budgetEstimate + nextMonth.budgetEstimate;
    if (totalBudget > 100000) {
      actions.push(`💰 PRESUPUESTO: Aprobar ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalBudget)}`);
    }
    
    return actions;
  }, []);

  // Función principal para calcular todo
  const calculateMultiMonthPrediction = useCallback(async () => {
    if (advancedLoading || realDataLoading || deficitConRotacion.length === 0) {
      return;
    }
    
    try {
      setLoading(true);
      
      const monthsInfo = calculateTargetMonths();
      
      // Calcular necesidades para ambos meses
      const targetMonth = calculateMonthlyNeed(monthsInfo.target, monthsInfo.daysToDeadline);
      const nextMonth = calculateMonthlyNeed(monthsInfo.next, monthsInfo.daysToDeadline + 30);
      
      // Calcular impacto en equipo de monitoreo
      const totalFutureCustodians = zonasReales.reduce((sum, zona) => {
        const metrica = metricasReales.find(m => m.zona_id === zona.id);
        return sum + (metrica?.custodios_activos || 0);
      }, 0) + targetMonth.totalNeed + nextMonth.totalNeed;
      
      const currentMonitoringCapacity = 50; // Capacidad actual estimada
      const requiredMonitoringCapacity = Math.ceil(totalFutureCustodians / 10); // 1 monitor por cada 10 custodios
      
      // Generar acciones críticas
      const criticalActions = generateCriticalActions(targetMonth, nextMonth);
      
      // KPIs consolidados
      const kpis = {
        totalRecruitmentNeed: targetMonth.totalNeed + nextMonth.totalNeed,
        criticalClusters: targetMonth.clustersNeeds.filter(c => c.urgencyLevel === 'critico').length,
        urgentClusters: targetMonth.clustersNeeds.filter(c => c.urgencyLevel === 'urgente').length,
        daysUntilAction: monthsInfo.daysToDeadline,
        budgetRequired: targetMonth.budgetEstimate + nextMonth.budgetEstimate
      };
      
      const result: MultiMonthPrediction = {
        targetMonth,
        nextMonth,
        overallBudget: targetMonth.budgetEstimate + nextMonth.budgetEstimate,
        monitoringTeamImpact: {
          currentCapacity: currentMonitoringCapacity,
          requiredCapacity: requiredMonitoringCapacity,
          needsExpansion: requiredMonitoringCapacity > currentMonitoringCapacity
        },
        criticalActions,
        kpis
      };
      
      setMultiMonthData(result);
      console.log('✅ Multi-month prediction calculated:', result);
      
    } catch (error) {
      console.error('❌ Error calculating multi-month prediction:', error);
    } finally {
      setLoading(false);
    }
  }, [
    advancedLoading,
    realDataLoading,
    deficitConRotacion,
    zonasReales,
    metricasReales,
    calculateTargetMonths,
    calculateMonthlyNeed,
    generateCriticalActions
  ]);

  // Ejecutar cálculo cuando los datos estén listos
  useEffect(() => {
    calculateMultiMonthPrediction();
  }, [calculateMultiMonthPrediction]);

  // Función para refrescar datos
  const refreshData = useCallback(() => {
    calculateMultiMonthPrediction();
  }, [calculateMultiMonthPrediction]);

  return {
    loading,
    multiMonthData,
    refreshData
  };
}
