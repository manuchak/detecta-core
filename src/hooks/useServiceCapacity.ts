// @ts-nocheck
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  calcularCapacidadRealistaConDescanso,
  calcularServiciosPosiblesPorTipoMejorado,
  IMPROVED_SERVICE_CONFIG,
  HEALTHY_WORK_CONFIG
} from '@/utils/predictionAlgorithms';
import { getForecastMesActual } from '@/utils/forecastHelpers';

interface RealCapacityData {
  activeCustodians: number;
  availableCustodians: number;
  unavailableCustodians: {
    returningFromForeign: number;
    currentlyOnRoute: number;
  };
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
  availableCustodians: number;
  unavailableCustodians: {
    returningFromForeign: number;
    currentlyOnRoute: number;
  };
  recentServices: {
    total: number;
    byType: {
      local: number;
      regional: number; 
      foraneo: number;
    };
  };
  
  // Forecast del mes actual
  forecastMesActual?: number;
  serviciosMTD?: number;
  proyeccionPace?: number;
  utilizacionVsForecast?: number;
}

export const useServiceCapacity = () => {
  // Obtener forecast del mes actual
  const { data: forecastData } = useQuery({
    queryKey: ['forecast-mes-actual'],
    queryFn: getForecastMesActual,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Obtener capacidad real basada en disponibilidad actual
  const { data: realCapacityData, isLoading } = useQuery<RealCapacityData>({
    queryKey: ['real-time-capacity-analysis'],
    queryFn: async () => {
      // 1. Obtener datos históricos (últimos 3 meses)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: servicesData, error: servicesError } = await supabase
        .from('servicios_custodia')
        .select('nombre_custodio, km_recorridos, estado, fecha_hora_cita')
        .gte('fecha_hora_cita', threeMonthsAgo.toISOString())
        .in('estado', ['completado', 'Completado', 'finalizado', 'Finalizado'])
        .not('nombre_custodio', 'is', null);
        
      if (servicesError) throw servicesError;
      
      // 2. Identificar custodios indisponibles por servicios foráneos recientes (últimas 24h)
      const yesterday = new Date();
      yesterday.setHours(0, 0, 0, 0);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: recentForeignServices, error: foreignError } = await supabase
        .from('servicios_custodia')
        .select('nombre_custodio, km_recorridos, estado, fecha_hora_cita')
        .gte('fecha_hora_cita', yesterday.toISOString())
        .in('estado', ['completado', 'Completado', 'finalizado', 'Finalizado'])
        .not('nombre_custodio', 'is', null);
      
      if (foreignError) throw foreignError;
      
      // 3. Identificar custodios actualmente ocupados
      const { data: currentlyBusyServices, error: busyError } = await supabase
        .from('servicios_custodia')
        .select('nombre_custodio, estado')
        .in('estado', ['En ruta', 'en_ruta', 'programado', 'Programado'])
        .not('nombre_custodio', 'is', null);
      
      if (busyError) throw busyError;
      
      // Procesar datos históricos
      const allCustodians = new Set<string>();
      const services = {
        local: 0,
        regional: 0,
        foraneo: 0
      };
      
      servicesData?.forEach(service => {
        if (service.nombre_custodio) {
          allCustodians.add(service.nombre_custodio);
        }
        const km = service.km_recorridos || 0;
        
        if (km <= 50) services.local++;
        else if (km <= 200) services.regional++;
        else services.foraneo++;
      });
      
      // Identificar custodios indisponibles por servicios foráneos
      const custodiansReturningFromForeign = new Set<string>();
      recentForeignServices?.forEach(service => {
        const km = service.km_recorridos || 0;
        // Si es servicio foráneo (>200km), el custodio estará indisponible
        if (km > 200 && service.nombre_custodio) {
          custodiansReturningFromForeign.add(service.nombre_custodio);
        }
      });
      
      // Identificar custodios actualmente ocupados
      const custodiansCurrentlyBusy = new Set<string>();
      currentlyBusyServices?.forEach(service => {
        if (service.nombre_custodio) {
          custodiansCurrentlyBusy.add(service.nombre_custodio);
        }
      });
      
      // Calcular disponibilidad real
      const totalActiveCustodians = allCustodians.size;
      const unavailableCount = custodiansReturningFromForeign.size + custodiansCurrentlyBusy.size;
      const availableCustodians = Math.max(0, totalActiveCustodians - unavailableCount);
      
      return {
        activeCustodians: totalActiveCustodians,
        availableCustodians,
        unavailableCustodians: {
          returningFromForeign: custodiansReturningFromForeign.size,
          currentlyOnRoute: custodiansCurrentlyBusy.size,
        },
        totalServices: servicesData?.length || 0,
        servicesByType: services
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - más frecuente para datos en tiempo real
  });

  const capacityAnalysis = useMemo((): ServiceCapacityData => {
    if (isLoading || !realCapacityData) {
      return {
        dailyCapacity: { total: 0, local: 0, regional: 0, foraneo: 0 },
        monthlyCapacity: { total: 0, local: 0, regional: 0, foraneo: 0 },
        utilizationMetrics: { current: 0, healthy: 75, maxSafe: 85 },
        alerts: { type: 'healthy', message: 'Cargando datos...', recommendations: [] },
        activeCustodians: 0,
        availableCustodians: 0,
        unavailableCustodians: { returningFromForeign: 0, currentlyOnRoute: 0 },
        recentServices: { total: 0, byType: { local: 0, regional: 0, foraneo: 0 } }
      };
    }

    // ALGORITMO CORREGIDO: usar custodios realmente disponibles
    const availableCustodians = realCapacityData.availableCustodians;
    const activeCustodians = realCapacityData.activeCustodians;
    
    // Capacidad diaria realista basada en disponibilidad real
    // Distribucion real observada: 60% locales, 30% regionales, 10% foráneos
    const dailyCapacityLocal = Math.floor(availableCustodians * 0.6 * 2.0); // 2 locales por custodio por día
    const dailyCapacityRegional = Math.floor(availableCustodians * 0.3 * 1.0); // 1 regional por custodio por día
    const dailyCapacityForaneo = Math.floor(availableCustodians * 0.1 * 0.5); // 0.5 foráneo por custodio por día
    
    const dailyCapacityTotal = dailyCapacityLocal + dailyCapacityRegional + dailyCapacityForaneo;

    // Capacidad mensual (22 días laborables promedio)
    const workingDaysPerMonth = 22;
    const monthlyCapacityTotal = dailyCapacityTotal * workingDaysPerMonth;

    // Calcular utilización actual
    const recentServices = realCapacityData.servicesByType;
    const totalRecentServices = realCapacityData.totalServices;
    const monthlyRealServices = totalRecentServices / 3;
    
    const currentUtilization = (monthlyRealServices / monthlyCapacityTotal) * 100;

    // Calcular utilización vs forecast real del mes actual
    const forecastMesActual = forecastData?.forecastMesActual || 0;
    const utilizacionVsForecast = forecastMesActual > 0 
      ? (forecastMesActual / monthlyCapacityTotal) * 100 
      : currentUtilization;

    // Determinar alertas basadas en forecast vs capacidad (prioridad #1)
    let alertType: 'healthy' | 'warning' | 'critical' = 'healthy';
    let alertMessage = 'Capacidad operativa saludable';
    const recommendations: string[] = [];
    
    const unavailableTotal = realCapacityData.unavailableCustodians.returningFromForeign + realCapacityData.unavailableCustodians.currentlyOnRoute;
    const availabilityRate = (availableCustodians / activeCustodians) * 100;

    // PRIORIDAD 1: Comparar forecast vs capacidad
    if (forecastMesActual > monthlyCapacityTotal) {
      const deficit = forecastMesActual - monthlyCapacityTotal;
      alertType = 'critical';
      alertMessage = `🚨 SOBRECARGA: Forecast (${forecastMesActual.toLocaleString()}) excede capacidad (${monthlyCapacityTotal.toLocaleString()})`;
      recommendations.push(`Déficit de ${deficit.toLocaleString()} servicios`);
      recommendations.push(`Contratar ${Math.ceil(deficit / 29)} custodios urgentemente o rechazar servicios`);
      recommendations.push('Renegociar forecast con clientes o ajustar expectativas');
    } else if (utilizacionVsForecast > 90) {
      const buffer = monthlyCapacityTotal - forecastMesActual;
      alertType = 'warning';
      alertMessage = `⚠️ RIESGO: Forecast muy cerca del límite (${Math.round(utilizacionVsForecast)}%)`;
      recommendations.push(`Solo ${buffer.toLocaleString()} servicios de margen (${Math.round(100 - utilizacionVsForecast)}%)`);
      recommendations.push('Capacidad insuficiente para crecimiento o imprevistos');
      recommendations.push('Considerar contratación preventiva');
    } else if (availabilityRate < 60) {
      alertType = 'critical';
      alertMessage = `Solo ${availableCustodians} de ${activeCustodians} custodios disponibles (${Math.round(availabilityRate)}%)`;
      recommendations.push('Muchos custodios indisponibles por servicios foráneos');
      recommendations.push('Considerar redistribuir servicios foráneos a días específicos');
    } else if (availabilityRate < 75) {
      alertType = 'warning';
      alertMessage = `Disponibilidad limitada: ${availableCustodians} de ${activeCustodians} custodios`;
      recommendations.push('Monitorear distribución de servicios foráneos');
    } else if (currentUtilization > 85) {
      alertType = 'critical';
      alertMessage = 'Sobrecarga crítica detectada';
      recommendations.push('Contratar custodios adicionales urgentemente');
    } else if (currentUtilization > 75) {
      alertType = 'warning';
      alertMessage = 'Acercándose a límite de capacidad saludable';
      recommendations.push('Planificar contratación preventiva');
    } else {
      const surplus = monthlyCapacityTotal - forecastMesActual;
      recommendations.push(`Capacidad extra de ${surplus.toLocaleString()} servicios (${Math.round((surplus / monthlyCapacityTotal) * 100)}%)`);
      recommendations.push('Capacidad suficiente para crecimiento');
    }
    
    if (unavailableTotal > 0) {
      recommendations.unshift(`${unavailableTotal} custodios temporalmente indisponibles`);
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
      availableCustodians,
      unavailableCustodians: realCapacityData.unavailableCustodians,
      recentServices: {
        total: totalRecentServices,
        byType: recentServices
      },
      forecastMesActual: forecastData?.forecastMesActual,
      serviciosMTD: forecastData?.serviciosMTD,
      proyeccionPace: forecastData?.proyeccionPace,
      utilizacionVsForecast: Math.round(utilizacionVsForecast * 10) / 10
    };
  }, [realCapacityData, isLoading, forecastData]);

  return {
    capacityData: capacityAnalysis,
    loading: isLoading,
    refresh: () => {
      // Query will be refetched automatically
    }
  };
};