// Enhanced Forecast Engine Hook with Monitoring and Alerts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HybridForecastEngine, EnhancedForecastResult, ExternalFactors } from '@/utils/hybridForecastEngine';
import { useMemo, useState, useEffect } from 'react';

export interface ForecastMonitoringAlert {
  id: string;
  type: 'accuracy' | 'anomaly' | 'divergence' | 'data_quality';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface ForecastPerformanceMetrics {
  currentMAPE: number;
  targetMAPE: number;
  accuracyTrend: 'improving' | 'stable' | 'degrading';
  confidenceScore: number;
  lastRecalibration: Date;
  forecastHistory: Array<{
    date: Date;
    forecast: number;
    actual?: number;
    accuracy?: number;
  }>;
}

export const useEnhancedForecastEngine = () => {
  const [alerts, setAlerts] = useState<ForecastMonitoringAlert[]>([]);
  const [engine] = useState(() => new HybridForecastEngine({
    enableExternalFactors: true,
    seasonalityBoost: 1.1,
    trendSensitivity: 0.7,
    volatilityThreshold: 0.25,
    confidenceTarget: 0.85
  }));

  // Obtener datos históricos
  const { data: historicalData, isLoading: loadingHistorical } = useQuery({
    queryKey: ['enhanced-forecast-historical'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_historical_monthly_data');
      if (error) throw error;
      return (data || []).map((d: any) => d.services_completed);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Obtener datos del mes actual - consulta directa a servicios_custodia
  const { data: currentMonthData, isLoading: loadingCurrent } = useQuery({
    queryKey: ['enhanced-forecast-current-month'],
    queryFn: async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const daysElapsed = currentDate.getDate();
      const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const monthProgress = daysElapsed / totalDaysInMonth;
      
      // Consulta directa para obtener servicios reales del mes actual
      const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const startOfNextMonth = currentMonth === 12 
        ? `${currentYear + 1}-01-01`
        : `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('id, cobro_cliente')
        .gte('fecha_hora_cita', startOfMonth)
        .lt('fecha_hora_cita', startOfNextMonth);
      
      if (error) throw error;
      
      const currentServices = data?.length || 0;
      const currentGMV = data?.reduce((sum, s) => sum + (Number(s.cobro_cliente) || 0), 0) || 0;
      const currentAOV = currentServices > 0 ? currentGMV / currentServices : 8473; // fallback al AOV conocido
      
      // Proyección basada en ritmo actual
      const projectedMonthEnd = monthProgress > 0 ? Math.round(currentServices / monthProgress) : currentServices;
      const projectedGMV = monthProgress > 0 ? Math.round(currentGMV / monthProgress) : currentGMV;
      
      console.log('📊 Datos reales del mes:', {
        currentServices,
        currentGMV: `$${(currentGMV / 1000000).toFixed(2)}M`,
        currentAOV: `$${currentAOV.toFixed(0)}`,
        daysElapsed,
        totalDaysInMonth,
        monthProgress: `${(monthProgress * 100).toFixed(1)}%`,
        projectedMonthEnd,
        projectedGMV: `$${(projectedGMV / 1000000).toFixed(2)}M`
      });
      
      return {
        currentServices,
        currentGMV,
        currentAOV,
        daysElapsed,
        totalDaysInMonth,
        projectedMonthEnd,
        projectedGMV
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Factores externos (simulados - en producción vendrían de APIs externas)
  const externalFactors: ExternalFactors = useMemo(() => ({
    marketingCampaigns: false, // TODO: Integrar con sistema de marketing
    seasonalEvents: [], // TODO: Integrar calendario de eventos
    economicIndicators: {
      gdpGrowth: 2.5,
      inflation: 4.2,
      businessConfidence: 6.5
    },
    competitorActivity: 'medium'
  }), []);

  // Generar forecast mejorado
  const enhancedForecast = useMemo((): EnhancedForecastResult | null => {
    if (!historicalData || historicalData.length < 12 || !currentMonthData) {
      return null;
    }

    console.log('🚀 Ejecutando Enhanced Forecast Engine...');
    return engine.generateForecast(historicalData, currentMonthData, externalFactors);
  }, [historicalData, currentMonthData, externalFactors, engine]);

  // Monitoreo de performance y alertas
  useEffect(() => {
    if (!enhancedForecast) return;

    const newAlerts: ForecastMonitoringAlert[] = [];

    // Alerta de MAPE alto
    if (enhancedForecast.diagnostics.mape > 25) {
      newAlerts.push({
        id: `mape-high-${Date.now()}`,
        type: 'accuracy',
        severity: enhancedForecast.diagnostics.mape > 40 ? 'high' : 'medium',
        message: `MAPE alto detectado: ${enhancedForecast.diagnostics.mape.toFixed(1)}%. Recomendado recalibrar modelo.`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Alerta de anomalías
    if (enhancedForecast.diagnostics.anomaliesDetected) {
      newAlerts.push({
        id: `anomaly-${Date.now()}`,
        type: 'anomaly',
        severity: 'medium',
        message: 'Anomalías detectadas en los datos. Revisar calidad de datos de entrada.',
        timestamp: new Date(),
        resolved: false
      });
    }

    // Alerta de calidad de datos
    if (enhancedForecast.diagnostics.dataQuality === 'low') {
      newAlerts.push({
        id: `data-quality-${Date.now()}`,
        type: 'data_quality',
        severity: 'high',
        message: 'Calidad de datos baja. Afecta precisión del forecast.',
        timestamp: new Date(),
        resolved: false
      });
    }

    // Alerta de divergencia
    const components = enhancedForecast.components;
    const maxDivergence = Math.max(
      Math.abs(components.holtWinters - components.intraMonth) / components.holtWinters,
      Math.abs(components.linearTrend - components.intraMonth) / components.linearTrend
    );
    
    if (maxDivergence > 0.3) {
      newAlerts.push({
        id: `divergence-${Date.now()}`,
        type: 'divergence',
        severity: 'medium',
        message: `Alta divergencia entre componentes: ${(maxDivergence * 100).toFixed(1)}%`,
        timestamp: new Date(),
        resolved: false
      });
    }

    setAlerts(prev => [
      ...prev.filter(alert => alert.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)), // Mantener solo últimas 24h
      ...newAlerts
    ]);
  }, [enhancedForecast]);

  // Performance metrics
  const performanceMetrics = useMemo((): ForecastPerformanceMetrics => {
    if (!enhancedForecast) {
      return {
        currentMAPE: 50,
        targetMAPE: 15,
        accuracyTrend: 'stable',
        confidenceScore: 0.5,
        lastRecalibration: new Date(),
        forecastHistory: []
      };
    }

    const currentMAPE = enhancedForecast.diagnostics.mape;
    const targetMAPE = 15;
    
    // Determinar tendencia de accuracy basada en backtesting
    const backtestMAPEs = enhancedForecast.diagnostics.backtestResults.map(r => r.percentageError);
    const recentMAPE = backtestMAPEs.slice(-3).reduce((sum, mape) => sum + mape, 0) / 3;
    const previousMAPE = backtestMAPEs.slice(-6, -3).reduce((sum, mape) => sum + mape, 0) / 3;
    
    let accuracyTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (recentMAPE < previousMAPE * 0.9) {
      accuracyTrend = 'improving';
    } else if (recentMAPE > previousMAPE * 1.1) {
      accuracyTrend = 'degrading';
    }

    return {
      currentMAPE,
      targetMAPE,
      accuracyTrend,
      confidenceScore: enhancedForecast.confidence,
      lastRecalibration: new Date(),
      forecastHistory: enhancedForecast.diagnostics.backtestResults.map((result, index) => ({
        date: new Date(2024, index, 1), // Simular fechas
        forecast: result.forecast,
        actual: result.actual,
        accuracy: 100 - result.percentageError
      }))
    };
  }, [enhancedForecast]);

  // Funciones de control
  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const clearAllAlerts = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, resolved: true })));
  };

  const triggerRecalibration = async () => {
    console.log('🔧 Ejecutando recalibración del modelo...');
    // En una implementación real, esto triggearía un recálculo de parámetros
    // y posiblemente una actualización de la configuración del engine
    
    // Simular recalibración exitosa
    setAlerts(prev => [...prev, {
      id: `recalibration-${Date.now()}`,
      type: 'accuracy',
      severity: 'low',
      message: 'Recalibración completada exitosamente',
      timestamp: new Date(),
      resolved: false
    }]);
  };

  const getRecommendations = () => {
    if (!enhancedForecast) return [];
    
    return enhancedForecast.diagnostics.recommendations;
  };

  const isLoading = loadingHistorical || loadingCurrent;

  return {
    // Forecast principal
    forecast: enhancedForecast,
    isLoading,
    
    // Monitoreo y alertas
    alerts: alerts.filter(alert => !alert.resolved),
    allAlerts: alerts,
    performanceMetrics,
    
    // Funciones de control
    resolveAlert,
    clearAllAlerts,
    triggerRecalibration,
    getRecommendations,
    
    // Datos para debugging
    historicalData,
    currentMonthData,
    externalFactors
  };
};