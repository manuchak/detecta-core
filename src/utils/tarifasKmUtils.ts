import { supabase } from '@/integrations/supabase/client';

export interface TarifaKmRango {
  km_min: number;
  km_max: number | null;
  tarifa_por_km: number;
  descripcion: string;
}

// Fallback hardcoded rates
const TARIFAS_FALLBACK: TarifaKmRango[] = [
  { km_min: 0, km_max: 100, tarifa_por_km: 6.0, descripcion: '0-100 km' },
  { km_min: 100, km_max: 250, tarifa_por_km: 5.5, descripcion: '101-250 km' },
  { km_min: 250, km_max: 400, tarifa_por_km: 5.0, descripcion: '251-400 km' },
  { km_min: 400, km_max: null, tarifa_por_km: 4.6, descripcion: '400+ km' },
];

const MAX_KM_POR_SERVICIO = 700;

let cachedTarifas: TarifaKmRango[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch tarifas from DB with in-memory cache. Falls back to hardcoded values.
 */
export async function fetchTarifasKm(): Promise<TarifaKmRango[]> {
  const now = Date.now();
  if (cachedTarifas && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedTarifas;
  }

  try {
    const { data, error } = await supabase
      .from('tarifas_km_armados_internos')
      .select('km_min, km_max, tarifa_por_km, descripcion')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) {
      cachedTarifas = data as TarifaKmRango[];
      cacheTimestamp = now;
      return cachedTarifas;
    }
  } catch (err) {
    console.warn('Failed to fetch tarifas from DB, using fallback:', err);
  }

  return TARIFAS_FALLBACK;
}

/**
 * Calculate cost using escalonado (staircase) model.
 * Each km range has its own rate applied only to km within that range.
 */
export function calcularCostoEscalonado(km: number, tarifas: TarifaKmRango[]): number {
  const kmClamped = Math.min(Math.max(km, 0), MAX_KM_POR_SERVICIO);
  let costoTotal = 0;
  let kmRestantes = kmClamped;

  for (const tarifa of tarifas) {
    if (kmRestantes <= 0) break;
    const rangoMax = tarifa.km_max ?? Infinity;
    const kmEnRango = Math.min(kmRestantes, rangoMax - tarifa.km_min);
    costoTotal += kmEnRango * tarifa.tarifa_por_km;
    kmRestantes -= kmEnRango;
  }

  return costoTotal;
}

/**
 * Simple lookup: find which range the km falls into and apply that flat rate.
 */
export function calcularCostoPlano(km: number, tarifas: TarifaKmRango[]): { costo: number; tarifa: number; rango: string } {
  const kmClamped = Math.min(Math.max(km, 0), MAX_KM_POR_SERVICIO);
  const t = tarifas.find(t => {
    const max = t.km_max ?? Infinity;
    return kmClamped > t.km_min && kmClamped <= max;
  }) || tarifas[tarifas.length - 1];

  return {
    costo: kmClamped * t.tarifa_por_km,
    tarifa: t.tarifa_por_km,
    rango: t.descripcion,
  };
}
