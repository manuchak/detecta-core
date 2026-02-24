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
  fecha_hora_cita: string | null;
  estado: string | null;
}

const CANONICAL_SELECT = 'id, cobro_cliente, nombre_cliente, nombre_custodio, nombre_armado, fecha_hora_cita, estado';

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
  // Custodios
  custodiosMTD: number;
  armadosMTD: number;
  // By client
  gmvByClient: ClientGMVAggregate[];
  gmvByClientPrev: ClientGMVAggregate[];
}

export async function fetchUnifiedMTDMetrics(): Promise<UnifiedMTDResult> {
  const now = new Date();
  const currentRange = getCurrentMTDRange(now);
  const prevRange = getPreviousMTDRange(now);

  const [currentServices, previousServices] = await Promise.all([
    fetchMTDServices(currentRange),
    fetchMTDServices(prevRange),
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

  const custodiosMTD = new Set(currentServices.map(s => s.nombre_custodio).filter(Boolean)).size;
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
    armadosMTD,
    gmvByClient,
    gmvByClientPrev,
  };

  console.log('[GMV-AUDIT] Unified MTD Metrics:', {
    range: currentRange,
    prevRange,
    totalRows: serviciosMTD,
    prevRows: serviciosPrevMTD,
    gmvMTD: gmvMTD.toFixed(2),
    gmvPrevMTD: gmvPrevMTD.toFixed(2),
    variacion: result.gmvVariacion.toFixed(1) + '%',
    filter: "NOT estado = 'Cancelado'",
    pagination: 'fetchAllPaginated (no 1000-row limit)',
  });

  return result;
}
