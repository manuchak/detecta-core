import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PricingResult {
  id?: string;
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  precio_sugerido: number | null;
  precio_custodio: number | null;
  pago_custodio_sin_arma?: number | null;
  costo_operativo?: number | null;
  margen_estimado?: number | null;
  distancia_km: number | null;
  tipo_servicio: string | null;
  incluye_armado?: boolean;
  es_ruta_reparto: boolean;
  puntos_intermedios?: string[] | null;
  numero_paradas?: number;
  ruta_encontrada?: string;
}

export type MatchType = 'exact' | 'flexible' | 'destination-only' | null;

interface UsePricingSearchResult {
  searchPrice: (cliente: string, origen: string, destino: string) => Promise<void>;
  pricingResult: PricingResult | null;
  pricingError: string | null;
  isSearching: boolean;
  matchType: MatchType;
  clearPricing: () => void;
}

// Normalizar texto de ubicaciones para comparación flexible
const normalizeLocationText = (text: string): string => {
  return text
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/\s*(EDO\.?\s*MEX\.?|EDOMEX|ESTADO DE MEXICO)\s*$/i, '') // Quitar sufijos
    .replace(/\s+/g, ' ')
    .replace(/,\s*/g, ' ')
    .trim();
};

// Extraer palabra clave principal de una ubicación
const extractPrimaryKeyword = (text: string): string => {
  const normalized = normalizeLocationText(text);
  return normalized.split(' ')[0] || text;
};

export function usePricingSearch(): UsePricingSearchResult {
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>(null);

  const clearPricing = useCallback(() => {
    setPricingResult(null);
    setPricingError(null);
    setMatchType(null);
  }, []);

  const searchPrice = useCallback(async (cliente: string, origen: string, destino: string) => {
    if (!cliente || !origen || !destino) return;

    setIsSearching(true);
    setPricingError(null);
    setMatchType(null);

    try {
      console.log('🔍 [usePricingSearch] Buscando precio:', { cliente, origen, destino });

      // NIVEL 1: Búsqueda exacta (case-insensitive)
      const { data: exactData, error: exactError } = await supabase
        .from('matriz_precios_rutas')
        .select('id, cliente_nombre, origen_texto, destino_texto, valor_bruto, precio_custodio, pago_custodio_sin_arma, costo_operativo, margen_neto_calculado, distancia_km, tipo_servicio')
        .eq('activo', true)
        .ilike('cliente_nombre', cliente)
        .ilike('origen_texto', origen)
        .ilike('destino_texto', destino)
        .limit(1)
        .maybeSingle();

      if (exactError) throw exactError;

      if (exactData) {
        const row = exactData;
        const incluye_armado = row.tipo_servicio && !['SIN ARMA', 'Sin arma', 'SN ARMA', 'NO ARMADA', 'No Armada'].includes(row.tipo_servicio);
        setPricingResult({
          id: row.id,
          cliente_nombre: row.cliente_nombre,
          origen_texto: row.origen_texto,
          destino_texto: row.destino_texto,
          precio_sugerido: row.valor_bruto,
          precio_custodio: row.precio_custodio,
          pago_custodio_sin_arma: row.pago_custodio_sin_arma,
          costo_operativo: row.costo_operativo,
          margen_estimado: row.margen_neto_calculado,
          distancia_km: row.distancia_km,
          tipo_servicio: row.tipo_servicio,
          incluye_armado,
          es_ruta_reparto: false,
          ruta_encontrada: `${row.origen_texto} → ${row.destino_texto}`
        });
        setMatchType('exact');
        toast.success('Pricing encontrado (coincidencia exacta)');
        return;
      }

      // NIVEL 2: Búsqueda flexible por palabras clave
      const origenKeyword = extractPrimaryKeyword(origen);
      const destinoKeyword = extractPrimaryKeyword(destino);

      console.log('🔍 [usePricingSearch] NIVEL 2 con keywords:', { origenKeyword, destinoKeyword });

      const { data: flexibleData, error: flexibleError } = await supabase
        .from('matriz_precios_rutas')
        .select('id, cliente_nombre, origen_texto, destino_texto, valor_bruto, precio_custodio, pago_custodio_sin_arma, costo_operativo, margen_neto_calculado, distancia_km, tipo_servicio')
        .eq('activo', true)
        .ilike('cliente_nombre', cliente)
        .ilike('origen_texto', `%${origenKeyword}%`)
        .ilike('destino_texto', `%${destinoKeyword}%`)
        .limit(5);

      if (flexibleError) throw flexibleError;

      if (flexibleData && flexibleData.length > 0) {
        // Encontrar mejor coincidencia comparando texto normalizado
        const normalizedOrigen = normalizeLocationText(origen);
        const normalizedDestino = normalizeLocationText(destino);

        let bestMatch = flexibleData[0];
        let bestScore = 0;

        for (const row of flexibleData) {
          let score = 0;
          if (normalizeLocationText(row.origen_texto) === normalizedOrigen) score += 2;
          if (normalizeLocationText(row.destino_texto) === normalizedDestino) score += 2;
          if (row.origen_texto.toUpperCase().includes(origenKeyword)) score += 1;
          if (row.destino_texto.toUpperCase().includes(destinoKeyword)) score += 1;

          if (score > bestScore) {
            bestScore = score;
            bestMatch = row;
          }
        }

        const incluye_armado = bestMatch.tipo_servicio && !['SIN ARMA', 'Sin arma', 'SN ARMA', 'NO ARMADA', 'No Armada'].includes(bestMatch.tipo_servicio);
        setPricingResult({
          id: bestMatch.id,
          cliente_nombre: bestMatch.cliente_nombre,
          origen_texto: bestMatch.origen_texto,
          destino_texto: bestMatch.destino_texto,
          precio_sugerido: bestMatch.valor_bruto,
          precio_custodio: bestMatch.precio_custodio,
          pago_custodio_sin_arma: bestMatch.pago_custodio_sin_arma,
          costo_operativo: bestMatch.costo_operativo,
          margen_estimado: bestMatch.margen_neto_calculado,
          distancia_km: bestMatch.distancia_km,
          tipo_servicio: bestMatch.tipo_servicio,
          incluye_armado,
          es_ruta_reparto: false,
          ruta_encontrada: `${bestMatch.origen_texto} → ${bestMatch.destino_texto}`
        });
        setMatchType('flexible');
        toast.success('Pricing encontrado (coincidencia flexible)');
        return;
      }

      // NIVEL 3: Búsqueda solo por destino
      console.log('🔍 [usePricingSearch] NIVEL 3 - solo destino:', { destinoKeyword });

      const { data: destinoData, error: destinoError } = await supabase
        .from('matriz_precios_rutas')
        .select('id, cliente_nombre, origen_texto, destino_texto, valor_bruto, precio_custodio, pago_custodio_sin_arma, costo_operativo, margen_neto_calculado, distancia_km, tipo_servicio')
        .eq('activo', true)
        .ilike('cliente_nombre', cliente)
        .ilike('destino_texto', `%${destinoKeyword}%`)
        .limit(10);

      if (destinoError) throw destinoError;

      if (destinoData && destinoData.length > 0) {
        // Buscar mejor coincidencia de origen
        const normalizedOrigen = normalizeLocationText(origen);
        let bestMatch = destinoData[0];
        let bestScore = 0;

        for (const row of destinoData) {
          const rowOrigenNormalized = normalizeLocationText(row.origen_texto);
          let score = 0;

          if (rowOrigenNormalized === normalizedOrigen) score += 3;
          else if (rowOrigenNormalized.includes(origenKeyword)) score += 2;
          else if (row.origen_texto.toUpperCase().includes(origenKeyword)) score += 1;

          if (score > bestScore) {
            bestScore = score;
            bestMatch = row;
          }
        }

        const incluye_armado = bestMatch.tipo_servicio && !['SIN ARMA', 'Sin arma', 'SN ARMA', 'NO ARMADA', 'No Armada'].includes(bestMatch.tipo_servicio);
        setPricingResult({
          id: bestMatch.id,
          cliente_nombre: bestMatch.cliente_nombre,
          origen_texto: bestMatch.origen_texto,
          destino_texto: bestMatch.destino_texto,
          precio_sugerido: bestMatch.valor_bruto,
          precio_custodio: bestMatch.precio_custodio,
          pago_custodio_sin_arma: bestMatch.pago_custodio_sin_arma,
          costo_operativo: bestMatch.costo_operativo,
          margen_estimado: bestMatch.margen_neto_calculado,
          distancia_km: bestMatch.distancia_km,
          tipo_servicio: bestMatch.tipo_servicio,
          incluye_armado,
          es_ruta_reparto: false,
          ruta_encontrada: `${bestMatch.origen_texto} → ${bestMatch.destino_texto}`
        });
        setMatchType('destination-only');
        toast.info('Pricing encontrado (coincidencia por destino)');
        return;
      }

      // No se encontró pricing
      setPricingResult(null);
      setPricingError(`No se encontró pricing para ${origen} → ${destino}. Puedes crear una nueva ruta.`);
      toast.warning('No se encontró pricing. Puedes crear una nueva ruta.');

    } catch (error) {
      console.error('Error buscando pricing:', error);
      setPricingError('Error al buscar pricing. Por favor intenta de nuevo.');
      toast.error('Error al buscar pricing');
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    searchPrice,
    pricingResult,
    pricingError,
    isSearching,
    matchType,
    clearPricing
  };
}
