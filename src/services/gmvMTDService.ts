/**
 * GMV MTD Service — Single Source of Truth
 * 
 * ⚠️ REGLA CANÓNICA para cálculo de GMV:
 * - Fuente: servicios_custodia (vía fetchAllPaginated, sin límite de 1000 rows)
 * - Filtro estado: NOT estado = 'Cancelado' (con C mayúscula, exacto)
 * - Filtro cobro: NO se filtra cobro_cliente > 0 (para consistencia de conteos)
 * - Conversión: parseFloat(String(s.cobro_cliente || 0))
 * - Rango: Parametrizable (MTD = día 1 a hoy)
 * 
 * Cualquier hook que necesite GMV MTD DEBE consumir este servicio
 * o usar el hook useUnifiedMTDMetrics.
 */

import { supabase } from '@/integrations/supabase/client';
import { fetchAllPaginated } from '@/utils/supabasePagination';
import { getCurrentMTDRange, getPreviousMTDRange, type MTDRange } from '@/utils/mtdDateUtils';

export interface MTDServiceRecord {
  id: number;
  cobro_cliente: number | null;
  nombre_cliente: string | null;
  nombre_custodio: string | null;
  nombre_armado: string | null;
  id_custodio: string | null;
  fecha_hora_cita: string | null;
  estado: string | null;
}

const CANONICAL_SELECT = 'id, cobro_cliente, nombre_cliente, nombre_custodio, nombre_armado, id_custodio, fecha_hora_cita, estado';

/**
 * Record de asignacion_armados para separar internos vs proveedor
 */
interface AssignmentRecord {
  armado_id: string | null;
  tipo_asignacion: string;
  servicio_custodia_id: string | null;
}

/**
 * Fetch asignaciones de armados para el rango MTD, excluyendo canceladas
 */
async function fetchMTDAssignments(range: MTDRange): Promise<AssignmentRecord[]> {
  return fetchAllPaginated<AssignmentRecord>(() =>
    supabase
      .from('asignacion_armados')
      .select('armado_id, tipo_asignacion, servicio_custodia_id')
      .gte('created_at', range.start)
      .lte('created_at', range.end + 'T23:59:59')
      .not('estado_asignacion', 'eq', 'cancelado')
  );
}

/**
 * Parseo canónico de cobro_cliente — siempre usar esta función
 */
export const parseCobroCanonical = (cobro: unknown): number => {
  const val = parseFloat(String(cobro || 0)) || 0;
  return val > 0 ? val : 0; // Solo positivos, consistente con RPC CASE WHEN cobro_cliente > 0
};

/**
 * Fetch servicios MTD con filtros canónicos y paginación completa
 */
export async function fetchMTDServices(range: MTDRange): Promise<MTDServiceRecord[]> {
  const data = await fetchAllPaginated<MTDServiceRecord>(() =>
    supabase
      .from('servicios_custodia')
      .select(CANONICAL_SELECT)
      .gte('fecha_hora_cita', range.start)
      .lte('fecha_hora_cita', range.end)
      .not('estado', 'eq', 'Cancelado')
  );
  return data;
}

/**
 * Calcula GMV total de un conjunto de servicios
 */
export function calculateGMV(services: MTDServiceRecord[]): number {
  return services.reduce((sum, s) => sum + parseCobroCanonical(s.cobro_cliente), 0);
}

/**
 * Agrega GMV por cliente — para donuts y tablas de top clientes
 */
export interface ClientGMVAggregate {
  cliente: string;
  gmv: number;
  servicios: number;
}

export function aggregateByClient(services: MTDServiceRecord[]): ClientGMVAggregate[] {
  const map: Record<string, { gmv: number; count: number }> = {};
  
  services.forEach(s => {
    const cliente = s.nombre_cliente || 'Sin nombre';
    if (!map[cliente]) map[cliente] = { gmv: 0, count: 0 };
    map[cliente].gmv += parseCobroCanonical(s.cobro_cliente);
    map[cliente].count += 1;
  });

  return Object.entries(map)
    .map(([cliente, data]) => ({
      cliente,
      gmv: data.gmv,
      servicios: data.count,
    }))
    .sort((a, b) => b.gmv - a.gmv);
}

/**
 * Fetch y cálculo completo de métricas MTD unificadas
 */
export interface UnifiedMTDResult {
  // Raw data
  currentServices: MTDServiceRecord[];
  previousServices: MTDServiceRecord[];
  // GMV
  gmvMTD: number;
  gmvPrevMTD: number;
  gmvVariacion: number;
  // Servicios
  serviciosMTD: number;
  serviciosPrevMTD: number;
  serviciosVariacion: number;
  // AOV
  aovMTD: number;
  aovPrevMTD: number;
  aovVariacion: number;
  // Clientes
  clientesMTD: number;
  clientesPrevMTD: number;
  clientesVariacion: number;
  // Custodios (DISTINCT por id_custodio UUID, fallback nombre normalizado)
  custodiosMTD: number;
  // Armados internos (DISTINCT armado_id from asignacion_armados tipo_asignacion='interno')
  armadosInternosMTD: number;
  armadosMTD: number; // legacy compat
  // Servicios con proveedor externo
  serviciosProveedorExternoMTD: number;
  // By client
  gmvByClient: ClientGMVAggregate[];
  gmvByClientPrev: ClientGMVAggregate[];
}

export async function fetchUnifiedMTDMetrics(): Promise<UnifiedMTDResult> {
  const now = new Date();
  const currentRange = getCurrentMTDRange(now);
  const prevRange = getPreviousMTDRange(now);

  const [currentServices, previousServices, currentAssignments] = await Promise.all([
    fetchMTDServices(currentRange),
    fetchMTDServices(prevRange),
    fetchMTDAssignments(currentRange),
  ]);

  const gmvMTD = calculateGMV(currentServices);
  const gmvPrevMTD = calculateGMV(previousServices);
  const serviciosMTD = currentServices.length;
  const serviciosPrevMTD = previousServices.length;

  const calcVar = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;

  const aovMTD = serviciosMTD > 0 ? gmvMTD / serviciosMTD : 0;
  const aovPrevMTD = serviciosPrevMTD > 0 ? gmvPrevMTD / serviciosPrevMTD : 0;

  const clientesMTD = new Set(currentServices.map(s => s.nombre_cliente).filter(Boolean)).size;
  const clientesPrevMTD = new Set(previousServices.map(s => s.nombre_cliente).filter(Boolean)).size;

  // Custodios: DISTINCT por id_custodio (UUID), fallback a nombre normalizado
  const custodioIdentifiers = new Set<string>();
  currentServices.forEach(s => {
    if (s.id_custodio) {
      custodioIdentifiers.add(s.id_custodio);
    } else if (s.nombre_custodio) {
      custodioIdentifiers.add(s.nombre_custodio.trim().toLowerCase());
    }
  });
  const custodiosMTD = custodioIdentifiers.size;

  // Armados internos: DISTINCT armado_id from asignacion_armados where tipo='interno'
  const armadosInternosMTD = new Set(
    currentAssignments
      .filter(a => a.tipo_asignacion === 'interno' && a.armado_id)
      .map(a => a.armado_id)
  ).size;

  // Servicios con proveedor externo: DISTINCT servicio_custodia_id where tipo='proveedor'
  const serviciosProveedorExternoMTD = new Set(
    currentAssignments
      .filter(a => a.tipo_asignacion === 'proveedor' && a.servicio_custodia_id)
      .map(a => a.servicio_custodia_id)
  ).size;

  // Legacy: mantener armadosMTD para backward compat
  const armadosMTD = new Set(currentServices.map(s => s.nombre_armado).filter(Boolean)).size;

  const gmvByClient = aggregateByClient(currentServices);
  const gmvByClientPrev = aggregateByClient(previousServices);

  const result: UnifiedMTDResult = {
    currentServices,
    previousServices,
    gmvMTD,
    gmvPrevMTD,
    gmvVariacion: calcVar(gmvMTD, gmvPrevMTD),
    serviciosMTD,
    serviciosPrevMTD,
    serviciosVariacion: calcVar(serviciosMTD, serviciosPrevMTD),
    aovMTD,
    aovPrevMTD,
    aovVariacion: calcVar(aovMTD, aovPrevMTD),
    clientesMTD,
    clientesPrevMTD,
    clientesVariacion: calcVar(clientesMTD, clientesPrevMTD),
    custodiosMTD,
    armadosInternosMTD,
    armadosMTD,
    serviciosProveedorExternoMTD,
    gmvByClient,
    gmvByClientPrev,
  };

  console.log('[GMV-AUDIT] Unified MTD Metrics:', {
    range: currentRange,
    prevRange,
    totalRows: serviciosMTD,
    prevRows: serviciosPrevMTD,
    gmvMTD: gmvMTD.toFixed(2),
    custodiosMTD,
    armadosInternosMTD,
    serviciosProveedorExternoMTD,
    armadosLegacy: armadosMTD,
    filter: "NOT estado = 'Cancelado'",
  });

  return result;
}
