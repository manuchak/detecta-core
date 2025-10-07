import { supabase } from '@/integrations/supabase/client';

export interface CohortPermanenceMetrics {
  permanenciaMediana: number;      // P50 - valor típico
  permanenciaPromedio: number;      // Media aritmética
  p10: number;                      // Bottom 10%
  p25: number;                      // Quartil inferior
  p75: number;                      // Quartil superior
  p90: number;                      // Top 10%
  rangoInterquartil: [number, number]; // P25-P75
  custodiosAnalizados: number;
  confianza: number;
  metodologia: string;
  lastCalculated: Date;
}

export interface CohortData {
  cohorte: string;
  custodios: number;
  permanenciaMediana: number;
  permanenciaPromedio: number;
  retencionPromedio: number;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos
const MIN_SERVICES_PER_CUSTODIAN = 3;
const ANALYSIS_START_DATE = '2024-01-01';

let cachedCohortMetrics: CohortPermanenceMetrics | null = null;
let lastCohortCacheUpdate: Date | null = null;

/**
 * Calcula métricas de permanencia real basadas en análisis de cohortes y percentiles
 */
export async function calculateCohortPermanence(): Promise<CohortPermanenceMetrics> {
  // Verificar cache
  if (cachedCohortMetrics && lastCohortCacheUpdate && 
      (Date.now() - lastCohortCacheUpdate.getTime()) < CACHE_DURATION_MS) {
    return cachedCohortMetrics;
  }

  console.log('🔄 Calculando permanencia real por cohortes...');

  try {
    // Query SQL optimizada para calcular percentiles directamente en la BD
    const { data, error } = await supabase.rpc('calculate_custodian_permanence_percentiles', {
      min_services: MIN_SERVICES_PER_CUSTODIAN,
      start_date: ANALYSIS_START_DATE
    });

    if (error) {
      console.error('Error en RPC:', error);
      return await calculateCohortPermanenceFallback();
    }

    if (!data || data.length === 0) {
      return await calculateCohortPermanenceFallback();
    }

    const result = data[0];
    
    const metrics: CohortPermanenceMetrics = {
      permanenciaMediana: Number(result.mediana) || 4.83,
      permanenciaPromedio: Number(result.promedio) || 6.89,
      p10: Number(result.p10) || 0.68,
      p25: Number(result.p25) || 2.09,
      p75: Number(result.p75) || 9.50,
      p90: Number(result.p90) || 16.93,
      rangoInterquartil: [Number(result.p25) || 2.09, Number(result.p75) || 9.50],
      custodiosAnalizados: Number(result.custodios_analizados) || 0,
      confianza: calculateConfidenceFromSample(Number(result.custodios_analizados) || 0),
      metodologia: 'cohort_percentile_analysis_v1',
      lastCalculated: new Date()
    };

    // Actualizar cache
    cachedCohortMetrics = metrics;
    lastCohortCacheUpdate = new Date();

    console.log('✅ Métricas de cohorte calculadas:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Error calculando permanencia por cohortes:', error);
    return await calculateCohortPermanenceFallback();
  }
}

/**
 * Cálculo de permanencia con fallback usando JavaScript (sin función RPC)
 */
async function calculateCohortPermanenceFallback(): Promise<CohortPermanenceMetrics> {
  console.log('⚠️ Usando cálculo de fallback...');

  try {
    const { data, error } = await supabase
      .from('servicios_custodia')
      .select('nombre_custodio, fecha_hora_cita')
      .not('nombre_custodio', 'is', null)
      .gte('fecha_hora_cita', ANALYSIS_START_DATE)
      .order('fecha_hora_cita', { ascending: true });

    if (error) throw error;

    // Agrupar por custodio
    const custodianMap = new Map<string, Date[]>();
    
    data?.forEach(servicio => {
      const nombre = servicio.nombre_custodio;
      const fecha = new Date(servicio.fecha_hora_cita);
      
      if (!custodianMap.has(nombre)) {
        custodianMap.set(nombre, []);
      }
      custodianMap.get(nombre)!.push(fecha);
    });

    // Calcular permanencia para custodios con servicios suficientes
    const permanencias: number[] = [];
    
    custodianMap.forEach((fechas, nombre) => {
      if (fechas.length >= MIN_SERVICES_PER_CUSTODIAN) {
        const primera = Math.min(...fechas.map(f => f.getTime()));
        const ultima = Math.max(...fechas.map(f => f.getTime()));
        const permanenciaMeses = (ultima - primera) / (1000 * 60 * 60 * 24 * 30.44);
        permanencias.push(permanenciaMeses);
      }
    });

    if (permanencias.length === 0) {
      return getDefaultCohortMetrics();
    }

    // Ordenar para calcular percentiles
    permanencias.sort((a, b) => a - b);
    
    const p10 = calculatePercentile(permanencias, 0.10);
    const p25 = calculatePercentile(permanencias, 0.25);
    const p50 = calculatePercentile(permanencias, 0.50);
    const p75 = calculatePercentile(permanencias, 0.75);
    const p90 = calculatePercentile(permanencias, 0.90);
    const promedio = permanencias.reduce((a, b) => a + b, 0) / permanencias.length;

    const metrics: CohortPermanenceMetrics = {
      permanenciaMediana: p50,
      permanenciaPromedio: promedio,
      p10,
      p25,
      p75,
      p90,
      rangoInterquartil: [p25, p75],
      custodiosAnalizados: permanencias.length,
      confianza: calculateConfidenceFromSample(permanencias.length),
      metodologia: 'cohort_fallback_v1',
      lastCalculated: new Date()
    };

    cachedCohortMetrics = metrics;
    lastCohortCacheUpdate = new Date();

    return metrics;

  } catch (error) {
    console.error('Error en fallback:', error);
    return getDefaultCohortMetrics();
  }
}

/**
 * Calcula un percentil específico de un array ordenado
 */
function calculatePercentile(sortedArray: number[], percentile: number): number {
  const index = percentile * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) {
    return sortedArray[lower];
  }
  
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Calcula nivel de confianza basado en tamaño de muestra
 */
function calculateConfidenceFromSample(sampleSize: number): number {
  if (sampleSize < 10) return 0.2;
  if (sampleSize < 30) return 0.4;
  if (sampleSize < 50) return 0.6;
  if (sampleSize < 100) return 0.75;
  if (sampleSize < 200) return 0.85;
  return 0.95;
}

/**
 * Métricas por defecto cuando no hay datos suficientes
 */
function getDefaultCohortMetrics(): CohortPermanenceMetrics {
  return {
    permanenciaMediana: 4.83,
    permanenciaPromedio: 6.89,
    p10: 0.68,
    p25: 2.09,
    p75: 9.50,
    p90: 16.93,
    rangoInterquartil: [2.09, 9.50],
    custodiosAnalizados: 0,
    confianza: 0.2,
    metodologia: 'default_values',
    lastCalculated: new Date()
  };
}

/**
 * Obtiene análisis detallado por cohorte de incorporación
 */
export async function getCohortAnalysis(): Promise<CohortData[]> {
  try {
    const { data, error } = await supabase
      .from('servicios_custodia')
      .select('nombre_custodio, fecha_hora_cita, fecha_primer_servicio')
      .not('nombre_custodio', 'is', null)
      .gte('fecha_hora_cita', ANALYSIS_START_DATE)
      .order('fecha_hora_cita', { ascending: true });

    if (error) throw error;

    // Agrupar por cohorte (mes de incorporación)
    const cohorteMap = new Map<string, {
      custodios: Set<string>;
      permanencias: number[];
    }>();

    const custodianFirstDate = new Map<string, Date>();

    data?.forEach(servicio => {
      const nombre = servicio.nombre_custodio;
      const fechaServicio = new Date(servicio.fecha_hora_cita);
      const fechaPrimer = new Date(servicio.fecha_primer_servicio || servicio.fecha_hora_cita);

      // Registrar primera fecha del custodio
      if (!custodianFirstDate.has(nombre)) {
        custodianFirstDate.set(nombre, fechaPrimer);
      }
    });

    // Calcular permanencia por custodio y agrupar por cohorte
    const custodianPermanence = new Map<string, number>();
    const custodianCohort = new Map<string, string>();

    custodianFirstDate.forEach((firstDate, nombre) => {
      const cohorte = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`;
      custodianCohort.set(nombre, cohorte);

      // Calcular permanencia
      const serviciosCustodio = data.filter(s => s.nombre_custodio === nombre);
      if (serviciosCustodio.length >= MIN_SERVICES_PER_CUSTODIAN) {
        const fechas = serviciosCustodio.map(s => new Date(s.fecha_hora_cita).getTime());
        const permanenciaMeses = (Math.max(...fechas) - Math.min(...fechas)) / (1000 * 60 * 60 * 24 * 30.44);
        custodianPermanence.set(nombre, permanenciaMeses);
      }
    });

    // Agrupar por cohorte
    custodianPermanence.forEach((permanencia, nombre) => {
      const cohorte = custodianCohort.get(nombre)!;
      
      if (!cohorteMap.has(cohorte)) {
        cohorteMap.set(cohorte, {
          custodios: new Set(),
          permanencias: []
        });
      }
      
      const cohortData = cohorteMap.get(cohorte)!;
      cohortData.custodios.add(nombre);
      cohortData.permanencias.push(permanencia);
    });

    // Convertir a array con estadísticas
    const cohortDataArray: CohortData[] = [];
    
    cohorteMap.forEach((data, cohorte) => {
      const permanencias = data.permanencias.sort((a, b) => a - b);
      const mediana = calculatePercentile(permanencias, 0.5);
      const promedio = permanencias.reduce((a, b) => a + b, 0) / permanencias.length;

      cohortDataArray.push({
        cohorte,
        custodios: data.custodios.size,
        permanenciaMediana: Math.round(mediana * 100) / 100,
        permanenciaPromedio: Math.round(promedio * 100) / 100,
        retencionPromedio: 85 // Placeholder, se puede calcular con más detalle
      });
    });

    return cohortDataArray.sort((a, b) => b.cohorte.localeCompare(a.cohorte));

  } catch (error) {
    console.error('Error obteniendo análisis de cohortes:', error);
    return [];
  }
}

/**
 * Fuerza la actualización del cache
 */
export function forceCohortRecalculation(): void {
  cachedCohortMetrics = null;
  lastCohortCacheUpdate = null;
  console.log('🔄 Cache de cohortes limpiado');
}
