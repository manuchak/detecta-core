import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calculateExactYTDComparison } from '@/utils/exactDateYTDCalculations';

interface HistoricalMonthData {
  year: number;
  month: number;
  services: number;
  gmv: number;
}

interface HistoricalProjectionResult {
  projectedServices: number;
  projectedGMV: number;
  confidence: 'low' | 'medium' | 'high';
  basedOnYears: number[];
  historicalAverage: {
    services: number;
    gmv: number;
  };
  adjustmentFactors: {
    ytdGrowth: number;
    previousMonthMomentum: number;
    seasonalPattern: number;
  };
  reasoning: string[];
  warnings: string[];
  useHistoricalMode: boolean;
  daysUntilRealtime: number;
}

/**
 * Detecta si estamos en los primeros días del mes (≤2 días de datos reales)
 */
const isEarlyMonth = (): { isEarly: boolean; daysInMonth: number; daysUntilRealtime: number } => {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const isEarly = dayOfMonth <= 2;
  const daysUntilRealtime = isEarly ? (3 - dayOfMonth) : 0;
  
  return { isEarly, daysInMonth: dayOfMonth, daysUntilRealtime };
};

/**
 * Hook para proyecciones inteligentes basadas en datos históricos al inicio de mes
 */
export const useHistoricalMonthlyProjection = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['historical-monthly-projection'],
    queryFn: async (): Promise<HistoricalProjectionResult> => {
      if (!user) throw new Error('Usuario no autenticado');

      const earlyMonthCheck = isEarlyMonth();
      
      // Si no estamos en modo "inicio de mes", retornar modo desactivado
      if (!earlyMonthCheck.isEarly) {
        return {
          projectedServices: 0,
          projectedGMV: 0,
          confidence: 'low',
          basedOnYears: [],
          historicalAverage: { services: 0, gmv: 0 },
          adjustmentFactors: { ytdGrowth: 0, previousMonthMomentum: 0, seasonalPattern: 1 },
          reasoning: [],
          warnings: [],
          useHistoricalMode: false,
          daysUntilRealtime: 0
        };
      }

      const reasoning: string[] = [];
      const warnings: string[] = [];
      
      reasoning.push(`📅 Inicio de mes detectado (día ${earlyMonthCheck.daysInMonth}). Activando proyección histórica.`);

      // Obtener mes y año actual
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // ========== 1. OBTENER DATOS HISTÓRICOS DEL MISMO MES ==========
      const { data: historicalMonthlyData, error: histError } = await supabase.rpc(
        'get_historical_monthly_data'
      );

      if (histError || !historicalMonthlyData || historicalMonthlyData.length === 0) {
        warnings.push('No se pudo obtener datos históricos suficientes');
        throw new Error('Insufficient historical data');
      }

      // Filtrar solo datos del mismo mes de años anteriores
      const sameMonthHistory = historicalMonthlyData
        .filter((item: any) => {
          return item.month === currentMonth && item.year < currentYear;
        })
        .map((item: any) => ({
          year: item.year,
          month: item.month,
          services: item.services || 0,
          gmv: item.gmv || 0
        }))
        .sort((a, b) => b.year - a.year); // Más reciente primero

      if (sameMonthHistory.length === 0) {
        warnings.push(`No hay datos históricos para el mes ${currentMonth}`);
        throw new Error('No historical data for this month');
      }

      reasoning.push(`📊 Analizando ${sameMonthHistory.length} años previos del mismo mes`);

      // Calcular promedio histórico (últimos 2-3 años)
      const recentYears = sameMonthHistory.slice(0, 3);
      const avgServices = recentYears.reduce((sum, item) => sum + item.services, 0) / recentYears.length;
      const avgGMV = recentYears.reduce((sum, item) => sum + item.gmv, 0) / recentYears.length;

      reasoning.push(`📈 Promedio histórico: ${Math.round(avgServices)} servicios, $${(avgGMV / 1000000).toFixed(1)}M GMV`);

      // ========== 2. CALCULAR FACTOR DE CRECIMIENTO YTD ==========
      const ytdComparison = await calculateExactYTDComparison();
      let ytdGrowthFactor = 1.0;

      if (ytdComparison) {
        ytdGrowthFactor = 1 + (ytdComparison.servicesGrowthPercentage / 100);
        reasoning.push(`🚀 Factor YTD 2025 vs 2024: ${ytdComparison.servicesGrowthPercentage > 0 ? '+' : ''}${ytdComparison.servicesGrowthPercentage.toFixed(1)}%`);
      } else {
        warnings.push('No se pudo calcular crecimiento YTD, usando factor neutral');
      }

      // ========== 3. ANALIZAR MOMENTUM DEL MES ANTERIOR ==========
      const previousMonthData = historicalMonthlyData.find((item: any) => {
        return item.month === previousMonth && item.year === previousMonthYear;
      });

      const previousMonthLastYear = sameMonthHistory.length > 0 
        ? historicalMonthlyData.find((item: any) => {
            return item.month === previousMonth && item.year === currentYear - 1;
          })
        : null;

      let momentumFactor = 1.0;
      if (previousMonthData && previousMonthLastYear) {
        const prevMonthServices = previousMonthData.services || 0;
        const prevMonthLastYearServices = previousMonthLastYear.services || 0;
        
        if (prevMonthLastYearServices > 0) {
          const prevMonthGrowth = ((prevMonthServices - prevMonthLastYearServices) / prevMonthLastYearServices);
          momentumFactor = 1 + (prevMonthGrowth * 0.3); // 30% peso del momentum del mes anterior
          reasoning.push(`⚡ Momentum mes anterior: ${prevMonthGrowth > 0 ? '+' : ''}${(prevMonthGrowth * 100).toFixed(1)}% (factor ${momentumFactor.toFixed(2)})`);
        }
      }

      // ========== 4. PATRÓN ESTACIONAL (mes anterior vs mes actual en historia) ==========
      let seasonalFactor = 1.0;
      if (sameMonthHistory.length >= 2 && previousMonthLastYear) {
        const currentMonthAvg = recentYears.reduce((sum, item) => sum + item.services, 0) / recentYears.length;
        const prevMonthServices = previousMonthLastYear.services || 0;
        
        if (prevMonthServices > 0) {
          seasonalFactor = currentMonthAvg / prevMonthServices;
          reasoning.push(`🌡️ Patrón estacional: ${seasonalFactor > 1 ? 'Mes más fuerte' : 'Mes más débil'} que el anterior (${seasonalFactor.toFixed(2)}x)`);
        }
      }

      // ========== 5. CALCULAR PROYECCIÓN AJUSTADA ==========
      const combinedAdjustment = ytdGrowthFactor * momentumFactor;
      const projectedServices = Math.round(avgServices * combinedAdjustment);
      const projectedGMV = avgGMV * combinedAdjustment;

      reasoning.push(`🎯 Proyección final: ${projectedServices} servicios, $${(projectedGMV / 1000000).toFixed(1)}M GMV`);
      reasoning.push(`📐 Ajuste combinado: ${((combinedAdjustment - 1) * 100).toFixed(1)}% sobre promedio histórico`);

      // ========== 6. DETERMINAR CONFIANZA ==========
      let confidence: 'low' | 'medium' | 'high' = 'medium';
      
      if (sameMonthHistory.length >= 3 && ytdComparison && previousMonthData) {
        confidence = 'high';
        reasoning.push('✅ Alta confianza: 3+ años históricos + YTD + momentum disponibles');
      } else if (sameMonthHistory.length >= 2) {
        confidence = 'medium';
        warnings.push('⚠️ Confianza media: datos históricos limitados');
      } else {
        confidence = 'low';
        warnings.push('⚠️ Confianza baja: datos históricos insuficientes');
      }

      warnings.push(`🔄 En ${earlyMonthCheck.daysUntilRealtime} día(s) cambiaremos a proyección en tiempo real`);

      return {
        projectedServices,
        projectedGMV,
        confidence,
        basedOnYears: recentYears.map(y => y.year),
        historicalAverage: {
          services: Math.round(avgServices),
          gmv: avgGMV
        },
        adjustmentFactors: {
          ytdGrowth: ytdGrowthFactor,
          previousMonthMomentum: momentumFactor,
          seasonalPattern: seasonalFactor
        },
        reasoning,
        warnings,
        useHistoricalMode: true,
        daysUntilRealtime: earlyMonthCheck.daysUntilRealtime
      };
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true
  });
};
