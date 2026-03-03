import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

export interface RouteAnalysisData {
  // Route info
  origen: string;
  destino: string;
  generatedAt: string;

  // Services summary
  totalServices: number;
  servicesPeriod: string; // e.g. "últimos 90 días"

  // Incident summary
  totalIncidents: number;
  criticalIncidents: number;
  incidentRate: number; // per 1000 services
  incidentsByType: { tipo: string; count: number }[];

  // Control effectiveness
  controlCoverage: number;
  controlEffectiveness: number;

  // DRF for this corridor
  corridorDRF: number;

  // Recent incidents (for table)
  recentIncidents: {
    fecha: string;
    tipo: string;
    severidad: string;
    zona: string;
    atribuible: boolean;
    controlEfectivo: boolean | null;
  }[];

  // RRSS intelligence near route
  rrssIncidents: {
    fecha: string;
    tipo: string;
    municipio: string;
    severidad: string;
    resumen: string;
  }[];

  // Safe points along corridor
  safePointsCount: number;
  safePointsVerified: number;

  // Risk zones crossed
  zonesExtremo: number;
  zonesAlto: number;
  zonesMedio: number;
  zonesBajo: number;

  // Recommendations
  recommendations: string[];
}

// =============================================================================
// FETCH FUNCTION
// =============================================================================

const SEVERITY_WEIGHT: Record<string, number> = { critica: 4, alta: 3, media: 2, baja: 1 };

export async function fetchRouteAnalysisData(
  origen: string,
  destino: string
): Promise<RouteAnalysisData> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

  // Parallel queries
  const [servicesRes, incidentsRes, rrssRes, zonesRes, safePointsRes] = await Promise.all([
    (supabase as any)
      .from('servicios_planificados')
      .select('id, origen, destino, fecha_hora_cita')
      .ilike('origen', `%${origen}%`)
      .ilike('destino', `%${destino}%`)
      .not('estado_planeacion', 'eq', 'cancelado'),
    (supabase as any)
      .from('incidentes_operativos')
      .select('id, tipo, severidad, zona, fecha_incidente, atribuible_operacion, control_efectivo, controles_activos, servicio_planificado_id')
      .order('fecha_incidente', { ascending: false }),
    (supabase as any)
      .from('incidentes_rrss')
      .select('fecha_publicacion, tipo_incidente, municipio, severidad, resumen_ai, carretera')
      .gte('fecha_publicacion', ninetyDaysAgo)
      .order('fecha_publicacion', { ascending: false })
      .limit(100),
    (supabase as any)
      .from('risk_zone_scores')
      .select('risk_level, final_score'),
    (supabase as any)
      .from('safe_points')
      .select('verification_status')
      .eq('is_active', true),
  ]);

  const services = (servicesRes.data || []) as { id: string; origen: string; destino: string; fecha_hora_cita: string }[];
  const allIncidents = (incidentsRes.data || []) as any[];
  const rrssAll = (rrssRes.data || []) as any[];
  const zones = (zonesRes.data || []) as { risk_level: string; final_score: number }[];
  const safePoints = (safePointsRes.data || []) as { verification_status: string }[];

  // Filter incidents linked to matching services
  const serviceIds = new Set(services.map(s => s.id));
  const routeIncidents = allIncidents.filter((i: any) =>
    i.servicio_planificado_id && serviceIds.has(i.servicio_planificado_id)
  );

  // Filter RRSS by carretera/municipio match
  const routeTerms = [origen, destino].map(t => t.toLowerCase().split(',')[0].trim());
  const rrssFiltered = rrssAll.filter((r: any) => {
    const text = `${r.carretera || ''} ${r.municipio || ''}`.toLowerCase();
    return routeTerms.some(term => text.includes(term));
  }).slice(0, 20);

  const totalServices = services.length;
  const totalIncidents = routeIncidents.length;
  const criticalIncidents = routeIncidents.filter((i: any) => i.severidad === 'critica' || i.severidad === 'alta').length;
  const incidentRate = totalServices > 0 ? Math.round((totalIncidents / totalServices) * 1000 * 10) / 10 : 0;

  // By type
  const typeMap: Record<string, number> = {};
  routeIncidents.forEach((i: any) => { typeMap[i.tipo] = (typeMap[i.tipo] || 0) + 1; });
  const incidentsByType = Object.entries(typeMap)
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);

  // Controls
  const withControls = routeIncidents.filter((i: any) => i.controles_activos && i.controles_activos.length > 0);
  const controlCoverage = totalIncidents > 0 ? Math.round((withControls.length / totalIncidents) * 100) : 0;
  const controlEffective = withControls.filter((i: any) => i.control_efectivo === true).length;
  const controlEffectiveness = withControls.length > 0 ? Math.round((controlEffective / withControls.length) * 100) : 0;

  // Corridor DRF (simplified)
  const atribuibles = routeIncidents.filter((i: any) => i.atribuible_operacion).length;
  const irNorm = Math.min(((atribuibles / Math.max(totalServices, 1)) * 1000) / 50 * 100, 100);
  const sevIndex = totalIncidents > 0
    ? (routeIncidents.reduce((s: number, i: any) => s + (SEVERITY_WEIGHT[i.severidad] || 1), 0) / (totalIncidents * 4)) * 100
    : 0;
  const cfRate = withControls.length > 0
    ? (withControls.filter((i: any) => i.control_efectivo === false).length / withControls.length) * 100
    : 0;
  const highZones = zones.filter(z => z.risk_level === 'extremo' || z.risk_level === 'alto').length;
  const exposure = zones.length > 0 ? (highZones / zones.length) * 100 : 0;
  const verifiedSP = safePoints.filter(sp => sp.verification_status === 'verified').length;
  const mitigation = safePoints.length > 0 ? (verifiedSP / safePoints.length) * 100 : 0;

  const corridorDRF = Math.round(Math.max(0, Math.min(100,
    0.30 * irNorm + 0.25 * sevIndex + 0.20 * cfRate + 0.15 * exposure - 0.10 * mitigation
  )));

  // Recommendations
  const recommendations: string[] = [];
  if (corridorDRF >= 75) recommendations.push('Se recomienda escolta doble y comunicación satelital obligatoria en este corredor.');
  if (corridorDRF >= 50) recommendations.push('Implementar protocolo de tránsito nocturno restringido (ISO 28000 §6.2).');
  if (controlEffectiveness < 60) recommendations.push('Revisar efectividad de controles activos — ratio por debajo del objetivo ISO 28000.');
  if (criticalIncidents > 3) recommendations.push(`Se registran ${criticalIncidents} incidentes críticos — considerar ruta alternativa.`);
  if (rrssFiltered.length > 5) recommendations.push(`Inteligencia RRSS detecta ${rrssFiltered.length} incidentes recientes en la zona.`);
  if (controlCoverage < 50) recommendations.push('Menos del 50% de los incidentes tienen controles documentados — fortalecer registro.');
  if (recommendations.length === 0) recommendations.push('Corredor dentro de parámetros aceptables. Mantener monitoreo continuo.');

  return {
    origen, destino,
    generatedAt: new Date().toISOString(),
    totalServices, servicesPeriod: 'todos los registros',
    totalIncidents, criticalIncidents, incidentRate,
    incidentsByType,
    controlCoverage, controlEffectiveness,
    corridorDRF,
    recentIncidents: routeIncidents.slice(0, 15).map((i: any) => ({
      fecha: i.fecha_incidente,
      tipo: i.tipo,
      severidad: i.severidad,
      zona: i.zona || '—',
      atribuible: i.atribuible_operacion,
      controlEfectivo: i.control_efectivo,
    })),
    rrssIncidents: rrssFiltered.map((r: any) => ({
      fecha: r.fecha_publicacion,
      tipo: r.tipo_incidente || '—',
      municipio: r.municipio || '—',
      severidad: r.severidad || '—',
      resumen: (r.resumen_ai || '').substring(0, 120),
    })),
    safePointsCount: safePoints.length,
    safePointsVerified: verifiedSP,
    zonesExtremo: zones.filter(z => z.risk_level === 'extremo').length,
    zonesAlto: zones.filter(z => z.risk_level === 'alto').length,
    zonesMedio: zones.filter(z => z.risk_level === 'medio').length,
    zonesBajo: zones.filter(z => z.risk_level === 'bajo').length,
    recommendations,
  };
}
