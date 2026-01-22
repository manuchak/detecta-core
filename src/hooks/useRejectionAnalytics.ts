import { useAuthenticatedQuery } from './useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, startOfWeek, startOfQuarter, startOfYear, subDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { REJECTION_CATEGORIES, getCategoryFromReason } from '@/constants/rejectionCategories';

export type PeriodoRechazo = 'ultimos_30' | 'semana' | 'mes_actual' | 'trimestre' | 'year';

export interface RejectionByCategory {
  categoryId: string;
  categoryLabel: string;
  count: number;
  porcentaje: number;
  color: string;
}

export interface RejectionByReason {
  motivo: string;
  categoria: string;
  categoryId: string;
  count: number;
  porcentaje: number;
  acumulado: number; // For Pareto
}

export interface RejectionTrend {
  periodo: string;
  periodoLabel: string;
  rechazos: number;
  aceptaciones: number;
  total: number;
  tasaRechazo: number;
}

export interface RecentRejection {
  id: string;
  fecha: Date;
  custodioNombre: string;
  categoria: string;
  motivo: string;
  tiempoRespuesta: number | null;
  metodoContacto: string | null;
}

export interface RejectionMetrics {
  // Main KPIs
  totalRechazos: number;
  totalAceptaciones: number;
  tasaRechazo: number;
  tiempoPromedioRechazo: number;
  
  // Variation vs previous period
  variacionVsPeriodoAnterior: number | null;
  periodoAnteriorLabel: string;
  
  // By category (for donut)
  porCategoria: RejectionByCategory[];
  
  // By specific reason (for Pareto)
  topMotivos: RejectionByReason[];
  
  // Trend over time
  tendencia: RejectionTrend[];
  
  // Recent rejections list
  rechazosRecientes: RecentRejection[];
  
  // Period info
  periodoLabel: string;
  fechaInicio: Date;
  fechaFin: Date;
}

function getDateRange(periodo: PeriodoRechazo): { start: Date; end: Date; previousStart: Date; previousEnd: Date } {
  const now = new Date();
  const end = now;
  let start: Date;
  let previousStart: Date;
  let previousEnd: Date;

  switch (periodo) {
    case 'semana':
      start = startOfWeek(now, { weekStartsOn: 1 });
      previousEnd = new Date(start.getTime() - 1);
      previousStart = startOfWeek(previousEnd, { weekStartsOn: 1 });
      break;
    case 'mes_actual':
      start = startOfMonth(now);
      previousEnd = new Date(start.getTime() - 1);
      previousStart = startOfMonth(previousEnd);
      break;
    case 'trimestre':
      start = startOfQuarter(now);
      previousEnd = new Date(start.getTime() - 1);
      previousStart = startOfQuarter(previousEnd);
      break;
    case 'year':
      start = startOfYear(now);
      previousEnd = new Date(start.getTime() - 1);
      previousStart = startOfYear(previousEnd);
      break;
    case 'ultimos_30':
    default:
      start = subDays(now, 30);
      previousEnd = new Date(start.getTime() - 1);
      previousStart = subDays(previousEnd, 30);
      break;
  }

  return { start, end, previousStart, previousEnd };
}

function getPeriodoLabel(periodo: PeriodoRechazo): string {
  const now = new Date();
  switch (periodo) {
    case 'semana':
      return 'Esta semana';
    case 'mes_actual':
      return format(now, 'MMMM yyyy', { locale: es });
    case 'trimestre':
      return `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;
    case 'year':
      return `Año ${now.getFullYear()}`;
    case 'ultimos_30':
    default:
      return 'Últimos 30 días';
  }
}

async function fetchRejectionData(periodo: PeriodoRechazo): Promise<RejectionMetrics> {
  const { start, end, previousStart, previousEnd } = getDateRange(periodo);
  
  // Fetch current period rejections
  const { data: responses, error: responsesError } = await supabase
    .from('custodio_responses')
    .select(`
      id,
      tipo_respuesta,
      razon_rechazo,
      tiempo_respuesta_minutos,
      metadata,
      created_at,
      custodio_id
    `)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (responsesError) throw responsesError;

  // Fetch previous period for comparison
  const { data: previousResponses, error: prevError } = await supabase
    .from('custodio_responses')
    .select('tipo_respuesta')
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString());

  if (prevError) throw prevError;

  // Fetch custodian names from custodios_operativos (correct table)
  const custodioIds = [...new Set((responses || []).filter(r => r.tipo_respuesta === 'rechazo').map(r => r.custodio_id))];
  const { data: custodios } = await supabase
    .from('custodios_operativos')
    .select('id, nombre')
    .in('id', custodioIds.length > 0 ? custodioIds : ['00000000-0000-0000-0000-000000000000']);

  const custodioMap = new Map((custodios || []).map(c => [c.id, c.nombre]));

  // Process data
  const allResponses = responses || [];
  const rechazos = allResponses.filter(r => r.tipo_respuesta === 'rechazo');
  const aceptaciones = allResponses.filter(r => r.tipo_respuesta === 'aceptacion');

  const prevRechazos = (previousResponses || []).filter(r => r.tipo_respuesta === 'rechazo');
  const prevAceptaciones = (previousResponses || []).filter(r => r.tipo_respuesta === 'aceptacion');

  const totalRechazos = rechazos.length;
  const totalAceptaciones = aceptaciones.length;
  const total = totalRechazos + totalAceptaciones;
  const tasaRechazo = total > 0 ? (totalRechazos / total) * 100 : 0;

  // Previous period rate
  const prevTotal = prevRechazos.length + prevAceptaciones.length;
  const prevTasaRechazo = prevTotal > 0 ? (prevRechazos.length / prevTotal) * 100 : 0;
  const variacionVsPeriodoAnterior = prevTasaRechazo > 0 ? tasaRechazo - prevTasaRechazo : null;

  // Average response time
  const tiemposRespuesta = rechazos
    .map(r => r.tiempo_respuesta_minutos)
    .filter((t): t is number => t !== null && t > 0);
  const tiempoPromedioRechazo = tiemposRespuesta.length > 0
    ? tiemposRespuesta.reduce((a, b) => a + b, 0) / tiemposRespuesta.length
    : 0;

  // Group by category
  const categoryCount: Record<string, number> = {};
  const reasonCount: Record<string, { count: number; categoria: string; categoryId: string }> = {};

  rechazos.forEach(r => {
    const metadata = r.metadata as { categoria_rechazo?: string; razon_especifica?: string; metodo_contacto?: string } | null;
    let categoryId = metadata?.categoria_rechazo || 'comunicacion_otros';
    let reason = metadata?.razon_especifica || r.razon_rechazo || 'No especificado';

    // Try to parse from razon_rechazo if metadata is missing
    if (!metadata?.categoria_rechazo && r.razon_rechazo) {
      const parsed = getCategoryFromReason(r.razon_rechazo);
      if (parsed) {
        categoryId = parsed.categoryId;
      }
    }

    const categoryLabel = REJECTION_CATEGORIES[categoryId]?.label || 'Otros';

    categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1;
    
    if (!reasonCount[reason]) {
      reasonCount[reason] = { count: 0, categoria: categoryLabel, categoryId };
    }
    reasonCount[reason].count++;
  });

  // Format category data for donut chart
  const porCategoria: RejectionByCategory[] = Object.entries(categoryCount)
    .map(([categoryId, count]) => ({
      categoryId,
      categoryLabel: REJECTION_CATEGORIES[categoryId]?.label || 'Otros',
      count,
      porcentaje: totalRechazos > 0 ? (count / totalRechazos) * 100 : 0,
      color: REJECTION_CATEGORIES[categoryId]?.color || 'hsl(0 0% 45%)'
    }))
    .sort((a, b) => b.count - a.count);

  // Format reason data for Pareto chart
  const sortedReasons = Object.entries(reasonCount)
    .map(([motivo, data]) => ({
      motivo,
      categoria: data.categoria,
      categoryId: data.categoryId,
      count: data.count,
      porcentaje: totalRechazos > 0 ? (data.count / totalRechazos) * 100 : 0,
      acumulado: 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate cumulative percentage for Pareto
  let cumulative = 0;
  sortedReasons.forEach(r => {
    cumulative += r.porcentaje;
    r.acumulado = cumulative;
  });

  // Build trend data (group by week or month depending on period)
  const trendMap: Record<string, { rechazos: number; aceptaciones: number }> = {};
  
  allResponses.forEach(r => {
    const date = parseISO(r.created_at);
    let key: string;
    
    if (periodo === 'semana' || periodo === 'ultimos_30') {
      // Group by day
      key = format(date, 'dd/MM');
    } else {
      // Group by week
      key = format(startOfWeek(date, { weekStartsOn: 1 }), 'dd/MM');
    }

    if (!trendMap[key]) {
      trendMap[key] = { rechazos: 0, aceptaciones: 0 };
    }

    if (r.tipo_respuesta === 'rechazo') {
      trendMap[key].rechazos++;
    } else if (r.tipo_respuesta === 'aceptacion') {
      trendMap[key].aceptaciones++;
    }
  });

  const tendencia: RejectionTrend[] = Object.entries(trendMap)
    .map(([periodo, data]) => ({
      periodo,
      periodoLabel: periodo,
      rechazos: data.rechazos,
      aceptaciones: data.aceptaciones,
      total: data.rechazos + data.aceptaciones,
      tasaRechazo: (data.rechazos + data.aceptaciones) > 0 
        ? (data.rechazos / (data.rechazos + data.aceptaciones)) * 100 
        : 0
    }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo));

  // Recent rejections for detail table
  const rechazosRecientes: RecentRejection[] = rechazos
    .slice(0, 20)
    .map(r => {
      const metadata = r.metadata as { categoria_rechazo?: string; razon_especifica?: string; metodo_contacto?: string } | null;
      let categoryId = metadata?.categoria_rechazo || 'comunicacion_otros';
      
      if (!metadata?.categoria_rechazo && r.razon_rechazo) {
        const parsed = getCategoryFromReason(r.razon_rechazo);
        if (parsed) categoryId = parsed.categoryId;
      }

      // Extract specific reason: prefer metadata, then parse from composite string
      let motivo = metadata?.razon_especifica || 'No especificado';
      if (motivo === 'No especificado' && r.razon_rechazo) {
        // Parse "Category: Specific Reason" format
        if (r.razon_rechazo.includes(':')) {
          motivo = r.razon_rechazo.split(':').slice(1).join(':').trim();
        } else {
          motivo = r.razon_rechazo;
        }
      }

      return {
        id: r.id,
        fecha: parseISO(r.created_at),
        custodioNombre: custodioMap.get(r.custodio_id) || 'Sin nombre',
        categoria: REJECTION_CATEGORIES[categoryId]?.label || 'Otros',
        motivo: motivo || 'No especificado',
        tiempoRespuesta: r.tiempo_respuesta_minutos,
        metodoContacto: metadata?.metodo_contacto || null
      };
    })
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  return {
    totalRechazos,
    totalAceptaciones,
    tasaRechazo,
    tiempoPromedioRechazo,
    variacionVsPeriodoAnterior,
    periodoAnteriorLabel: 'período anterior',
    porCategoria,
    topMotivos: sortedReasons,
    tendencia,
    rechazosRecientes,
    periodoLabel: getPeriodoLabel(periodo),
    fechaInicio: start,
    fechaFin: end
  };
}

export function useRejectionAnalytics(periodo: PeriodoRechazo = 'mes_actual') {
  return useAuthenticatedQuery<RejectionMetrics>(
    ['rejection-analytics', periodo],
    () => fetchRejectionData(periodo),
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false
    }
  );
}
