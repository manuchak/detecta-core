// Risk Trends Analysis - Adapted from Hermes for Detecta Security Module
// Uses Detecta's Supabase client

import { supabase } from '@/integrations/supabase/client';

export async function getHistoricalAssessments(
  processId: string,
  currentAssessmentId: string,
  limit: number = 4
) {
  try {
    // In Detecta context, we query security_events grouped by date for trend analysis
    const { data, error } = await supabase
      .from('security_events')
      .select('id, event_type, severity, event_date, h3_index')
      .order('event_date', { ascending: false })
      .limit(limit * 50);

    if (error) {
      console.error('Error fetching historical security events:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Group by month for trend visualization
    const byMonth = new Map<string, { extremo: number; alto: number; medio: number; bajo: number }>();
    
    data.forEach((event: any) => {
      const month = event.event_date?.substring(0, 7) || 'unknown';
      if (!byMonth.has(month)) {
        byMonth.set(month, { extremo: 0, alto: 0, medio: 0, bajo: 0 });
      }
      const entry = byMonth.get(month)!;
      const severity = event.severity as string;
      if (severity === 'critico') entry.extremo++;
      else if (severity === 'alto') entry.alto++;
      else if (severity === 'medio') entry.medio++;
      else entry.bajo++;
    });

    return Array.from(byMonth.entries()).map(([month, risksByLevel]) => ({
      id: month,
      name: month,
      date: `${month}-01`,
      risksByLevel,
      totalRisks: Object.values(risksByLevel).reduce((a, b) => a + b, 0)
    }));
  } catch (error) {
    console.error('Error in getHistoricalAssessments:', error);
    return [];
  }
}

export function calculateRiskTrends(
  currentRisks: { extremo: number; alto: number; medio: number; bajo: number },
  historicalData: Array<{ date: string; risksByLevel: { extremo: number; alto: number; medio: number; bajo: number } }>
) {
  if (historicalData.length === 0) {
    return { hasHistoricalData: false, trend: 'stable' as const, changePercentage: 0, criticalRisksChange: 0 };
  }

  const previousAssessment = historicalData[historicalData.length - 1];
  const currentCritical = currentRisks.extremo + currentRisks.alto;
  const previousCritical = previousAssessment.risksByLevel.extremo + previousAssessment.risksByLevel.alto;
  const change = currentCritical - previousCritical;
  const changePercentage = previousCritical > 0 ? ((change / previousCritical) * 100).toFixed(1) : (change > 0 ? 100 : 0);

  let trend: 'increasing' | 'decreasing' | 'stable';
  if (change > 0) trend = 'increasing';
  else if (change < 0) trend = 'decreasing';
  else trend = 'stable';

  return {
    hasHistoricalData: true,
    trend,
    changePercentage: Number(changePercentage),
    criticalRisksChange: change,
    previousCritical,
    currentCritical,
    extremoChange: currentRisks.extremo - previousAssessment.risksByLevel.extremo,
    altoChange: currentRisks.alto - previousAssessment.risksByLevel.alto
  };
}
