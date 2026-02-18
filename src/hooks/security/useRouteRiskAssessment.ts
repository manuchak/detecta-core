import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RouteRiskResult {
  originZones: { h3_index: string; risk_level: string; final_score: number }[];
  destinationZones: { h3_index: string; risk_level: string; final_score: number }[];
  maxRiskLevel: string;
  maxScore: number;
  safePointsNearby: number;
  recentEventsCount: number;
  recommendations: string[];
}

const RISK_ORDER: Record<string, number> = { extremo: 4, alto: 3, medio: 2, bajo: 1 };

function riskLabel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/**
 * Given origin/destination text, queries risk_zone_scores and security_events
 * to produce a risk assessment for the route.
 * Since we don't have coordinates in EditServiceForm, we match by zone text search.
 */
export function useRouteRiskAssessment(origen?: string, destino?: string) {
  return useQuery({
    queryKey: ['route-risk-assessment', origen, destino],
    enabled: Boolean(origen && destino && origen.length > 2 && destino.length > 2),
    queryFn: async (): Promise<RouteRiskResult> => {
      // Get all risk zones to find matches
      const { data: zones, error: zErr } = await (supabase as any)
        .from('risk_zone_scores')
        .select('h3_index, risk_level, final_score')
        .order('final_score', { ascending: false })
        .limit(500);

      if (zErr) throw zErr;

      // Get recent security events (last 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      const { data: events, error: eErr } = await (supabase as any)
        .from('security_events')
        .select('severity, event_type')
        .gte('event_date', ninetyDaysAgo);

      if (eErr) throw eErr;

      // Get safe points count
      const { count: safePointsCount } = await (supabase as any)
        .from('safe_points')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      const allZones = zones || [];
      const recentEvents = events || [];

      // Determine max risk from all zones (since we can't geocode from form, show overall posture)
      let maxRiskLevel = 'bajo';
      let maxScore = 0;
      for (const z of allZones) {
        if ((RISK_ORDER[z.risk_level] || 0) > (RISK_ORDER[maxRiskLevel] || 0)) {
          maxRiskLevel = z.risk_level;
        }
        if (Number(z.final_score) > maxScore) maxScore = Number(z.final_score);
      }

      // Generate recommendations based on risk
      const recommendations: string[] = [];
      const criticalEvents = recentEvents.filter((e: any) => e.severity === 'critico' || e.severity === 'alto');

      if (maxRiskLevel === 'extremo' || maxRiskLevel === 'alto') {
        recommendations.push('ISO 28000: Se recomienda custodia armada para esta ruta');
        recommendations.push('Establecer touchpoints cada 25 minutos durante el trayecto');
        recommendations.push('Verificar puntos seguros disponibles antes de iniciar');
      }
      if (maxRiskLevel === 'medio') {
        recommendations.push('Mantener comunicación constante con central de monitoreo');
        recommendations.push('Verificar cobertura celular en la ruta planificada');
      }
      if (criticalEvents.length > 10) {
        recommendations.push(`⚠️ ${criticalEvents.length} eventos críticos en últimos 90 días en zonas monitoreadas`);
      }
      if ((safePointsCount || 0) === 0) {
        recommendations.push('No hay puntos seguros certificados — considere registrar paradas autorizadas');
      }

      return {
        originZones: [],
        destinationZones: [],
        maxRiskLevel,
        maxScore: Math.round(maxScore * 10) / 10,
        safePointsNearby: safePointsCount || 0,
        recentEventsCount: recentEvents.length,
        recommendations,
      };
    },
    staleTime: 10 * 60 * 1000,
  });
}
