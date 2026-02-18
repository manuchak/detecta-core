import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';

const TIMEZONE_CDMX = 'America/Mexico_City';
const ON_TIME_TOLERANCE_MIN = 15;

export interface PerformanceMetrics {
  totalServicios: number;
  fillRate: number;
  onTimeRate: number;
  otifRate: number;
  checklistsCompletados: number;
  checklistsRate: number;
  custodiosActivos: number;
  serviciosPorCustodio: number;
}

export interface ProblemEntry {
  nombre: string;
  totalServicios: number;
  onTime: number;
  late: number;
  onTimeRate: number;
}

interface ServiceMerged {
  id_servicio: string;
  nombre_cliente: string | null;
  custodio_asignado: string | null;
  fecha_hora_cita: string | null;
  hora_inicio_real: string | null;
  hora_presentacion: string | null;
  checklist_completo: boolean;
}

async function fetchPerformanceData() {
  // Determine today's date range in CDMX timezone
  const now = new Date();
  const todayCDMX = formatInTimeZone(now, TIMEZONE_CDMX, 'yyyy-MM-dd');
  // CDMX is UTC-6 permanently (no DST since 2023)
  const dayStartUTC = `${todayCDMX}T00:00:00-06:00`;
  const dayEndUTC = `${todayCDMX}T23:59:59-06:00`;

  // Query 1: servicios_planificados del día (no cancelados)
  const { data: planificados, error: e1 } = await supabase
    .from('servicios_planificados')
    .select('id_servicio, nombre_cliente, custodio_asignado, fecha_hora_cita, hora_inicio_real')
    .gte('fecha_hora_cita', dayStartUTC)
    .lte('fecha_hora_cita', dayEndUTC)
    .is('fecha_cancelacion', null);

  if (e1) throw e1;

  // Query 2: servicios_custodia del día (for hora_presentacion)
  const { data: custodias, error: e2 } = await supabase
    .from('servicios_custodia')
    .select('id_servicio, hora_presentacion')
    .gte('fecha_hora_cita', dayStartUTC)
    .lte('fecha_hora_cita', dayEndUTC);

  if (e2) throw e2;

  // Query 3: checklist_servicio del día
  const { data: checklists, error: e3 } = await supabase
    .from('checklist_servicio')
    .select('servicio_id, estado')
    .gte('created_at', dayStartUTC)
    .lte('created_at', dayEndUTC);

  if (e3) throw e3;

  // Build lookup maps
  const custodiaMap = new Map<string, string | null>();
  for (const c of custodias || []) {
    if (c.id_servicio) custodiaMap.set(c.id_servicio, c.hora_presentacion);
  }

  const checklistMap = new Map<string, boolean>();
  for (const cl of checklists || []) {
    if (cl.servicio_id) {
      checklistMap.set(cl.servicio_id, cl.estado === 'completo');
    }
  }

  // Merge
  const merged: ServiceMerged[] = (planificados || []).map(sp => ({
    id_servicio: sp.id_servicio,
    nombre_cliente: sp.nombre_cliente,
    custodio_asignado: sp.custodio_asignado,
    fecha_hora_cita: sp.fecha_hora_cita,
    hora_inicio_real: sp.hora_inicio_real,
    hora_presentacion: custodiaMap.get(sp.id_servicio) || null,
    checklist_completo: checklistMap.get(sp.id_servicio) || false,
  }));

  return computeMetrics(merged);
}

function isOnTime(arrivalISO: string | null, citaISO: string | null): boolean | null {
  if (!arrivalISO || !citaISO) return null;
  const arrival = new Date(arrivalISO).getTime();
  const cita = new Date(citaISO).getTime();
  return arrival <= cita + ON_TIME_TOLERANCE_MIN * 60_000;
}

function computeMetrics(services: ServiceMerged[]) {
  const total = services.length;
  const conCustodio = services.filter(s => s.custodio_asignado).length;

  let onTimeCount = 0;
  let otifCount = 0;
  let evaluableCount = 0; // services where we can determine on-time status

  const clientMap = new Map<string, { total: number; onTime: number }>();
  const custodioMap = new Map<string, { total: number; onTime: number }>();

  for (const s of services) {
    const arrivalTime = s.hora_presentacion || s.hora_inicio_real;
    const onTime = isOnTime(arrivalTime, s.fecha_hora_cita);

    if (onTime !== null) {
      evaluableCount++;
      if (onTime) onTimeCount++;
      if (onTime && s.checklist_completo) otifCount++;
    }

    // Group by client
    if (s.nombre_cliente) {
      const key = s.nombre_cliente;
      const entry = clientMap.get(key) || { total: 0, onTime: 0 };
      if (onTime !== null) {
        entry.total++;
        if (onTime) entry.onTime++;
      }
      clientMap.set(key, entry);
    }

    // Group by custodio
    if (s.custodio_asignado) {
      const key = s.custodio_asignado;
      const entry = custodioMap.get(key) || { total: 0, onTime: 0 };
      if (onTime !== null) {
        entry.total++;
        if (onTime) entry.onTime++;
      }
      custodioMap.set(key, entry);
    }
  }

  const checklistsCompletados = services.filter(s => s.checklist_completo).length;
  const custodiosUnicos = new Set(services.filter(s => s.custodio_asignado).map(s => s.custodio_asignado)).size;

  const metricas: PerformanceMetrics = {
    totalServicios: total,
    fillRate: total > 0 ? Math.round((conCustodio / total) * 100) : 0,
    onTimeRate: evaluableCount > 0 ? Math.round((onTimeCount / evaluableCount) * 100) : 0,
    otifRate: evaluableCount > 0 ? Math.round((otifCount / evaluableCount) * 100) : 0,
    checklistsCompletados,
    checklistsRate: total > 0 ? Math.round((checklistsCompletados / total) * 100) : 0,
    custodiosActivos: custodiosUnicos,
    serviciosPorCustodio: custodiosUnicos > 0 ? Math.round((total / custodiosUnicos) * 10) / 10 : 0,
  };

  // Build problem lists sorted by worst on-time rate, min 2 services
  const buildProblemList = (map: Map<string, { total: number; onTime: number }>): ProblemEntry[] => {
    return Array.from(map.entries())
      .filter(([, v]) => v.total >= 2)
      .map(([nombre, v]) => ({
        nombre,
        totalServicios: v.total,
        onTime: v.onTime,
        late: v.total - v.onTime,
        onTimeRate: Math.round((v.onTime / v.total) * 100),
      }))
      .sort((a, b) => a.onTimeRate - b.onTimeRate)
      .slice(0, 10);
  };

  return {
    metricas,
    problemasPorCliente: buildProblemList(clientMap),
    problemasPorCustodio: buildProblemList(custodioMap),
  };
}

export function usePerformanceDiario() {
  return useQuery({
    queryKey: ['performance-diario'],
    queryFn: fetchPerformanceData,
    refetchInterval: 5 * 60_000, // refresh every 5 min
    staleTime: 2 * 60_000,
  });
}
