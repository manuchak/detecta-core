// Weekly Pattern Analysis for Enhanced GMV Forecasting
import { supabase } from '@/integrations/supabase/client';

export interface WeeklyPattern {
  week1Ratio: number;
  week2Ratio: number;
  week3Ratio: number;
  week4Ratio: number;
  weekendBoost: number;
  monthlyTotal: number;
  confidence: number;
}

export interface IntraMonthProjection {
  currentWeekProgress: number;
  projectedWeekEnd: number;
  projectedMonthEnd: number;
  multiplierUsed: number;
  confidence: 'Alta' | 'Media' | 'Baja';
  methodology: string;
}

export interface DynamicAOV {
  currentMonthAOV: number;
  historicalAOV: number;
  aovTrend: number;
  deviationFromHistorical: number;
  isSignificantChange: boolean;
}

/**
 * Analyzes historical weekly patterns within months
 */
export async function analyzeWeeklyPatterns(): Promise<WeeklyPattern> {
  try {
    console.log('🔍 ANÁLISIS DE PATRONES SEMANALES - Iniciando...');
    
    // Fetch historical data for the last 3 months to establish patterns
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { data: historicalData, error } = await supabase
      .from('servicios_custodia')
      .select(`
        fecha_hora_cita,
        cobro_cliente,
        estado
      `)
      .gte('fecha_hora_cita', threeMonthsAgo.toISOString())
      .not('estado', 'ilike', '%cancelado%')
      .not('cobro_cliente', 'is', null);

    if (error) {
      console.error('❌ Error fetching historical data:', error);
      return getDefaultWeeklyPattern();
    }

    console.log(`📊 Datos históricos obtenidos: ${historicalData?.length || 0} registros`);

    // Group data by month and week
    const monthlyWeeklyData: { [month: string]: { [week: number]: { services: number; gmv: number } } } = {};

    historicalData?.forEach(record => {
      const date = new Date(record.fecha_hora_cita);
      if (isNaN(date.getTime())) return;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const weekOfMonth = getWeekOfMonth(date);
      const cobro = parseFloat(record.cobro_cliente?.toString() || '0') || 0;
      
      if (!monthlyWeeklyData[monthKey]) {
        monthlyWeeklyData[monthKey] = { 1: { services: 0, gmv: 0 }, 2: { services: 0, gmv: 0 }, 3: { services: 0, gmv: 0 }, 4: { services: 0, gmv: 0 } };
      }
      
      monthlyWeeklyData[monthKey][weekOfMonth].services += 1;
      monthlyWeeklyData[monthKey][weekOfMonth].gmv += cobro;
    });

    // Calculate average weekly ratios
    const weeklyRatios = { 1: [], 2: [], 3: [], 4: [] } as { [week: number]: number[] };
    
    Object.entries(monthlyWeeklyData).forEach(([month, weeks]) => {
      const monthTotal = Object.values(weeks).reduce((sum, week) => sum + week.gmv, 0);
      
      if (monthTotal > 0) {
        [1, 2, 3, 4].forEach(weekNum => {
          const ratio = weeks[weekNum].gmv / monthTotal;
          weeklyRatios[weekNum].push(ratio);
        });
      }
    });

    // Calculate final ratios with fallbacks
    const week1Ratio = calculateAverage(weeklyRatios[1]) || 0.20; // 20% típico semana 1
    const week2Ratio = calculateAverage(weeklyRatios[2]) || 0.28; // 28% típico semana 2
    const week3Ratio = calculateAverage(weeklyRatios[3]) || 0.30; // 30% típico semana 3
    const week4Ratio = calculateAverage(weeklyRatios[4]) || 0.22; // 22% típico semana 4

    const confidence = Object.keys(monthlyWeeklyData).length >= 2 ? 0.8 : 0.5;

    console.log('📈 PATRONES SEMANALES DETECTADOS:', {
      week1Ratio: `${(week1Ratio * 100).toFixed(1)}%`,
      week2Ratio: `${(week2Ratio * 100).toFixed(1)}%`,
      week3Ratio: `${(week3Ratio * 100).toFixed(1)}%`,
      week4Ratio: `${(week4Ratio * 100).toFixed(1)}%`,
      confidence: `${(confidence * 100).toFixed(1)}%`,
      monthsAnalyzed: Object.keys(monthlyWeeklyData).length
    });

    return {
      week1Ratio,
      week2Ratio,
      week3Ratio,
      week4Ratio,
      weekendBoost: 1.1, // 10% boost for weekends (estimado)
      monthlyTotal: 1.0,
      confidence
    };

  } catch (error) {
    console.error('❌ Error analyzing weekly patterns:', error);
    return getDefaultWeeklyPattern();
  }
}

/**
 * Projects month-end based on current week performance
 */
export async function calculateIntraMonthProjection(
  weeklyPatterns: WeeklyPattern,
  currentDate: Date = new Date()
): Promise<IntraMonthProjection> {
  try {
    console.log('🎯 PROYECCIÓN INTRA-MES - Iniciando cálculo...');
    
    // Get current month data
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentWeek = getWeekOfMonth(currentDate);
    
    const { data: currentMonthData, error } = await supabase
      .from('servicios_custodia')
      .select(`
        fecha_hora_cita,
        cobro_cliente,
        estado
      `)
      .gte('fecha_hora_cita', startOfMonth.toISOString())
      .lte('fecha_hora_cita', currentDate.toISOString())
      .not('estado', 'ilike', '%cancelado%')
      .not('cobro_cliente', 'is', null);

    if (error) {
      console.error('❌ Error fetching current month data:', error);
      return getDefaultProjection();
    }

    // Calculate current accumulated GMV
    let currentAccumulatedGMV = 0;
    let firstWeekGMV = 0;
    
    currentMonthData?.forEach(record => {
      const date = new Date(record.fecha_hora_cita);
      const cobro = parseFloat(record.cobro_cliente?.toString() || '0') || 0;
      
      currentAccumulatedGMV += cobro;
      
      // First week data (días 1-7)
      if (date.getDate() <= 7) {
        firstWeekGMV += cobro;
      }
    });

    console.log('📊 DATOS ACTUALES DEL MES:', {
      currentAccumulatedGMV,
      firstWeekGMV,
      currentWeek,
      recordsFound: currentMonthData?.length || 0
    });

    // PROJECT using different methodologies
    let projectedMonthEnd: number;
    let methodology: string;
    let multiplierUsed: number;
    let confidence: 'Alta' | 'Media' | 'Baja';

    // Methodology 1: First week multiplier (user's hypothesis - PRIORITIZED)
    if (firstWeekGMV >= 1600000 && currentDate.getDate() >= 7) {
      // STRONG FIRST WEEK ($1.6M+) - Apply user's reasoning
      const conservativeMultiplier = 4.25; // Conservative 4.25x for strong weeks
      projectedMonthEnd = Math.max(firstWeekGMV * conservativeMultiplier, 6800000); // Floor at $6.8M
      methodology = 'Primera semana fuerte - Proyección conservadora 4.25x';
      multiplierUsed = conservativeMultiplier;
      confidence = 'Alta';
      
      console.log('🚀 PRIMERA SEMANA FUERTE DETECTADA:', {
        firstWeekGMV: `$${(firstWeekGMV/1000000).toFixed(1)}M`,
        multiplierUsed,
        projectedMonthEnd: `$${(projectedMonthEnd/1000000).toFixed(1)}M`,
        reasoning: 'Usuario: primera semana floja + $1.6M = mínimo $6.5-6.8M'
      });
    } else if (firstWeekGMV > 0 && currentDate.getDate() >= 7) {
      // Normal first week - use historical patterns
      const firstWeekMultiplier = 1 / weeklyPatterns.week1Ratio;
      projectedMonthEnd = firstWeekGMV * firstWeekMultiplier;
      methodology = 'Primera semana normal con multiplicador histórico';
      multiplierUsed = firstWeekMultiplier;
      confidence = weeklyPatterns.confidence > 0.7 ? 'Alta' : 'Media';
      
      console.log('📊 METODOLOGÍA HISTÓRICA - Primera semana normal:', {
        firstWeekGMV: `$${(firstWeekGMV/1000000).toFixed(1)}M`,
        week1Ratio: weeklyPatterns.week1Ratio,
        multiplierUsed,
        projectedMonthEnd: `$${(projectedMonthEnd/1000000).toFixed(1)}M`
      });
      
    } else if (currentAccumulatedGMV > 0) {
      // Methodology 2: Progressive accumulation
      const dayOfMonth = currentDate.getDate();
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const monthProgress = dayOfMonth / daysInMonth;
      
      // Adjust for typical front-loading (first week usually weaker)
      let adjustmentFactor = 1.0;
      if (monthProgress <= 0.25) adjustmentFactor = 1.4; // First quarter needs boost
      else if (monthProgress <= 0.5) adjustmentFactor = 1.2;
      else if (monthProgress <= 0.75) adjustmentFactor = 1.1;
      
      projectedMonthEnd = (currentAccumulatedGMV / monthProgress) * adjustmentFactor;
      methodology = 'Acumulación progresiva con ajuste de front-loading';
      multiplierUsed = adjustmentFactor / monthProgress;
      confidence = monthProgress > 0.25 ? 'Media' : 'Baja';
      
      console.log('🚀 METODOLOGÍA 2 - Acumulación progresiva:', {
        currentAccumulatedGMV,
        monthProgress: `${(monthProgress * 100).toFixed(1)}%`,
        adjustmentFactor,
        multiplierUsed,
        projectedMonthEnd
      });
      
    } else {
      // Fallback to historical average
      projectedMonthEnd = 4800000; // $4.8M historical average
      methodology = 'Promedio histórico (fallback)';
      multiplierUsed = 1.0;
      confidence = 'Baja';
    }

    // Apply minimum threshold based on user's analysis
    if (firstWeekGMV >= 1600000) { // $1.6M+ first week
      const minimumProjection = 6500000; // $6.5M minimum expectation
      if (projectedMonthEnd < minimumProjection) {
        console.log('⚡ AJUSTE POR MOMENTUM FUERTE - Aplicando piso mínimo');
        projectedMonthEnd = minimumProjection;
        methodology += ' + ajuste por momentum fuerte';
        confidence = 'Alta';
      }
    }

    console.log('🎯 PROYECCIÓN FINAL:', {
      projectedMonthEnd,
      methodology,
      confidence,
      multiplierUsed
    });

    return {
      currentWeekProgress: currentDate.getDate() / 7, // Approximation
      projectedWeekEnd: firstWeekGMV > 0 ? firstWeekGMV : currentAccumulatedGMV,
      projectedMonthEnd,
      multiplierUsed,
      confidence,
      methodology
    };

  } catch (error) {
    console.error('❌ Error calculating intra-month projection:', error);
    return getDefaultProjection();
  }
}

/**
 * Calculates dynamic AOV and detects significant changes
 */
export async function calculateDynamicAOV(): Promise<DynamicAOV> {
  try {
    console.log('💰 AOV DINÁMICO - Iniciando análisis...');
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { data: recentData, error } = await supabase
      .from('servicios_custodia')
      .select(`
        fecha_hora_cita,
        cobro_cliente,
        estado
      `)
      .gte('fecha_hora_cita', threeMonthsAgo.toISOString())
      .not('estado', 'ilike', '%cancelado%')
      .not('cobro_cliente', 'is', null);

    if (error) {
      console.error('❌ Error fetching AOV data:', error);
      return getDefaultAOV();
    }

    // Current month AOV
    const currentMonthServices: number[] = [];
    const currentMonthRevenue: number[] = [];
    
    // Historical AOV (last 3 months excluding current)
    const historicalServices: number[] = [];
    const historicalRevenue: number[] = [];
    
    recentData?.forEach(record => {
      const date = new Date(record.fecha_hora_cita);
      const cobro = parseFloat(record.cobro_cliente?.toString() || '0') || 0;
      
      if (isNaN(date.getTime()) || cobro <= 0) return;
      
      if (date >= startOfMonth) {
        currentMonthServices.push(1);
        currentMonthRevenue.push(cobro);
      } else {
        historicalServices.push(1);
        historicalRevenue.push(cobro);
      }
    });

    const currentMonthAOV = currentMonthRevenue.length > 0 
      ? currentMonthRevenue.reduce((sum, val) => sum + val, 0) / currentMonthServices.length
      : 0;
      
    const historicalAOV = historicalRevenue.length > 0
      ? historicalRevenue.reduce((sum, val) => sum + val, 0) / historicalServices.length
      : 6350; // Fallback to known YTD average

    const deviationFromHistorical = historicalAOV > 0 
      ? ((currentMonthAOV - historicalAOV) / historicalAOV) * 100
      : 0;
      
    const isSignificantChange = Math.abs(deviationFromHistorical) > 5; // >5% change
    
    const aovTrend = currentMonthAOV > historicalAOV ? 1 : currentMonthAOV < historicalAOV ? -1 : 0;

    console.log('💰 ANÁLISIS AOV COMPLETADO:', {
      currentMonthAOV: `$${currentMonthAOV.toFixed(0)}`,
      historicalAOV: `$${historicalAOV.toFixed(0)}`,
      deviationFromHistorical: `${deviationFromHistorical.toFixed(1)}%`,
      isSignificantChange,
      currentMonthSamples: currentMonthServices.length,
      historicalSamples: historicalServices.length
    });

    return {
      currentMonthAOV,
      historicalAOV,
      aovTrend,
      deviationFromHistorical,
      isSignificantChange
    };

  } catch (error) {
    console.error('❌ Error calculating dynamic AOV:', error);
    return getDefaultAOV();
  }
}

// Helper functions
function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const firstWeekday = firstDay.getDay();
  
  // Calculate which week of the month (1-4)
  const weekNumber = Math.ceil((dayOfMonth + firstWeekday) / 7);
  return Math.min(weekNumber, 4); // Cap at week 4
}

function calculateAverage(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

function getDefaultWeeklyPattern(): WeeklyPattern {
  return {
    week1Ratio: 0.20, // 20% - Primera semana típicamente más baja
    week2Ratio: 0.28, // 28% - Segunda semana se recupera
    week3Ratio: 0.30, // 30% - Tercera semana pico
    week4Ratio: 0.22, // 22% - Cuarta semana cierre
    weekendBoost: 1.1,
    monthlyTotal: 1.0,
    confidence: 0.5
  };
}

function getDefaultProjection(): IntraMonthProjection {
  return {
    currentWeekProgress: 1.0,
    projectedWeekEnd: 0,
    projectedMonthEnd: 4800000, // $4.8M fallback
    multiplierUsed: 1.0,
    confidence: 'Baja',
    methodology: 'Default projection (insufficient data)'
  };
}

function getDefaultAOV(): DynamicAOV {
  return {
    currentMonthAOV: 6350,
    historicalAOV: 6350,
    aovTrend: 0,
    deviationFromHistorical: 0,
    isSignificantChange: false
  };
}