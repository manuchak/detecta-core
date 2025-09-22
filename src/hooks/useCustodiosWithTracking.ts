import { useState, useEffect } from 'react';
import { useCustodiosConProximidad } from './useProximidadOperacional';
import { useCustodioTracking } from './useCustodioTracking';
import type { CustodioConProximidad } from './useProximidadOperacional';
import type { CustodioPerformanceMetrics } from './useCustodioTracking';

export interface CustodioEnriquecido extends CustodioConProximidad {
  // Performance metrics
  performance_metrics?: CustodioPerformanceMetrics;
  
  // Scores calculados
  score_comunicacion: number;
  score_aceptacion: number;
  score_confiabilidad: number;
  score_total: number;
  
  // Métricas clave
  tasa_aceptacion: number;
  tasa_respuesta: number;
  tasa_confiabilidad: number;
  
  // Metadata para UI
  performance_level: 'excelente' | 'bueno' | 'regular' | 'malo' | 'nuevo';
  rejection_risk: 'bajo' | 'medio' | 'alto';
  response_speed: 'rapido' | 'normal' | 'lento';
}

interface UseCustodiosWithTrackingParams {
  servicioNuevo?: any;
  filtros?: {
    zona?: string;
    disponibilidad?: boolean;
    score_minimo?: number;
  };
}

export const useCustodiosWithTracking = ({
  servicioNuevo,
  filtros = {}
}: UseCustodiosWithTrackingParams = {}) => {
  const [custodiosEnriquecidos, setCustodiosEnriquecidos] = useState<CustodioEnriquecido[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { data: custodios = [], isLoading: custodiosLoading } = useCustodiosConProximidad(servicioNuevo);
  const { getAllCustodioMetrics } = useCustodioTracking();

  const enrichCustodios = async () => {
    if (!custodios || custodios.length === 0) return;
    
    setLoading(true);
    try {
      // Obtener todas las métricas de performance
      const allMetrics = await getAllCustodioMetrics();
      
      // Crear un mapa de métricas por custodio
      const metricsMap = new Map<string, CustodioPerformanceMetrics>();
      allMetrics.forEach(metric => {
        // Intentar hacer match por nombre normalizado y teléfono
        const key = `${metric.custodio_nombre.toLowerCase().trim()}_${metric.custodio_telefono}`;
        metricsMap.set(key, metric);
      });

      // Enriquecer cada custodio con sus métricas
      const enriched: CustodioEnriquecido[] = custodios.map(custodio => {
        // Buscar métricas por nombre y teléfono
        const searchKey = `${custodio.nombre.toLowerCase().trim()}_${custodio.telefono || ''}`;
        const metrics = metricsMap.get(searchKey);
        
        // Valores por defecto para custodios nuevos
        const defaultScores = {
          score_comunicacion: 5.0,
          score_aceptacion: 5.0, 
          score_confiabilidad: 10.0,
          score_total: 6.7,
          tasa_aceptacion: 0,
          tasa_respuesta: 0,
          tasa_confiabilidad: 100
        };

        // Usar métricas reales o valores por defecto
        const scores = metrics ? {
          score_comunicacion: metrics.score_comunicacion,
          score_aceptacion: metrics.score_aceptacion,
          score_confiabilidad: metrics.score_confiabilidad,
          score_total: metrics.score_total,
          tasa_aceptacion: metrics.tasa_aceptacion,
          tasa_respuesta: metrics.tasa_respuesta,
          tasa_confiabilidad: metrics.tasa_confiabilidad
        } : defaultScores;

        // Calcular niveles categorizados
        const performance_level = getPerformanceLevel(scores.score_total, !!metrics);
        const rejection_risk = getRejectionRisk(scores.tasa_aceptacion, !!metrics);
        const response_speed = getResponseSpeed(metrics?.tiempo_promedio_respuesta_minutos || 0);

        return {
          ...custodio,
          performance_metrics: metrics,
          ...scores,
          performance_level,
          rejection_risk,
          response_speed
        };
      });

      // Aplicar filtros si existen
      let filtered = enriched;
      
      if (filtros.zona) {
        filtered = filtered.filter(c => 
          c.zona_base?.toLowerCase().includes(filtros.zona!.toLowerCase()) ||
          c.performance_metrics?.zona_operacion?.toLowerCase().includes(filtros.zona!.toLowerCase())
        );
      }
      
      if (filtros.disponibilidad !== undefined) {
        if (filtros.disponibilidad) {
          filtered = filtered.filter(c => c.disponibilidad === 'disponible');
        } else {
          filtered = filtered.filter(c => c.disponibilidad !== 'disponible');
        }
      }
      
      if (filtros.score_minimo) {
        filtered = filtered.filter(c => c.score_total >= filtros.score_minimo!);
      }

      // Ordenar por score total (más alto primero) y luego por proximidad si existe
      filtered.sort((a, b) => {
        // Primero por score total
        if (b.score_total !== a.score_total) {
          return b.score_total - a.score_total;
        }
        // Luego por proximidad si existe
        if (a.scoring_proximidad && b.scoring_proximidad) {
          return b.scoring_proximidad.score_operacional - a.scoring_proximidad.score_operacional;
        }
        return 0;
      });

      setCustodiosEnriquecidos(filtered);
    } catch (error) {
      console.error('Error enriqueciendo custodios:', error);
      // En caso de error, devolver custodios originales con valores por defecto
      const fallback: CustodioEnriquecido[] = custodios.map(custodio => ({
        ...custodio,
        score_comunicacion: 5.0,
        score_aceptacion: 5.0,
        score_confiabilidad: 10.0,
        score_total: 6.7,
        tasa_aceptacion: 0,
        tasa_respuesta: 0,
        tasa_confiabilidad: 100,
        performance_level: 'nuevo' as const,
        rejection_risk: 'medio' as const,
        response_speed: 'normal' as const
      }));
      setCustodiosEnriquecidos(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    enrichCustodios();
  }, [custodios, JSON.stringify(filtros)]);

  // Funciones helper para categorizar performance
  const getPerformanceLevel = (score: number, hasData: boolean): CustodioEnriquecido['performance_level'] => {
    if (!hasData) return 'nuevo';
    if (score >= 8.5) return 'excelente';
    if (score >= 7.0) return 'bueno';
    if (score >= 5.5) return 'regular';
    return 'malo';
  };

  const getRejectionRisk = (tasaAceptacion: number, hasData: boolean): CustodioEnriquecido['rejection_risk'] => {
    if (!hasData) return 'medio';
    if (tasaAceptacion >= 70) return 'bajo';
    if (tasaAceptacion >= 40) return 'medio';
    return 'alto';
  };

  const getResponseSpeed = (tiempoPromedio: number): CustodioEnriquecido['response_speed'] => {
    if (tiempoPromedio === 0) return 'normal'; // Sin datos
    if (tiempoPromedio <= 30) return 'rapido';
    if (tiempoPromedio <= 120) return 'normal';
    return 'lento';
  };

  // Función para obtener el mejor custodio recomendado
  const getMejorCustodio = (): CustodioEnriquecido | null => {
    if (custodiosEnriquecidos.length === 0) return null;
    return custodiosEnriquecidos[0]; // Ya está ordenado por score
  };

  // Función para obtener los top N custodios
  const getTopCustodios = (limit: number = 3): CustodioEnriquecido[] => {
    return custodiosEnriquecidos.slice(0, limit);
  };

  // Estadísticas de la selección actual
  const stats = {
    total: custodiosEnriquecidos.length,
    excelentes: custodiosEnriquecidos.filter(c => c.performance_level === 'excelente').length,
    buenos: custodiosEnriquecidos.filter(c => c.performance_level === 'bueno').length,
    regulares: custodiosEnriquecidos.filter(c => c.performance_level === 'regular').length,
    malos: custodiosEnriquecidos.filter(c => c.performance_level === 'malo').length,
    nuevos: custodiosEnriquecidos.filter(c => c.performance_level === 'nuevo').length,
    score_promedio: custodiosEnriquecidos.length > 0 
      ? custodiosEnriquecidos.reduce((sum, c) => sum + c.score_total, 0) / custodiosEnriquecidos.length 
      : 0
  };

  return {
    custodios: custodiosEnriquecidos,
    loading: loading || custodiosLoading,
    getMejorCustodio,
    getTopCustodios,
    stats,
    refetch: enrichCustodios
  };
};