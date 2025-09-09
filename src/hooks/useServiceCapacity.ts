import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  calcularCapacidadRealistaConDescanso,
  calcularServiciosPosiblesPorTipoMejorado,
  IMPROVED_SERVICE_CONFIG,
  HEALTHY_WORK_CONFIG
} from '@/utils/predictionAlgorithms';

interface RealCapacityData {
  activeCustodians: number;
  totalServices: number;
  servicesByType: {
    local: number;
    regional: number;
    foraneo: number;
  };
}

interface ServiceCapacityData {
  // Capacidad inmediata
  dailyCapacity: {
    total: number;
    local: number;
    regional: number;
    foraneo: number;
  };
  
  // Capacidad mensual proyectada
  monthlyCapacity: {
    total: number;
    local: number;
    regional: number;
    foraneo: number;
  };
  
  // Métricas de utilización
  utilizationMetrics: {
    current: number;
    healthy: number;
    maxSafe: number;
  };
  
  // Alertas y recomendaciones
  alerts: {
    type: 'healthy' | 'warning' | 'critical';
    message: string;
    recommendations: string[];
  };
  
  // Datos base
  activeCustodians: number;
  recentServices: {
    total: number;
    byType: {
      local: number;
      regional: number; 
      foraneo: number;
    };
  };
}

export const useServiceCapacity = () => {
  // Obtener custodios activos y servicios de los últimos 3 meses
  const { data: realCapacityData, isLoading } = useQuery<RealCapacityData>({
    queryKey: ['service-capacity-analysis'],
    queryFn: async () => {
      // Obtener datos de servicios de los últimos 3 meses
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: servicesData, error } = await supabase
        .from('servicios_custodia')
        .select('nombre_custodio, km_recorridos, estado, fecha_hora_cita')
        .gte('fecha_hora_cita', threeMonthsAgo.toISOString())
        .in('estado', ['completado', 'Completado', 'finalizado', 'Finalizado'])
        .not('nombre_custodio', 'is', null);
        
      if (error) throw error;
      
      // Procesar datos
      const custodians = new Set<string>();
      const services = {
        local: 0,
        regional: 0,
        foraneo: 0
      };
      
      servicesData?.forEach(service => {
        if (service.nombre_custodio) {
          custodians.add(service.nombre_custodio);
        }
        const km = service.km_recorridos || 0;
        
        if (km <= 50) services.local++;
        else if (km <= 200) services.regional++;
        else services.foraneo++;
      });
      
      return {
        activeCustodians: custodians.size,
        totalServices: servicesData?.length || 0,
        servicesByType: services
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const capacityAnalysis = useMemo((): ServiceCapacityData => {
    if (isLoading || !realCapacityData) {
      return {
        dailyCapacity: { total: 0, local: 0, regional: 0, foraneo: 0 },
        monthlyCapacity: { total: 0, local: 0, regional: 0, foraneo: 0 },
        utilizationMetrics: { current: 0, healthy: 75, maxSafe: 85 },
        alerts: { type: 'healthy', message: 'Cargando datos...', recommendations: [] },
        activeCustodians: 0,
        recentServices: { total: 0, byType: { local: 0, regional: 0, foraneo: 0 } }
      };
    }

    const activeCustodians = realCapacityData.activeCustodians || 83;
    const capacidadEfectiva = calcularCapacidadRealistaConDescanso(activeCustodians);

    // Calcular capacidades diarias por tipo
    const dailyCapacityLocal = calcularServiciosPosiblesPorTipoMejorado(capacidadEfectiva, 'local');
    const dailyCapacityRegional = calcularServiciosPosiblesPorTipoMejorado(capacidadEfectiva, 'regional');
    const dailyCapacityForaneo = calcularServiciosPosiblesPorTipoMejorado(capacidadEfectiva, 'foraneo');
    
    const dailyCapacityTotal = dailyCapacityLocal + dailyCapacityRegional + dailyCapacityForaneo;

    // Capacidad mensual (22 días laborables promedio)
    const workingDaysPerMonth = 22;
    const monthlyCapacityTotal = dailyCapacityTotal * workingDaysPerMonth;

    // Calcular utilización actual
    const recentServices = realCapacityData.servicesByType;
    const totalRecentServices = realCapacityData.totalServices;
    const monthlyRealServices = totalRecentServices / 3;
    
    const currentUtilization = (monthlyRealServices / monthlyCapacityTotal) * 100;

    // Determinar alertas
    let alertType: 'healthy' | 'warning' | 'critical' = 'healthy';
    let alertMessage = 'Capacidad operativa saludable';
    const recommendations: string[] = [];

    if (currentUtilization > 85) {
      alertType = 'critical';
      alertMessage = 'Sobrecarga crítica detectada';
      recommendations.push('Contratar custodios adicionales urgentemente');
    } else if (currentUtilization > 75) {
      alertType = 'warning';
      alertMessage = 'Acercándose a límite de capacidad saludable';
      recommendations.push('Planificar contratación preventiva');
    } else {
      recommendations.push('Capacidad suficiente para crecimiento');
    }

    return {
      dailyCapacity: {
        total: Math.round(dailyCapacityTotal),
        local: Math.round(dailyCapacityLocal),
        regional: Math.round(dailyCapacityRegional),
        foraneo: Math.round(dailyCapacityForaneo)
      },
      monthlyCapacity: {
        total: Math.round(monthlyCapacityTotal),
        local: Math.round(dailyCapacityLocal * workingDaysPerMonth),
        regional: Math.round(dailyCapacityRegional * workingDaysPerMonth),
        foraneo: Math.round(dailyCapacityForaneo * workingDaysPerMonth)
      },
      utilizationMetrics: {
        current: Math.round(currentUtilization * 10) / 10,
        healthy: 75,
        maxSafe: 85
      },
      alerts: {
        type: alertType,
        message: alertMessage,
        recommendations
      },
      activeCustodians,
      recentServices: {
        total: totalRecentServices,
        byType: recentServices
      }
    };
  }, [realCapacityData, isLoading]);

  return {
    capacityData: capacityAnalysis,
    loading: isLoading,
    refresh: () => {
      // Query will be refetched automatically
    }
  };
};