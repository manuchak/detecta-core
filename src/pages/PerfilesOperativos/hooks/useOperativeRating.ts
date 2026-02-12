import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfilePerformance } from './useProfilePerformance';

export interface RatingDimension {
  key: string;
  label: string;
  score: number; // 0-100
  stars: number; // 1-5
  weight: number;
  detail?: string;
  available: boolean;
}

export interface OperativeRating {
  dimensions: RatingDimension[];
  ratingGeneral: number; // 1-5
  scoreGeneral: number; // 0-100
  label: string;
  labelColor: string;
  revenueTotal90d: number;
  revenueP50: number;
  revenueP90: number;
  serviciosLocales: number;
  serviciosForaneos: number;
  performanceBreakdown: {
    puntualidad: number;
    confiabilidad: number;
    checklist: number;
    documentacion: number;
    volumen: number;
  };
}

function scoreToStars(score: number): number {
  if (score >= 81) return 5;
  if (score >= 61) return 4;
  if (score >= 41) return 3;
  if (score >= 21) return 2;
  return 1;
}

function getRatingLabel(rating: number): { label: string; color: string } {
  if (rating >= 4.5) return { label: 'Excelente', color: 'text-green-600' };
  if (rating >= 3.5) return { label: 'Destacado', color: 'text-blue-600' };
  if (rating >= 2.5) return { label: 'Estándar', color: 'text-yellow-600' };
  if (rating >= 1.5) return { label: 'En desarrollo', color: 'text-orange-600' };
  return { label: 'Crítico', color: 'text-red-600' };
}

export function useOperativeRating(
  custodioId: string | undefined,
  nombre: string | undefined,
  telefono: string | null | undefined
) {
  const { metrics: perfMetrics, isLoading: perfLoading } = useProfilePerformance(custodioId, nombre, telefono);

  // Disponibilidad + versatilidad data from custodios_operativos
  const profileQuery = useQuery({
    queryKey: ['operative-rating-profile', custodioId],
    queryFn: async () => {
      if (!custodioId) return null;
      const { data, error } = await supabase
        .from('custodios_operativos')
        .select('disponibilidad, estado, fecha_ultimo_servicio, servicios_locales_15d, servicios_foraneos_15d, preferencia_tipo_servicio')
        .eq('id', custodioId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!custodioId,
  });

  // Revenue 90d for this custodio
  const revenueQuery = useQuery({
    queryKey: ['operative-rating-revenue', nombre],
    queryFn: async () => {
      if (!nombre) return { total: 0 };
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('costo_custodio')
        .ilike('nombre_custodio', `%${nombre}%`)
        .gte('fecha_hora_cita', since.toISOString());
      if (error) throw error;
      const total = (data || []).reduce((s, r) => s + (r.costo_custodio || 0), 0);
      return { total };
    },
    enabled: !!nombre,
  });

  // Fleet percentiles
  const percentilesQuery = useQuery({
    queryKey: ['operative-rating-fleet-percentiles'],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('nombre_custodio, costo_custodio')
        .gte('fecha_hora_cita', since.toISOString());
      if (error) throw error;
      // aggregate by custodio
      const byName: Record<string, number> = {};
      for (const r of data || []) {
        if (!r.nombre_custodio) continue;
        byName[r.nombre_custodio] = (byName[r.nombre_custodio] || 0) + (r.costo_custodio || 0);
      }
      const values = Object.values(byName).sort((a, b) => a - b);
      if (values.length === 0) return { p50: 0, p90: 0 };
      const p50 = values[Math.floor(values.length * 0.5)] || 0;
      const p90 = values[Math.floor(values.length * 0.9)] || 0;
      return { p50, p90 };
    },
    staleTime: 1000 * 60 * 10, // 10min cache
  });

  const isLoading = perfLoading || profileQuery.isLoading || revenueQuery.isLoading || percentilesQuery.isLoading;

  // Calculate dimensions
  const profileData = profileQuery.data;
  const revenue90d = revenueQuery.data?.total || 0;
  const fleetP50 = percentilesQuery.data?.p50 || 1;
  const fleetP90 = percentilesQuery.data?.p90 || 1;

  // 1. Performance
  const scorePerf = perfMetrics.scoreGlobal;

  // 2. Disponibilidad
  let scoreDisp = 50;
  if (profileData) {
    const isAvailable = profileData.disponibilidad === 'disponible';
    const isActive = profileData.estado === 'activo';
    const daysSince = profileData.fecha_ultimo_servicio
      ? Math.floor((Date.now() - new Date(profileData.fecha_ultimo_servicio).getTime()) / 86400000)
      : 999;
    
    if (isAvailable && isActive && daysSince <= 7) scoreDisp = 100;
    else if (isAvailable && isActive && daysSince <= 15) scoreDisp = 80;
    else if (isAvailable && isActive && daysSince <= 30) scoreDisp = 60;
    else if (isActive && daysSince <= 30) scoreDisp = 40;
    else scoreDisp = 20;
  }

  // 3. Revenue
  let scoreRev = 50;
  if (revenue90d > 0 && fleetP90 > 0) {
    if (revenue90d >= fleetP90) scoreRev = 100;
    else if (revenue90d >= fleetP50) scoreRev = 60 + ((revenue90d - fleetP50) / (fleetP90 - fleetP50)) * 40;
    else scoreRev = Math.max(10, (revenue90d / fleetP50) * 60);
    scoreRev = Math.round(Math.min(100, scoreRev));
  }

  // 4. Versatilidad
  let scoreVers = 40;
  const locales = profileData?.servicios_locales_15d || 0;
  const foraneos = profileData?.servicios_foraneos_15d || 0;
  const maxServ = Math.max(locales, foraneos);
  const minServ = Math.min(locales, foraneos);
  if (maxServ > 0) {
    const ratio = minServ / maxServ; // 0-1
    scoreVers = Math.round(40 + ratio * 60); // 40-100
  }
  if (profileData?.preferencia_tipo_servicio === 'indistinto') {
    scoreVers = Math.min(100, scoreVers + 10);
  }

  // Weights (without client dimension)
  const WEIGHTS = { perf: 0.30, disp: 0.25, rev: 0.25, vers: 0.20 };

  const dimensions: RatingDimension[] = [
    { key: 'performance', label: 'Performance', score: scorePerf, stars: scoreToStars(scorePerf), weight: WEIGHTS.perf, available: true },
    { key: 'disponibilidad', label: 'Disponibilidad', score: scoreDisp, stars: scoreToStars(scoreDisp), weight: WEIGHTS.disp, available: true },
    { key: 'revenue', label: 'Revenue', score: scoreRev, stars: scoreToStars(scoreRev), weight: WEIGHTS.rev, available: true },
    { key: 'versatilidad', label: 'Versatilidad', score: scoreVers, stars: scoreToStars(scoreVers), weight: WEIGHTS.vers, available: true },
    { key: 'cliente', label: 'Calificación Cliente', score: 0, stars: 0, weight: 0.20, available: false },
  ];

  const scoreGeneral = Math.round(
    scorePerf * WEIGHTS.perf +
    scoreDisp * WEIGHTS.disp +
    scoreRev * WEIGHTS.rev +
    scoreVers * WEIGHTS.vers
  );
  const ratingGeneral = Math.round((scoreToStars(scoreGeneral) + (scoreGeneral % 20) / 20) * 10) / 10;
  const cappedRating = Math.min(5, Math.max(1, ratingGeneral));
  const { label, color: labelColor } = getRatingLabel(cappedRating);

  const rating: OperativeRating = {
    dimensions,
    ratingGeneral: cappedRating,
    scoreGeneral,
    label,
    labelColor,
    revenueTotal90d: revenue90d,
    revenueP50: fleetP50,
    revenueP90: fleetP90,
    serviciosLocales: locales,
    serviciosForaneos: foraneos,
    performanceBreakdown: {
      puntualidad: perfMetrics.scorePuntualidad,
      confiabilidad: perfMetrics.scoreConfiabilidad,
      checklist: perfMetrics.scoreChecklist,
      documentacion: perfMetrics.scoreDocumentacion,
      volumen: Math.min(100, Math.round((perfMetrics.ejecucionesCompletadas / 100) * 100)),
    },
  };

  return { rating, isLoading };
}
