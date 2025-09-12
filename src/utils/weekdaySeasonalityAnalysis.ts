// Enhanced Weekday Seasonality Analysis for Precise Forecasting
import { supabase } from '@/integrations/supabase/client';

export interface WeekdayPattern {
  monday: { services: number; gmv: number; };
  tuesday: { services: number; gmv: number; };
  wednesday: { services: number; gmv: number; };
  thursday: { services: number; gmv: number; };
  friday: { services: number; gmv: number; };
  saturday: { services: number; gmv: number; };
  sunday: { services: number; gmv: number; };
  confidence: number;
  samplesAnalyzed: number;
}

export interface SeasonalProjection {
  currentMonthProjection: number;
  projectionByDay: { [day: number]: number };
  methodology: string;
  confidence: 'Alta' | 'Media' | 'Baja';
  weekdayTotal: number;
  weekendTotal: number;
  totalProjectedGMV: number;
}

/**
 * Analyzes historical weekday patterns to create precise forecasts
 */
export async function analyzeWeekdaySeasonality(): Promise<WeekdayPattern> {
  try {
    console.log('📊 ANÁLISIS DE ESTACIONALIDAD POR DÍA DE LA SEMANA - Iniciando...');
    
    // Get last 3 months of data for pattern analysis
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
      console.error('❌ Error fetching historical weekday data:', error);
      return getDefaultWeekdayPattern();
    }

    console.log(`📈 Datos históricos obtenidos: ${historicalData?.length || 0} registros`);

    // Group by day of week (0=Sunday, 1=Monday, etc.)
    const weekdayData: { [dayOfWeek: number]: { services: number[]; gmv: number[]; } } = {
      0: { services: [], gmv: [] }, // Sunday
      1: { services: [], gmv: [] }, // Monday
      2: { services: [], gmv: [] }, // Tuesday
      3: { services: [], gmv: [] }, // Wednesday
      4: { services: [], gmv: [] }, // Thursday
      5: { services: [], gmv: [] }, // Friday
      6: { services: [], gmv: [] }  // Saturday
    };

    // Group data by date first to get daily totals
    const dailyTotals: { [dateKey: string]: { services: number; gmv: number; dayOfWeek: number } } = {};

    historicalData?.forEach(record => {
      const date = new Date(record.fecha_hora_cita);
      if (isNaN(date.getTime())) return;

      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const cobro = parseFloat(record.cobro_cliente?.toString() || '0') || 0;
      const dayOfWeek = date.getDay();

      if (!dailyTotals[dateKey]) {
        dailyTotals[dateKey] = { services: 0, gmv: 0, dayOfWeek };
      }

      dailyTotals[dateKey].services += 1;
      dailyTotals[dateKey].gmv += cobro;
    });

    // Now group daily totals by day of week
    Object.values(dailyTotals).forEach(dayData => {
      weekdayData[dayData.dayOfWeek].services.push(dayData.services);
      weekdayData[dayData.dayOfWeek].gmv.push(dayData.gmv);
    });

    // Calculate averages for each day
    const calculateDayAverage = (dayData: { services: number[]; gmv: number[] }) => ({
      services: dayData.services.length > 0 ? 
        dayData.services.reduce((sum, val) => sum + val, 0) / dayData.services.length : 0,
      gmv: dayData.gmv.length > 0 ? 
        dayData.gmv.reduce((sum, val) => sum + val, 0) / dayData.gmv.length : 0
    });

    const pattern: WeekdayPattern = {
      sunday: calculateDayAverage(weekdayData[0]),
      monday: calculateDayAverage(weekdayData[1]),
      tuesday: calculateDayAverage(weekdayData[2]),
      wednesday: calculateDayAverage(weekdayData[3]),
      thursday: calculateDayAverage(weekdayData[4]),
      friday: calculateDayAverage(weekdayData[5]),
      saturday: calculateDayAverage(weekdayData[6]),
      confidence: Object.values(weekdayData).reduce((sum, day) => sum + day.services.length, 0) >= 30 ? 0.85 : 0.6,
      samplesAnalyzed: Object.values(weekdayData).reduce((sum, day) => sum + day.services.length, 0)
    };

    console.log('📊 PATRONES POR DÍA DE LA SEMANA DETECTADOS:', {
      monday: `${pattern.monday.services.toFixed(1)} servicios, $${(pattern.monday.gmv/1000).toFixed(0)}K`,
      tuesday: `${pattern.tuesday.services.toFixed(1)} servicios, $${(pattern.tuesday.gmv/1000).toFixed(0)}K`,
      wednesday: `${pattern.wednesday.services.toFixed(1)} servicios, $${(pattern.wednesday.gmv/1000).toFixed(0)}K`,
      thursday: `${pattern.thursday.services.toFixed(1)} servicios, $${(pattern.thursday.gmv/1000).toFixed(0)}K`,
      friday: `${pattern.friday.services.toFixed(1)} servicios, $${(pattern.friday.gmv/1000).toFixed(0)}K`,
      saturday: `${pattern.saturday.services.toFixed(1)} servicios, $${(pattern.saturday.gmv/1000).toFixed(0)}K`,
      sunday: `${pattern.sunday.services.toFixed(1)} servicios, $${(pattern.sunday.gmv/1000).toFixed(0)}K`,
      confidence: `${(pattern.confidence * 100).toFixed(1)}%`,
      samplesAnalyzed: pattern.samplesAnalyzed
    });

    return pattern;

  } catch (error) {
    console.error('❌ Error analyzing weekday seasonality:', error);
    return getDefaultWeekdayPattern();
  }
}

/**
 * Calculates month-end projection using weekday seasonality patterns
 */
export async function calculateWeekdayAdjustedProjection(
  weekdayPattern: WeekdayPattern,
  currentDate: Date = new Date()
): Promise<SeasonalProjection> {
  try {
    console.log('🎯 PROYECCIÓN AJUSTADA POR ESTACIONALIDAD - Iniciando...');
    
    // Correct for data lag: if today is Sept 11, we only have data until Sept 10
    const dataDate = new Date(currentDate);
    dataDate.setDate(dataDate.getDate() - 1);
    const actualDataDay = Math.max(1, dataDate.getDate());
    
    console.log(`📅 Corrección de desfase: Fecha actual ${currentDate.toISOString().split('T')[0]}, datos hasta día ${actualDataDay}`);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get current month performance so far
    const startOfMonth = new Date(year, month, 1);
    const endOfDataPeriod = new Date(year, month, actualDataDay, 23, 59, 59);
    
    const { data: currentMonthData, error } = await supabase
      .from('servicios_custodia')
      .select(`
        fecha_hora_cita,
        cobro_cliente,
        estado
      `)
      .gte('fecha_hora_cita', startOfMonth.toISOString())
      .lte('fecha_hora_cita', endOfDataPeriod.toISOString())
      .not('estado', 'ilike', '%cancelado%')
      .not('cobro_cliente', 'is', null);

    if (error) {
      console.error('❌ Error fetching current month data:', error);
      return getDefaultSeasonalProjection();
    }

    // Calculate current GMV
    const currentGMV = currentMonthData?.reduce((sum, record) => {
      const cobro = parseFloat(record.cobro_cliente?.toString() || '0') || 0;
      return sum + cobro;
    }, 0) || 0;

    console.log(`💰 GMV actual hasta día ${actualDataDay}: $${(currentGMV/1000000).toFixed(2)}M`);

    // Project remaining days using weekday patterns
    let projectedAdditionalGMV = 0;
    const projectionByDay: { [day: number]: number } = {};
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    
    for (let day = actualDataDay + 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dayOfWeek = dayDate.getDay(); // 0=Sunday, 1=Monday, etc.
      
      let dayProjection = 0;
      switch(dayOfWeek) {
        case 0: dayProjection = weekdayPattern.sunday.gmv; break;
        case 1: dayProjection = weekdayPattern.monday.gmv; break;
        case 2: dayProjection = weekdayPattern.tuesday.gmv; break;
        case 3: dayProjection = weekdayPattern.wednesday.gmv; break;
        case 4: dayProjection = weekdayPattern.thursday.gmv; break;
        case 5: dayProjection = weekdayPattern.friday.gmv; break;
        case 6: dayProjection = weekdayPattern.saturday.gmv; break;
      }
      
      projectionByDay[day] = dayProjection;
      projectedAdditionalGMV += dayProjection;
      
      console.log(`📅 Día ${day} (${dayNames[dayOfWeek]}): $${(dayProjection/1000).toFixed(0)}K proyectado`);
    }

    const totalProjectedGMV = currentGMV + projectedAdditionalGMV;
    
    // Calculate weekday vs weekend breakdown for remaining days
    let weekdayTotal = 0;
    let weekendTotal = 0;
    
    for (let day = actualDataDay + 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dayOfWeek = dayDate.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        weekendTotal += projectionByDay[day];
      } else {
        weekdayTotal += projectionByDay[day];
      }
    }

    // Determine confidence based on data quality and time in month
    let confidence: 'Alta' | 'Media' | 'Baja' = 'Media';
    if (weekdayPattern.confidence > 0.8 && actualDataDay >= 8) {
      confidence = 'Alta';
    } else if (weekdayPattern.confidence < 0.6 || actualDataDay < 5) {
      confidence = 'Baja';
    }

    // Apply momentum adjustment if current month is performing better than pattern suggests
    const monthProgressRatio = actualDataDay / daysInMonth;
    const expectedGMVAtThisPoint = (weekdayPattern.monday.gmv + weekdayPattern.tuesday.gmv + 
      weekdayPattern.wednesday.gmv + weekdayPattern.thursday.gmv + weekdayPattern.friday.gmv + 
      weekdayPattern.saturday.gmv + weekdayPattern.sunday.gmv) * 4.33 * monthProgressRatio; // ~4.33 weeks per month
    
    let adjustmentFactor = 1.0;
    if (currentGMV > expectedGMVAtThisPoint * 1.1) {
      adjustmentFactor = 1.05; // 5% boost if significantly outperforming
      console.log('🚀 Momentum positivo detectado - Aplicando factor de ajuste 1.05x');
    }

    const finalProjectedGMV = totalProjectedGMV * adjustmentFactor;

    console.log('🎯 PROYECCIÓN ESTACIONAL COMPLETADA:', {
      currentGMV: `$${(currentGMV/1000000).toFixed(2)}M`,
      projectedAdditionalGMV: `$${(projectedAdditionalGMV/1000000).toFixed(2)}M`,
      totalProjectedGMV: `$${(finalProjectedGMV/1000000).toFixed(2)}M`,
      adjustmentFactor,
      confidence,
      daysRemaining: daysInMonth - actualDataDay,
      methodology: 'Análisis estacional por día de la semana'
    });

    return {
      currentMonthProjection: finalProjectedGMV,
      projectionByDay,
      methodology: `Análisis estacional: día ${actualDataDay}/${daysInMonth}, ${(daysInMonth - actualDataDay)} días restantes`,
      confidence,
      weekdayTotal,
      weekendTotal,
      totalProjectedGMV: finalProjectedGMV
    };

  } catch (error) {
    console.error('❌ Error calculating weekday-adjusted projection:', error);
    return getDefaultSeasonalProjection();
  }
}

// Helper functions
function getDefaultWeekdayPattern(): WeekdayPattern {
  return {
    monday: { services: 39, gmv: 280000 },    // Strongest day
    tuesday: { services: 38, gmv: 275000 },   // Strong
    wednesday: { services: 35, gmv: 250000 }, // Mid-week
    thursday: { services: 33, gmv: 240000 },  // Declining
    friday: { services: 30, gmv: 220000 },    // End of week
    saturday: { services: 15, gmv: 90000 },   // Weekend low
    sunday: { services: 12, gmv: 75000 },     // Lowest
    confidence: 0.6,
    samplesAnalyzed: 0
  };
}

function getDefaultSeasonalProjection(): SeasonalProjection {
  return {
    currentMonthProjection: 7200000, // $7.2M fallback
    projectionByDay: {},
    methodology: 'Proyección por defecto (datos insuficientes)',
    confidence: 'Baja',
    weekdayTotal: 0,
    weekendTotal: 0,
    totalProjectedGMV: 7200000
  };
}