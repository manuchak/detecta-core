interface HistoricalService {
  fecha_hora_cita: string;
  estado: string;
  origen: string;
  destino: string;
  km_recorridos: number;
}

interface Zone {
  id: string;
  nombre: string;
}

interface MonthlyPattern {
  month: number;
  year: number;
  zona_id: string;
  services_count: number;
  avg_km: number;
  growth_rate: number;
}

interface TemporalPattern {
  zona_id: string;
  zona_nombre: string;
  monthly_patterns: MonthlyPattern[];
  seasonal_trends: {
    Q1: number; // Ene-Mar
    Q2: number; // Abr-Jun  
    Q3: number; // Jul-Sep
    Q4: number; // Oct-Dic
  };
  yearly_growth: number;
  peak_months: number[];
  low_months: number[];
}

export const calculateTemporalPatterns = (
  historicalData: HistoricalService[],
  zones: Zone[]
): TemporalPattern[] => {
  const patterns: TemporalPattern[] = [];

  zones.forEach(zone => {
    // Filtrar servicios por zona (usando origen como referencia de zona)
    const zoneServices = historicalData.filter(
      service => (service.origen?.includes(zone.nombre) || service.destino?.includes(zone.nombre)) &&
      ['finalizado', 'Finalizado', 'completado', 'Completado'].includes(service.estado)
    );

    if (zoneServices.length === 0) {
      patterns.push({
        zona_id: zone.id,
        zona_nombre: zone.nombre,
        monthly_patterns: [],
        seasonal_trends: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
        yearly_growth: 0,
        peak_months: [],
        low_months: []
      });
      return;
    }

    // Agrupar por mes/año
    const monthlyData = new Map<string, { count: number; total_km: number }>();
    
    zoneServices.forEach(service => {
      const date = new Date(service.fecha_hora_cita);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyData.has(key)) {
        monthlyData.set(key, { count: 0, total_km: 0 });
      }
      
      const data = monthlyData.get(key)!;
      data.count++;
      data.total_km += service.km_recorridos || 0;
    });

    // Crear patrones mensuales
    const monthly_patterns: MonthlyPattern[] = [];
    const monthlyArray = Array.from(monthlyData.entries()).map(([key, data]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month,
        year,
        zona_id: zone.id,
        services_count: data.count,
        avg_km: data.total_km / data.count,
        growth_rate: 0 // Se calculará después
      };
    }).sort((a, b) => a.year - b.year || a.month - b.month);

    // Calcular tasa de crecimiento mensual
    for (let i = 1; i < monthlyArray.length; i++) {
      const current = monthlyArray[i];
      const previous = monthlyArray[i - 1];
      if (previous.services_count > 0) {
        current.growth_rate = ((current.services_count - previous.services_count) / previous.services_count) * 100;
      }
    }

    monthly_patterns.push(...monthlyArray);

    // Calcular tendencias estacionales
    const seasonalData = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    const seasonalCounts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

    monthlyArray.forEach(pattern => {
      const quarter = Math.ceil(pattern.month / 3) as 1 | 2 | 3 | 4;
      const quarterKey = `Q${quarter}` as keyof typeof seasonalData;
      seasonalData[quarterKey] += pattern.services_count;
      seasonalCounts[quarterKey]++;
    });

    // Promediar por trimestre
    Object.keys(seasonalData).forEach(key => {
      const quarterKey = key as keyof typeof seasonalData;
      if (seasonalCounts[quarterKey] > 0) {
        seasonalData[quarterKey] = seasonalData[quarterKey] / seasonalCounts[quarterKey];
      }
    });

    // Identificar meses pico y bajos
    const monthlyAvgs = new Map<number, number>();
    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyArray.filter(p => p.month === month);
      if (monthData.length > 0) {
        const avg = monthData.reduce((sum, p) => sum + p.services_count, 0) / monthData.length;
        monthlyAvgs.set(month, avg);
      }
    }

    const avgServices = Array.from(monthlyAvgs.values()).reduce((sum, val) => sum + val, 0) / monthlyAvgs.size;
    const peak_months = Array.from(monthlyAvgs.entries())
      .filter(([_, avg]) => avg > avgServices * 1.2)
      .map(([month]) => month);
    
    const low_months = Array.from(monthlyAvgs.entries())
      .filter(([_, avg]) => avg < avgServices * 0.8)
      .map(([month]) => month);

    // Calcular crecimiento anual
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const currentYearServices = monthlyArray
      .filter(p => p.year === currentYear)
      .reduce((sum, p) => sum + p.services_count, 0);
    
    const lastYearServices = monthlyArray
      .filter(p => p.year === lastYear)
      .reduce((sum, p) => sum + p.services_count, 0);

    const yearly_growth = lastYearServices > 0 
      ? ((currentYearServices - lastYearServices) / lastYearServices) * 100 
      : 0;

    patterns.push({
      zona_id: zone.id,
      zona_nombre: zone.nombre,
      monthly_patterns,
      seasonal_trends: seasonalData,
      yearly_growth,
      peak_months,
      low_months
    });
  });

  return patterns;
};

export const generateSeasonalForecast = (
  temporalMetrics: any[],
  zones: Zone[]
) => {
  const forecasts = zones.map(zone => {
    const zoneMetrics = temporalMetrics.filter(m => m.zona_id === zone.id);
    
    if (zoneMetrics.length === 0) {
      return {
        zona_id: zone.id,
        zona_nombre: zone.nombre,
        next_month_demand: 0,
        next_quarter_demand: 0,
        seasonal_multiplier: 1,
        recommended_recruitment_start: new Date().toISOString(),
        confidence_level: 0
      };
    }

    // Calcular demanda promedio
    const avgDemand = zoneMetrics.reduce((sum, m) => sum + (m.servicios_historicos || 0), 0) / zoneMetrics.length;
    
    // Factor estacional basado en el mes actual
    const currentMonth = new Date().getMonth() + 1;
    const seasonalMultiplier = getSeasonalMultiplier(currentMonth);
    
    // Proyecciones
    const next_month_demand = Math.round(avgDemand * seasonalMultiplier);
    const next_quarter_demand = Math.round(next_month_demand * 3 * 0.95); // Ajuste trimestral

    // Calcular cuándo empezar el reclutamiento (6-8 semanas antes del pico)
    const peakMonth = currentMonth + 2; // Asumiendo pico en 2 meses
    const recruitmentStart = new Date();
    recruitmentStart.setMonth(recruitmentStart.getMonth() + 1);

    return {
      zona_id: zone.id,
      zona_nombre: zone.nombre,
      next_month_demand,
      next_quarter_demand,
      seasonal_multiplier: seasonalMultiplier,
      recommended_recruitment_start: recruitmentStart.toISOString(),
      confidence_level: Math.min(0.95, Math.max(0.5, zoneMetrics.length / 12)) // Basado en datos disponibles
    };
  });

  return forecasts;
};

export const optimizeRecruitmentTiming = (temporalAnalysis: TemporalPattern[]) => {
  return temporalAnalysis.map(pattern => {
    const currentMonth = new Date().getMonth() + 1;
    
    // Determinar si hay un pico próximo
    const upcomingPeaks = pattern.peak_months.filter(month => 
      month > currentMonth || month < currentMonth + 3
    );

    let optimal_start_weeks = 8; // Default
    let recruitment_intensity: 'low' | 'medium' | 'high' = 'medium';
    
    if (upcomingPeaks.length > 0) {
      optimal_start_weeks = 6; // Más urgente
      recruitment_intensity = 'high';
    } else if (pattern.low_months.includes(currentMonth)) {
      optimal_start_weeks = 12; // Menos urgente
      recruitment_intensity = 'low';
    }

    // Determinar período de demanda pico
    const peak_demand_period = pattern.peak_months.length > 0 
      ? `Meses ${pattern.peak_months.join(', ')}`
      : 'No identificado';

    return {
      zona_id: pattern.zona_id,
      optimal_start_weeks,
      peak_demand_period,
      recruitment_intensity,
      estimated_lead_time: 8 // Semanas promedio para completar reclutamiento
    };
  });
};

// Función auxiliar para factor estacional
const getSeasonalMultiplier = (month: number): number => {
  // Factores estacionales típicos para servicios de custodia
  const seasonalFactors: { [key: number]: number } = {
    1: 0.9,  // Enero - post-navidad
    2: 0.95, // Febrero
    3: 1.05, // Marzo - incremento actividad
    4: 1.1,  // Abril
    5: 1.15, // Mayo - pico primaveral
    6: 1.1,  // Junio
    7: 0.95, // Julio - vacaciones
    8: 0.9,  // Agosto - vacaciones
    9: 1.2,  // Septiembre - regreso actividades
    10: 1.25, // Octubre - pico otoñal
    11: 1.3,  // Noviembre - fin de año
    12: 1.0   // Diciembre - navidad
  };

  return seasonalFactors[month] || 1.0;
};