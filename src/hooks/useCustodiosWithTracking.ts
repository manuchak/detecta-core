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
  experience_category: 'experimentado' | 'intermedio' | 'rookie' | 'nuevo' | 'candidato';
  
  // Razones de recomendación para UI
  razones_recomendacion?: string[];
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
  
  const { data: custodiosCategorizados, isLoading: custodiosLoading } = useCustodiosConProximidad(servicioNuevo);
  const { getAllCustodioMetrics } = useCustodioTracking();

  // Combinar todas las categorías en un array plano para compatibilidad  
  const custodios = custodiosCategorizados ? [
    ...custodiosCategorizados.disponibles,
    ...custodiosCategorizados.parcialmenteOcupados,
    ...custodiosCategorizados.ocupados
    // No incluir no_disponibles en el array principal
  ] : [];

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
        
        // Si el custodio viene de custodios_operativos, usar scores operativos reales
        const isFromOperativos = custodio.fuente === 'custodios_operativos';
        
        // Valores calculados dinámicamente para custodios sin métricas
        const defaultScores = calcularScoresIniciales(custodio);

        // Priorizar scores operativos, luego métricas de tracking, luego por defecto
        const scores = isFromOperativos ? {
          score_comunicacion: custodio.score_comunicacion || defaultScores.score_comunicacion,
          score_aceptacion: custodio.score_aceptacion || defaultScores.score_aceptacion,
          score_confiabilidad: custodio.score_confiabilidad || defaultScores.score_confiabilidad,
          score_total: custodio.score_total || defaultScores.score_total,
          tasa_aceptacion: custodio.tasa_aceptacion || defaultScores.tasa_aceptacion,
          tasa_respuesta: custodio.tasa_respuesta || defaultScores.tasa_respuesta,
          tasa_confiabilidad: custodio.tasa_confiabilidad || defaultScores.tasa_confiabilidad
        } : metrics ? {
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
        const custodioCategory = getCustodioCategory(custodio);
        const performance_level = getPerformanceLevel(scores.score_total, !!metrics, custodioCategory);
        const rejection_risk = getRejectionRisk(scores.tasa_aceptacion, !!metrics, custodioCategory);
        const response_speed = getResponseSpeed(metrics?.tiempo_promedio_respuesta_minutos || 0);

        return {
          ...custodio,
          performance_metrics: metrics,
          ...scores,
          performance_level,
          rejection_risk,
          response_speed,
          experience_category: custodioCategory
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
          // Excluir custodios temporalmente indisponibles
          filtered = filtered.filter(c => 
            c.disponibilidad === 'disponible'
          );
        } else {
          filtered = filtered.filter(c => 
            c.disponibilidad !== 'disponible'
          );
        }
      }
      
      if (filtros.score_minimo) {
        filtered = filtered.filter(c => c.score_total >= filtros.score_minimo!);
      }

      // Ordenar con prioridad por experiencia y luego por score
      filtered.sort((a, b) => {
        const aCat = getCustodioCategory(a);
        const bCat = getCustodioCategory(b);
        
        // Mapear categorías a valores de prioridad
        const getPriority = (cat: string) => {
          switch (cat) {
            case 'experimentado': return 4;
            case 'intermedio': return 3;
            case 'rookie': return 2;
            case 'nuevo': return 1;
            case 'candidato': return 0;
            default: return 0;
          }
        };
        
        const aPriority = getPriority(aCat);
        const bPriority = getPriority(bCat);
        
        // Primero por categoría de experiencia
        if (bPriority !== aPriority) {
          return bPriority - aPriority;
        }
        
        // Dentro de la misma categoría, por score total
        if (Math.abs(b.score_total - a.score_total) > 0.1) {
          return b.score_total - a.score_total;
        }
        
        // Como tiebreaker, proximidad operacional si existe
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
        response_speed: 'normal' as const,
        experience_category: getCustodioCategory(custodio)
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
  const getPerformanceLevel = (score: number, hasData: boolean, category: string): CustodioEnriquecido['performance_level'] => {
    // Custodios experimentados e intermedios usan datos reales
    if (category === 'experimentado' || category === 'intermedio') {
      if (score >= 8.5) return 'excelente';
      if (score >= 7.0) return 'bueno';
      if (score >= 5.5) return 'regular';
      return 'malo';
    }
    
    // Custodios nuevos
    if (category === 'nuevo') return 'nuevo';
    
    // Rookies o candidatos - usar score si disponible
    if (hasData || category === 'rookie') {
      if (score >= 8.0) return 'bueno';
      if (score >= 6.5) return 'regular';
      return 'malo';
    }
    
    return 'nuevo';
  };

  const getRejectionRisk = (tasaAceptacion: number, hasData: boolean, category: string): CustodioEnriquecido['rejection_risk'] => {
    // Para custodios experimentados e intermedios, usar datos reales o estimados
    if (category === 'experimentado' || category === 'intermedio') {
      if (tasaAceptacion >= 80) return 'bajo';
      if (tasaAceptacion >= 60) return 'medio';
      return 'alto';
    }
    
    // Para custodios con algún historial
    if (category === 'rookie' && hasData) {
      if (tasaAceptacion >= 75) return 'bajo';
      if (tasaAceptacion >= 50) return 'medio';
      return 'alto';
    }
    
    // Para nuevos o candidatos, riesgo medio por defecto
    return 'medio';
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
    // Estadísticas por experiencia
    experimentados: custodiosEnriquecidos.filter(c => c.experience_category === 'experimentado').length,
    intermedios: custodiosEnriquecidos.filter(c => c.experience_category === 'intermedio').length,
    rookies: custodiosEnriquecidos.filter(c => c.experience_category === 'rookie').length,
    candidatos: custodiosEnriquecidos.filter(c => c.experience_category === 'candidato').length,
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
 * Custodios históricos y operativos nunca se consideran nuevos
 */
const esNuevoCustodio = (custodio: any): boolean => {
  // Los custodios históricos y operativos nunca son "nuevos"
  if (custodio.fuente === 'historico' || 
      custodio.fuente === 'migracion_historico' || 
      custodio.fuente === 'custodios_operativos') return false;
  
  // Para custodios sin created_at, no son nuevos
  if (!custodio.created_at) return false;
  
  const fechaRegistro = new Date(custodio.created_at);
  const ahora = new Date();
  const diasTranscurridos = (ahora.getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24);
  
  return diasTranscurridos <= 7;
};

/**
 * Determina la categoría del custodio basado en su fuente y experiencia
 */
const getCustodioCategory = (custodio: any): 'nuevo' | 'experimentado' | 'intermedio' | 'rookie' | 'candidato' => {
  // Custodios históricos migrados son siempre experimentados
  if (custodio.fuente === 'historico' || custodio.fuente === 'migracion_historico') return 'experimentado';
  
  // Custodios de la tabla operativa con experiencia comprobada
  if (custodio.fuente === 'custodios_operativos') {
    const servicios = custodio.numero_servicios || 0;
    if (servicios >= 50) return 'experimentado';
    if (servicios >= 10) return 'intermedio';
    if (servicios > 0) return 'rookie';
    return esNuevoCustodio(custodio) ? 'nuevo' : 'rookie';
  }
  
  // Candidatos en proceso
  if (custodio.fuente === 'candidatos_custodios') return 'candidato';
  
  // Custodios de pc_custodios
  if (custodio.fuente === 'pc_custodios') {
    // Si tiene servicios históricos, clasificar por cantidad
    if (custodio.servicios_historicos && custodio.servicios_historicos.length > 0) {
      const servicios = custodio.servicios_historicos.length;
      if (servicios >= 50) return 'experimentado';
      if (servicios >= 10) return 'intermedio';
      return 'rookie';
    }
    
    // Si es nuevo (menos de 7 días), es nuevo
    if (esNuevoCustodio(custodio)) return 'nuevo';
    
    // Si lleva tiempo registrado pero no tiene servicios, rookie
    return 'rookie';
  }
  
  return 'rookie';
};

/**
 * Calcula scores iniciales dinámicos basados en el perfil del custodio
 */
const calcularScoresIniciales = (custodio: any) => {
  console.log('Calculando scores para custodio:', custodio.nombre, {
    fuente: custodio.fuente,
    numero_servicios: custodio.numero_servicios,
    rating_promedio: custodio.rating_promedio,
    experiencia_seguridad: custodio.experiencia_seguridad,
    vehiculo_propio: custodio.vehiculo_propio,
    certificaciones: custodio.certificaciones
  });

  // Score de comunicación basado en disponibilidad y experiencia
  let scoreComunicacion = 5.0; // Base más baja para diferenciación
  
  // Bonificaciones específicas por tipo de custodio
  if (custodio.fuente === 'historico' && custodio.numero_servicios) {
    // Custodios históricos: usar datos reales de servicios
    if (custodio.numero_servicios >= 200) scoreComunicacion = 9.8;
    else if (custodio.numero_servicios >= 100) scoreComunicacion = 9.2;
    else if (custodio.numero_servicios >= 50) scoreComunicacion = 8.5;
    else if (custodio.numero_servicios >= 20) scoreComunicacion = 7.8;
    else if (custodio.numero_servicios >= 10) scoreComunicacion = 7.0;
    else scoreComunicacion = 6.2;
    
    // Bonus por rating alto para históricos
    if (custodio.rating_promedio >= 4.5) scoreComunicacion += 0.5;
    else if (custodio.rating_promedio >= 4.0) scoreComunicacion += 0.3;
  } else {
    // Custodios nuevos: usar perfil y experiencia
    if (custodio.experiencia_seguridad) scoreComunicacion += 2.0;
    if (custodio.disponibilidad_horarios?.lunes_viernes) scoreComunicacion += 0.8;
    if (custodio.disponibilidad_horarios?.sabados) scoreComunicacion += 0.5;
    if (custodio.fuente === 'pc_custodios') scoreComunicacion += 1.5;
    if (custodio.certificaciones?.length > 0) scoreComunicacion += custodio.certificaciones.length * 0.3;
  }

  // Score de aceptación basado en experiencia y motivación
  let scoreAceptacion = 6.0; // Base más conservadora
  
  if (custodio.fuente === 'historico' && custodio.numero_servicios) {
    // Para históricos, usar experiencia real
    if (custodio.numero_servicios >= 200) scoreAceptacion = 9.5;
    else if (custodio.numero_servicios >= 100) scoreAceptacion = 8.8;
    else if (custodio.numero_servicios >= 50) scoreAceptacion = 8.2;
    else if (custodio.numero_servicios >= 20) scoreAceptacion = 7.5;
    else scoreAceptacion = 7.0;
    
    // Ajustar por rating para históricos
    if (custodio.rating_promedio >= 4.5) scoreAceptacion += 0.8;
    else if (custodio.rating_promedio >= 4.0) scoreAceptacion += 0.5;
    else if (custodio.rating_promedio < 3.5) scoreAceptacion -= 0.5;
  } else {
    // Para nuevos, usar perfil
    if (custodio.experiencia_seguridad) scoreAceptacion += 1.2;
    if (custodio.vehiculo_propio) scoreAceptacion += 0.8;
    if (custodio.expectativa_ingresos && custodio.expectativa_ingresos > 25000) scoreAceptacion += 0.6;
    if (custodio.fuente === 'candidatos_custodios' && custodio.estado_proceso === 'lead') scoreAceptacion -= 0.8;
    if (custodio.certificaciones?.length >= 3) scoreAceptacion += 0.5;
  }

  // Score de confiabilidad - empezar con fe inicial pero realista
  let scoreConfiabilidad = 8.2; // Base alta pero no perfecta
  if (custodio.fuente === 'historico') {
    // Para históricos, confiabilidad basada en experiencia
    if (custodio.numero_servicios >= 100) scoreConfiabilidad = 9.2;
    else if (custodio.numero_servicios >= 50) scoreConfiabilidad = 8.8;
    else if (custodio.numero_servicios >= 20) scoreConfiabilidad = 8.4;
    else scoreConfiabilidad = 8.0;
    
    // Ajustar por rating
    if (custodio.rating_promedio >= 4.5) scoreConfiabilidad += 0.6;
    else if (custodio.rating_promedio >= 4.0) scoreConfiabilidad += 0.3;
    else if (custodio.rating_promedio < 3.5) scoreConfiabilidad -= 0.8;
  } else {
    // Para nuevos, usar perfil
    if (custodio.experiencia_seguridad) scoreConfiabilidad += 0.8;
    if (custodio.certificaciones && custodio.certificaciones.length > 0) {
      scoreConfiabilidad += Math.min(1.0, custodio.certificaciones.length * 0.25);
    }
    if (custodio.vehiculo_propio) scoreConfiabilidad += 0.3;
  }

  // Variabilidad determinística para quienes no tienen historial (misma entrada => mismo jitter)
  if ((!custodio.numero_servicios || custodio.numero_servicios === 0) && custodio.fuente !== 'historico') {
    const seedFrom = (s: string) => {
      let h = 2166136261; // FNV-1a simple
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      return ((h >>> 0) % 1000) / 1000; // 0..1
    };
    const jitter = (key: string, amp: number) => (seedFrom(key) - 0.5) * 2 * amp; // -amp..+amp
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    scoreComunicacion = clamp(scoreComunicacion + jitter(`${custodio.nombre}_c`, 0.5), 4.5, 9.8);
    scoreAceptacion = clamp(scoreAceptacion + jitter(`${custodio.nombre}_a`, 0.7), 4.8, 9.6);
    scoreConfiabilidad = clamp(scoreConfiabilidad + jitter(`${custodio.nombre}_r`, 0.4), 5.5, 9.7);
  }

  // Calcular tasas iniciales realistas basadas en perfil con más variación
  const tasaAceptacion = Math.min(98, Math.max(70, scoreAceptacion * 9.5 + 15)); // 70-98% rango más amplio
  const tasaRespuesta = Math.min(95, Math.max(65, scoreComunicacion * 9 + 20)); // 65-95% más variación  
  const tasaConfiabilidad = Math.min(98, Math.max(80, scoreConfiabilidad * 10 + 5)); // 80-98% más realista

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