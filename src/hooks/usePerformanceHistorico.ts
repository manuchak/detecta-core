import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE_CDMX } from '@/utils/cdmxTimezone';

const ON_TIME_TOLERANCE_MIN = 15;

interface PlanificadoRow {
  id_servicio: string;
  custodio_asignado: string | null;
  fecha_hora_cita: string | null;
  hora_inicio_real: string | null;
}

interface CustodiaRow {
  id_servicio: string;
  hora_presentacion: string | null;
}

interface ChecklistRow {
  servicio_id: string;
  estado: string | null;
}

interface MergedService {
  id_servicio: string;
  custodio_asignado: string | null;
  fecha_hora_cita: string | null;
  arrivalTime: string | null;
  checklistCompleto: boolean;
  diaCDMX: string; // yyyy-MM-dd
}

export interface PeriodMetrics {
  label: string;
  fillRate: number;
  onTimeRate: number;
  otifRate: number;
  checklistsRate: number;
  total: number;
}

export interface HistoricoData {
  daily: PeriodMetrics[];
  weekly: PeriodMetrics[];
  monthly: PeriodMetrics[];
  quarterly: PeriodMetrics[];
}

// Paginated fetch to bypass 1000-row limit
async function fetchAllPaginated<T>(
  queryFn: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await queryFn(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

function isOnTime(arrivalISO: string | null, citaISO: string | null): boolean | null {
  if (!arrivalISO || !citaISO) return null;
  const arrival = new Date(arrivalISO).getTime();
  const cita = new Date(citaISO).getTime();
  return arrival <= cita + ON_TIME_TOLERANCE_MIN * 60_000;
}

function computeGroupMetrics(services: MergedService[]): Omit<PeriodMetrics, 'label'> {
  const total = services.length;
  const conCustodio = services.filter(s => s.custodio_asignado).length;
  const conChecklist = services.filter(s => s.checklistCompleto).length;
  let onTimeCount = 0;
  let otifCount = 0;
  let evaluable = 0;

  for (const s of services) {
    const ot = isOnTime(s.arrivalTime, s.fecha_hora_cita);
    if (ot !== null) {
      evaluable++;
      if (ot) onTimeCount++;
      if (ot && s.checklistCompleto) otifCount++;
    }
  }

  return {
    fillRate: total > 0 ? Math.round((conCustodio / total) * 100) : 0,
    onTimeRate: evaluable > 0 ? Math.round((onTimeCount / evaluable) * 100) : 0,
    otifRate: evaluable > 0 ? Math.round((otifCount / evaluable) * 100) : 0,
    checklistsRate: total > 0 ? Math.round((conChecklist / total) * 100) : 0,
    total,
  };
}

function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const arr = map.get(key) || [];
    arr.push(item);
    map.set(key, arr);
  }
  return map;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

async function fetchHistoricoData(): Promise<HistoricoData> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const rangeStart = `${formatInTimeZone(twelveMonthsAgo, TIMEZONE_CDMX, 'yyyy-MM-dd')}T00:00:00-06:00`;
  const rangeEnd = `${formatInTimeZone(now, TIMEZONE_CDMX, 'yyyy-MM-dd')}T23:59:59-06:00`;

  // Fetch all 3 tables paginated
  const [planificados, custodias, checklists] = await Promise.all([
    fetchAllPaginated<PlanificadoRow>((from, to) =>
      supabase
        .from('servicios_planificados')
        .select('id_servicio, custodio_asignado, fecha_hora_cita, hora_inicio_real')
        .gte('fecha_hora_cita', rangeStart)
        .lte('fecha_hora_cita', rangeEnd)
        .is('fecha_cancelacion', null)
        .range(from, to)
    ),
    fetchAllPaginated<CustodiaRow>((from, to) =>
      supabase
        .from('servicios_custodia')
        .select('id_servicio, hora_presentacion')
        .gte('fecha_hora_cita', rangeStart)
        .range(from, to)
    ),
    fetchAllPaginated<ChecklistRow>((from, to) =>
      supabase
        .from('checklist_servicio')
        .select('servicio_id, estado')
        .gte('created_at', rangeStart)
        .range(from, to)
    ),
  ]);

  // Build lookup maps
  const custodiaMap = new Map<string, string | null>();
  for (const c of custodias) {
    if (c.id_servicio) custodiaMap.set(c.id_servicio, c.hora_presentacion);
  }
  const checklistMap = new Map<string, boolean>();
  for (const cl of checklists) {
    if (cl.servicio_id) checklistMap.set(cl.servicio_id, cl.estado === 'completo');
  }

  // Merge
  const merged: MergedService[] = planificados.map(sp => {
    const hp = custodiaMap.get(sp.id_servicio) || null;
    return {
      id_servicio: sp.id_servicio,
      custodio_asignado: sp.custodio_asignado,
      fecha_hora_cita: sp.fecha_hora_cita,
      arrivalTime: hp || sp.hora_inicio_real,
      checklistCompleto: checklistMap.get(sp.id_servicio) || false,
      diaCDMX: sp.fecha_hora_cita
        ? formatInTimeZone(sp.fecha_hora_cita, TIMEZONE_CDMX, 'yyyy-MM-dd')
        : '1970-01-01',
    };
  });

  // --- Daily (last 15 days) ---
  const todayCDMX = formatInTimeZone(now, TIMEZONE_CDMX, 'yyyy-MM-dd');
  const fifteenDaysAgo = new Date(now);
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  const fifteenDaysAgoCDMX = formatInTimeZone(fifteenDaysAgo, TIMEZONE_CDMX, 'yyyy-MM-dd');

  const recentServices = merged.filter(s => s.diaCDMX >= fifteenDaysAgoCDMX && s.diaCDMX <= todayCDMX);
  const dailyGroups = groupBy(recentServices, s => s.diaCDMX);
  const daily: PeriodMetrics[] = Array.from(dailyGroups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, svcs]) => {
      const d = date.split('-');
      return { label: `${d[2]}/${d[1]}`, ...computeGroupMetrics(svcs) };
    });

  // Filter out any future services (defense in depth)
  const pastServices = merged.filter(s => s.diaCDMX <= todayCDMX);

  // --- Weekly (last 12 weeks) ---
  const weeklyGroups = groupBy(pastServices, s => getISOWeek(s.diaCDMX));
  const weekly: PeriodMetrics[] = Array.from(weeklyGroups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, svcs]) => ({ label: week, ...computeGroupMetrics(svcs) }));

  // --- Monthly (last 12 months) ---
  const monthlyGroups = groupBy(pastServices, s => s.diaCDMX.substring(0, 7)); // yyyy-MM
  const monthly: PeriodMetrics[] = Array.from(monthlyGroups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([ym, svcs]) => {
      const [y, m] = ym.split('-');
      return { label: `${MONTH_NAMES[parseInt(m) - 1]} ${y}`, ...computeGroupMetrics(svcs) };
    });

  // --- Quarterly ---
  const quarterlyGroups = groupBy(pastServices, s => {
    const m = parseInt(s.diaCDMX.substring(5, 7));
    const q = Math.ceil(m / 3);
    return `${s.diaCDMX.substring(0, 4)}-Q${q}`;
  });
  const quarterly: PeriodMetrics[] = Array.from(quarterlyGroups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([qk, svcs]) => {
      const [y, q] = qk.split('-');
      return { label: `${q} ${y}`, ...computeGroupMetrics(svcs) };
    });

  return { daily, weekly, monthly, quarterly };
}

export function usePerformanceHistorico() {
  return useQuery({
    queryKey: ['performance-historico'],
    queryFn: fetchHistoricoData,
    staleTime: 10 * 60_000,
    refetchInterval: 10 * 60_000,
  });
}
