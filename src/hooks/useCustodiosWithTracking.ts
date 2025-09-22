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
        
        // Valores calculados dinámicamente para custodios sin métricas
        const defaultScores = calcularScoresIniciales(custodio);

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
        const isNew = esNuevoCustodio(custodio);
        const performance_level = getPerformanceLevel(scores.score_total, !!metrics, isNew);
        const rejection_risk = getRejectionRisk(scores.tasa_aceptacion, !!metrics, isNew);
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
        ...calcularScoresIniciales(custodio),
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
  const getPerformanceLevel = (score: number, hasData: boolean, isNew: boolean): CustodioEnriquecido['performance_level'] => {
    if (isNew) return 'nuevo';
    if (!hasData) return 'nuevo'; // Sin historial reciente
    if (score >= 8.5) return 'excelente';
    if (score >= 7.0) return 'bueno';
    if (score >= 5.5) return 'regular';
    return 'malo';
  };

  const getRejectionRisk = (tasaAceptacion: number, hasData: boolean, isNew: boolean): CustodioEnriquecido['rejection_risk'] => {
    if (isNew || !hasData) return 'medio'; // Riesgo medio para nuevos
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

/**
 * Determina si un custodio es realmente nuevo (menos de 7 días de registro)
 */
const esNuevoCustodio = (custodio: any): boolean => {
  if (!custodio.created_at) return false;
  
  const fechaRegistro = new Date(custodio.created_at);
  const ahora = new Date();
  const diasTranscurridos = (ahora.getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24);
  
  return diasTranscurridos <= 7;
};

/**
 * Calcula scores iniciales dinámicos basados en el perfil del custodio
 */
const calcularScoresIniciales = (custodio: any) => {
  // Score de comunicación basado en disponibilidad y experiencia
  let scoreComunicacion = 6.0; // Base neutral
  if (custodio.experiencia_seguridad) scoreComunicacion += 1.5;
  if (custodio.disponibilidad_horarios?.lunes_viernes) scoreComunicacion += 0.5;
  if (custodio.disponibilidad_horarios?.sabados) scoreComunicacion += 0.3;
  if (custodio.fuente === 'pc_custodios') scoreComunicacion += 1.0; // Custodios establecidos

  // Score de aceptación basado en motivación y experiencia
  let scoreAceptacion = 7.0; // Base optimista
  if (custodio.experiencia_seguridad) scoreAceptacion += 1.0;
  if (custodio.vehiculo_propio) scoreAceptacion += 0.5;
  if (custodio.expectativa_ingresos && custodio.expectativa_ingresos > 25000) scoreAceptacion += 0.8;
  if (custodio.fuente === 'candidatos_custodios' && custodio.estado_proceso === 'lead') scoreAceptacion -= 1.0;

  // Score de confiabilidad - empezar con fe inicial pero realista
  let scoreConfiabilidad = 8.5; // Base alta pero no perfecta
  if (custodio.experiencia_seguridad) scoreConfiabilidad += 0.5;
  if (custodio.certificaciones && custodio.certificaciones.length > 0) {
    scoreConfiabilidad += Math.min(0.8, custodio.certificaciones.length * 0.2);
  }

  // Calcular tasas iniciales realistas basadas en perfil
  const tasaAceptacion = Math.min(95, scoreAceptacion * 10 + 15); // 85-95% inicial
  const tasaRespuesta = Math.min(95, scoreComunicacion * 10 + 20); // 80-95% inicial
  const tasaConfiabilidad = Math.min(98, scoreConfiabilidad * 10 + 5); // 85-98% inicial

  // Score total como promedio ponderado
  const scoreTotal = (scoreComunicacion * 0.3 + scoreAceptacion * 0.4 + scoreConfiabilidad * 0.3);

  return {
    score_comunicacion: Math.round(scoreComunicacion * 10) / 10,
    score_aceptacion: Math.round(scoreAceptacion * 10) / 10,
    score_confiabilidad: Math.round(scoreConfiabilidad * 10) / 10,
    score_total: Math.round(scoreTotal * 10) / 10,
    tasa_aceptacion: Math.round(tasaAceptacion * 10) / 10,
    tasa_respuesta: Math.round(tasaRespuesta * 10) / 10,
    tasa_confiabilidad: Math.round(tasaConfiabilidad * 10) / 10
  };
};