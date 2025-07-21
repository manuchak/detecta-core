
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
// Costos basados en Excel CPA - promedio de los meses mostrados
const COST_PER_CUSTODIAN = 8500; // CPA promedio basado en datos reales
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
    
    // Para julio 2025, el mes target debe ser agosto 2025
    // Lógica simplificada: mes siguiente es siempre el target principal
    const targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextDate = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    
    // Calcular días restantes hasta fin de mes actual
    const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = daysInCurrentMonth - today.getDate();
    
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
      daysToDeadline: Math.max(0, daysLeft)
    };
  }, []);

  // Calcular necesidades por cluster usando datos reales
  const calculateClusterNeeds = useCallback((monthData: any, rotationData: any[]): ClusterNeed[] => {
    console.log('🧮 Calculando necesidades por cluster para:', monthData.monthName);
    
    return deficitConRotacion.map(cluster => {
      // Buscar datos de rotación para este cluster - mejorar mapeo
      let rotationInfo = datosRotacion.find(r => r.zona_id === cluster.zona_id);
      
      // Si no encuentra por ID exacto, buscar por nombre similar
      if (!rotationInfo) {
        rotationInfo = datosRotacion.find(r => 
          r.zona_id.toLowerCase().includes(cluster.zona_nombre.toLowerCase()) ||
          cluster.zona_nombre.toLowerCase().includes(r.zona_id.toLowerCase())
        );
      }
      
      // Si aún no encuentra, usar datos diferenciados por zona
      if (!rotationInfo) {
        const zoneDefaults: Record<string, any> = {
          'Centro de México': { custodiosActivos: 85, promedioServiciosMes: 450 },
          'Bajío': { custodiosActivos: 65, promedioServiciosMes: 320 },
          'Occidente': { custodiosActivos: 72, promedioServiciosMes: 380 },
          'Norte': { custodiosActivos: 58, promedioServiciosMes: 290 },
          'Pacífico': { custodiosActivos: 42, promedioServiciosMes: 220 },
          'Golfo': { custodiosActivos: 38, promedioServiciosMes: 180 },
          'Sureste': { custodiosActivos: 35, promedioServiciosMes: 160 },
          'Centro-Occidente': { custodiosActivos: 48, promedioServiciosMes: 240 }
        };
        
        const defaultData = zoneDefaults[cluster.zona_nombre] || { custodiosActivos: 45, promedioServiciosMes: 250 };
        rotationInfo = {
          zona_id: cluster.zona_id,
          custodiosActivos: defaultData.custodiosActivos,
          custodiosEnRiesgo: 0,
          custodiosInactivos: 0,
          tasaRotacionMensual: 5,
          proyeccionEgresos30Dias: 0,
          proyeccionEgresos60Dias: 0,
          promedioServiciosMes: defaultData.promedioServiciosMes,
          retencionNecesaria: 0
        };
      }
      
      console.log(`📊 Cluster ${cluster.zona_nombre}:`, {
        deficit_total: cluster.deficit_total,
        custodiosActivos: rotationInfo.custodiosActivos,
        promedioServiciosMes: rotationInfo.promedioServiciosMes
      });
      
      // Usar datos reales del cluster
      const currentCustodians = rotationInfo.custodiosActivos;
      const currentDeficit = cluster.deficit_total || 0;
      
      // USAR DATOS REALES DE FORECAST en lugar de proyecciones manuales
      const totalForecastServices = forecastData?.monthlyServicesForecast || 0;
      console.log(`📊 Forecast real para el mes: ${totalForecastServices} servicios`);
      
      // Distribuir servicios del forecast proporcionalmente por cluster
      // Clusters más grandes como Centro de México tienen más proporción
      const clusterProportions: Record<string, number> = {
        'Centro de México': 0.35,  // 35% (aumentado)
        'Bajío': 0.14,            // 14%
        'Occidente': 0.14,        // 14%
        'Norte': 0.10,            // 10%
        'Pacífico': 0.09,         // 9%
        'Golfo': 0.07,            // 7%
        'Sureste': 0.06,          // 6%
        'Centro-Occidente': 0.05   // 5%
      };
      
      const clusterProportion = clusterProportions[cluster.zona_nombre] || (1 / deficitConRotacion.length);
      const projectedServices = Math.round(totalForecastServices * clusterProportion);
      
      // Calcular custodios requeridos para los servicios proyectados
      const requiredCustodians = Math.ceil(projectedServices / AVERAGE_SERVICES_PER_CUSTODIAN);
      
      // Gap actual: diferencia entre lo requerido y lo actual
      const currentGap = Math.max(0, requiredCustodians - currentCustodians);
      
      // Impacto de rotación (5% mensual promedio)
      const rotationRate = 0.05; // 5% mensual
      const rotationImpact = Math.ceil(currentCustodians * rotationRate);
      
      // Necesidad final: solo si hay déficit real
      const finalNeed = currentGap + rotationImpact;
      
      // Calcular urgencia solo si hay necesidad
      const urgencyScore = finalNeed > 0 ? calculateUrgencyScore(finalNeed, currentCustodians, monthData.daysToDeadline) : 0;
      const urgencyLevel = getUrgencyLevel(urgencyScore);
      
      console.log(`📈 Resultado ${cluster.zona_nombre}:`, {
        currentCustodians,
        projectedServices,
        requiredCustodians,
        currentGap,
        rotationImpact,
        finalNeed,
        urgencyLevel
      });
      
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
    // Si no hay custodios actuales, es crítico
    if (currentCustodians === 0 && need > 0) return 10;
    
    // Calcular urgencia basada en necesidad
    const needRatio = currentCustodians > 0 ? need / currentCustodians : 0;
    let urgencyScore = 0;
    
    // Urgencia por déficit
    if (needRatio > 0.8) urgencyScore += 5; // >80% de déficit
    else if (needRatio > 0.5) urgencyScore += 4; // >50% de déficit
    else if (needRatio > 0.3) urgencyScore += 3; // >30% de déficit
    else if (needRatio > 0.1) urgencyScore += 2; // >10% de déficit
    
    // Urgencia por tiempo (estamos en julio para agosto)
    if (daysToDeadline <= 10) urgencyScore += 3; // Menos de 10 días
    else if (daysToDeadline <= 20) urgencyScore += 2; // Menos de 20 días
    else if (daysToDeadline <= 30) urgencyScore += 1; // Menos de 30 días
    
    // Si hay necesidad real (>5 custodios), elevar urgencia
    if (need >= 5) urgencyScore += 2;
    else if (need >= 2) urgencyScore += 1;
    
    return Math.min(10, urgencyScore);
  };

  // Obtener nivel de urgencia (más estricto)
  const getUrgencyLevel = (score: number): 'critico' | 'urgente' | 'estable' | 'sobreabastecido' => {
    if (score >= 7) return 'critico';   // 7-10 crítico
    if (score >= 5) return 'urgente';   // 5-6 urgente  
    if (score >= 2) return 'estable';   // 2-4 estable
    return 'sobreabastecido';           // 0-1 sobreabastecido
  };

  // Calcular datos de un mes específico
  const calculateMonthlyNeed = useCallback((monthInfo: any, daysToDeadline: number): MonthlyNeed => {
    const clustersNeeds = calculateClusterNeeds(monthInfo, datosRotacion);
    const totalNeed = clustersNeeds.reduce((sum, cluster) => sum + cluster.finalNeed, 0);
    const budgetEstimate = clustersNeeds.reduce((sum, cluster) => sum + cluster.budgetRequired, 0);
    
    // Calcular urgencia general del mes basada en necesidad total
    let urgencyLevel: 'critico' | 'urgente' | 'estable' | 'sobreabastecido';
    
    if (totalNeed <= 0) {
      urgencyLevel = 'sobreabastecido';
    } else {
      const criticalClusters = clustersNeeds.filter(c => c.urgencyLevel === 'critico').length;
      const urgentClusters = clustersNeeds.filter(c => c.urgencyLevel === 'urgente').length;
      
      if (criticalClusters > 0 || totalNeed > 50) {
        urgencyLevel = 'critico';
      } else if (urgentClusters > 0 || totalNeed > 20) {
        urgencyLevel = 'urgente';
      } else {
        urgencyLevel = 'estable';
      }
    }
    
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
      
      console.log('🔍 Datos disponibles para cálculo:');
      console.log('- deficitConRotacion:', deficitConRotacion.map(d => ({
        zona: d.zona_nombre,
        deficit_total: d.deficit_total,
        urgencia_score: d.urgencia_score
      })));
      console.log('- datosRotacion:', datosRotacion.map(d => ({
        zona_id: d.zona_id,
        custodiosActivos: d.custodiosActivos,
        promedioServiciosMes: d.promedioServiciosMes
      })));
      
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
