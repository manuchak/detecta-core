import { supabase } from '@/integrations/supabase/client';

export interface CustodianPermanenceData {
  custodioNombre: string;
  primerServicio: Date;
  ultimoServicio: Date;
  permanenciaMeses: number;
  totalServicios: number;
  estado: 'activo' | 'inactivo';
}

export interface DynamicRetentionMetrics {
  tiempoPromedioPermanencia: number;
  tiempoMedianoPermanencia: number;
  tendenciaMensual: number;
  factorEstacional: number;
  confianza: number;
  lastCalculated: Date;
  custodiosAnalizados: number;
  metodologia: string;
}

export interface RetentionTrendData {
  periodo: string;
  permanenciaPromedio: number;
  custodiosAnalisis: number;
  confianza: number;
}

const CACHE_DURATION_HOURS = 24;
const MIN_CUSTODIANS_FOR_ANALYSIS = 10;
const INACTIVITY_THRESHOLD_DAYS = 60;

// Cache para evitar recálculos frecuentes
let cachedMetrics: DynamicRetentionMetrics | null = null;
let lastCacheUpdate: Date | null = null;

/**
 * Calcula la permanencia dinámica de custodios basada en datos históricos reales
 */
export async function calculateDynamicRetention(): Promise<DynamicRetentionMetrics> {
  // Verificar cache
  if (cachedMetrics && lastCacheUpdate && 
      (Date.now() - lastCacheUpdate.getTime()) < (CACHE_DURATION_HOURS * 60 * 60 * 1000)) {
    return cachedMetrics;
  }

  console.log('🔄 Calculando permanencia dinámica de custodios...');

  try {
    // Obtener datos de custodios con su actividad
    const custodianData = await getCustodianPermanenceData();
    
    if (custodianData.length < MIN_CUSTODIANS_FOR_ANALYSIS) {
      console.warn(`⚠️ Pocos custodios para análisis (${custodianData.length}). Usando valores por defecto.`);
      return getDefaultMetrics();
    }

    // Calcular métricas base
    const baseMetrics = calculateBaseMetrics(custodianData);
    
    // Calcular factor de tendencia (últimos 3 meses vs anteriores)
    const trendFactor = await calculateTrendFactor();
    
    // Calcular factor estacional
    const seasonalFactor = calculateSeasonalFactor();
    
    // Combinar factores para obtener permanencia ajustada
    const adjustedPermanence = applyDynamicFactors(
      baseMetrics.permanenciaPromedio,
      trendFactor,
      seasonalFactor
    );

    const metrics: DynamicRetentionMetrics = {
      tiempoPromedioPermanencia: Math.round(adjustedPermanence * 100) / 100,
      tiempoMedianoPermanencia: baseMetrics.permanenciaMediana,
      tendenciaMensual: trendFactor,
      factorEstacional: seasonalFactor,
      confianza: calculateConfidence(custodianData.length),
      lastCalculated: new Date(),
      custodiosAnalizados: custodianData.length,
      metodologia: 'dynamic_empirical_v1'
    };

    // Actualizar cache
    cachedMetrics = metrics;
    lastCacheUpdate = new Date();

    console.log('✅ Permanencia dinámica calculada:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Error calculando permanencia dinámica:', error);
    return getDefaultMetrics();
  }
}

/**
 * Obtiene datos de permanencia de todos los custodios
 */
async function getCustodianPermanenceData(): Promise<CustodianPermanenceData[]> {
  const { data, error } = await supabase
    .from('servicios_custodia')
    .select(`
      nombre_custodio,
      fecha_primer_servicio,
      fecha_hora_cita,
      estado
    `)
    .not('nombre_custodio', 'is', null)
    .not('fecha_primer_servicio', 'is', null)
    .order('fecha_hora_cita', { ascending: false });

  if (error) throw error;

  // Agrupar por custodio y calcular permanencia
  const custodianMap = new Map<string, {
    primerServicio: Date;
    ultimoServicio: Date;
    totalServicios: number;
    serviciosCompletados: number;
  }>();

  data?.forEach(servicio => {
    const nombre = servicio.nombre_custodio;
    const fechaServicio = new Date(servicio.fecha_hora_cita);
    const fechaPrimer = new Date(servicio.fecha_primer_servicio);

    if (!custodianMap.has(nombre)) {
      custodianMap.set(nombre, {
        primerServicio: fechaPrimer,
        ultimoServicio: fechaServicio,
        totalServicios: 0,
        serviciosCompletados: 0
      });
    }

    const custodian = custodianMap.get(nombre)!;
    custodian.totalServicios++;
    
    if (servicio.estado?.toLowerCase().includes('completado') || 
        servicio.estado?.toLowerCase().includes('finalizado')) {
      custodian.serviciosCompletados++;
    }

    // Actualizar fechas
    if (fechaServicio > custodian.ultimoServicio) {
      custodian.ultimoServicio = fechaServicio;
    }
    if (fechaPrimer < custodian.primerServicio) {
      custodian.primerServicio = fechaPrimer;
    }
  });

  // Convertir a array con cálculos de permanencia
  const permanenceData: CustodianPermanenceData[] = [];
  const ahora = new Date();

  custodianMap.forEach((data, nombre) => {
    const diasSinActividad = (ahora.getTime() - data.ultimoServicio.getTime()) / (1000 * 60 * 60 * 24);
    const permanenciaDias = (data.ultimoServicio.getTime() - data.primerServicio.getTime()) / (1000 * 60 * 60 * 24);
    const permanenciaMeses = permanenciaDias / 30.44; // Promedio de días por mes

    // Solo incluir custodios con permanencia mínima
    if (permanenciaMeses >= 0.1 && data.totalServicios >= 1) {
      permanenceData.push({
        custodioNombre: nombre,
        primerServicio: data.primerServicio,
        ultimoServicio: data.ultimoServicio,
        permanenciaMeses: Math.round(permanenciaMeses * 100) / 100,
        totalServicios: data.totalServicios,
        estado: diasSinActividad > INACTIVITY_THRESHOLD_DAYS ? 'inactivo' : 'activo'
      });
    }
  });

  return permanenceData;
}

/**
 * Calcula métricas base de permanencia
 */
function calculateBaseMetrics(data: CustodianPermanenceData[]) {
  const permanencias = data.map(c => c.permanenciaMeses).sort((a, b) => a - b);
  const suma = permanencias.reduce((acc, val) => acc + val, 0);
  
  return {
    permanenciaPromedio: suma / permanencias.length,
    permanenciaMediana: permanencias[Math.floor(permanencias.length / 2)],
    permanenciaMin: permanencias[0],
    permanenciaMax: permanencias[permanencias.length - 1]
  };
}

/**
 * Calcula factor de tendencia comparando períodos recientes vs históricos
 */
async function calculateTrendFactor(): Promise<number> {
  try {
    const fechaLimiteReciente = new Date();
    fechaLimiteReciente.setMonth(fechaLimiteReciente.getMonth() - 3); // Últimos 3 meses

    const fechaLimiteHistorico = new Date();
    fechaLimiteHistorico.setMonth(fechaLimiteHistorico.getMonth() - 12); // Últimos 12 meses

    // Obtener retención de período reciente
    const { data: recentData } = await supabase
      .from('metricas_retencion_mensual')
      .select('tasa_retencion')
      .gte('mes', fechaLimiteReciente.toISOString().split('T')[0])
      .order('mes', { ascending: false });

    // Obtener retención de período histórico
    const { data: historicalData } = await supabase
      .from('metricas_retencion_mensual')
      .select('tasa_retencion')
      .gte('mes', fechaLimiteHistorico.toISOString().split('T')[0])
      .lt('mes', fechaLimiteReciente.toISOString().split('T')[0])
      .order('mes', { ascending: false });

    if (!recentData?.length || !historicalData?.length) {
      return 1.0; // Factor neutro
    }

    const recentAvg = recentData.reduce((sum, item) => sum + Number(item.tasa_retencion), 0) / recentData.length;
    const historicalAvg = historicalData.reduce((sum, item) => sum + Number(item.tasa_retencion), 0) / historicalData.length;

    // Factor entre 0.7 y 1.3 para suavizar cambios drásticos
    const rawFactor = recentAvg / historicalAvg;
    return Math.max(0.7, Math.min(1.3, rawFactor));

  } catch (error) {
    console.warn('Error calculando factor de tendencia:', error);
    return 1.0;
  }
}

/**
 * Calcula factor estacional basado en el mes actual
 */
function calculateSeasonalFactor(): number {
  const mesActual = new Date().getMonth(); // 0 = enero, 11 = diciembre
  
  // Factores estacionales basados en patrones típicos de retención laboral
  const factoresEstacionales = [
    1.05, // Enero - alta rotación post-navideña
    0.95, // Febrero - estabilización
    0.98, // Marzo
    1.02, // Abril - renovación laboral
    0.92, // Mayo - época estable
    0.94, // Junio
    1.08, // Julio - vacaciones/cambios
    1.06, // Agosto
    0.96, // Septiembre - regreso estabilidad
    0.98, // Octubre
    1.04, // Noviembre - preparación fin de año
    1.12  // Diciembre - alta rotación navideña
  ];

  return factoresEstacionales[mesActual];
}

/**
 * Aplica factores dinámicos a la permanencia base
 */
function applyDynamicFactors(
  basePermanence: number,
  trendFactor: number,
  seasonalFactor: number
): number {
  // Aplicar factores con pesos
  const adjustedPermanence = basePermanence * 
    (0.7 + (trendFactor * 0.2) + (seasonalFactor * 0.1));

  // Límites de seguridad para evitar valores irreales
  return Math.max(1.0, Math.min(15.0, adjustedPermanence));
}

/**
 * Calcula nivel de confianza basado en cantidad de datos
 */
function calculateConfidence(custodianCount: number): number {
  if (custodianCount < 10) return 0.3;
  if (custodianCount < 25) return 0.5;
  if (custodianCount < 50) return 0.7;
  if (custodianCount < 100) return 0.85;
  return 0.95;
}

/**
 * Retorna métricas por defecto cuando no hay suficientes datos
 */
function getDefaultMetrics(): DynamicRetentionMetrics {
  return {
    tiempoPromedioPermanencia: 5.4,
    tiempoMedianoPermanencia: 4.8,
    tendenciaMensual: 1.0,
    factorEstacional: 1.0,
    confianza: 0.3,
    lastCalculated: new Date(),
    custodiosAnalizados: 0,
    metodologia: 'default_fallback'
  };
}

/**
 * Obtiene datos de tendencia histórica para visualización
 */
export async function getRetentionTrendData(): Promise<RetentionTrendData[]> {
  try {
    const { data, error } = await supabase
      .from('metricas_retencion_mensual')
      .select('mes, tasa_retencion, custodios_mes_anterior')
      .order('mes', { ascending: false })
      .limit(12);

    if (error) throw error;

    return data?.map(item => ({
      periodo: new Date(item.mes).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short' 
      }),
      permanenciaPromedio: Number(item.tasa_retencion) / 100 * 5.4, // Estimación basada en retención
      custodiosAnalisis: item.custodios_mes_anterior || 0,
      confianza: item.custodios_mes_anterior > 20 ? 0.8 : 0.5
    })) || [];

  } catch (error) {
    console.error('Error obteniendo datos de tendencia:', error);
    return [];
  }
}

/**
 * Fuerza la actualización del cache
 */
export function forceRecalculation(): void {
  cachedMetrics = null;
  lastCacheUpdate = null;
  console.log('🔄 Cache de permanencia limpiado, próximo cálculo será forzado');
}