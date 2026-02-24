/**
 * Hook unificado para métricas MTD — Single Source of Truth
 * 
 * Todas las tarjetas, paneles y gráficos que muestren "GMV MTD"
 * deben consumir este hook para garantizar consistencia.
 * 
 * Criterios canónicos:
 * - Fuente: servicios_custodia via fetchAllPaginated
 * - Filtro: NOT estado = 'Cancelado'
 * - Conversión: parseFloat(String(cobro_cliente || 0))
 * - Rango: MTD (día 1 a hoy) via getCurrentMTDRange
 * - Cache: query key ['unified-mtd-metrics']
 */

import { useQuery } from '@tanstack/react-query';
import { fetchUnifiedMTDMetrics, type UnifiedMTDResult } from '@/services/gmvMTDService';

export function useUnifiedMTDMetrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['unified-mtd-metrics'],
    queryFn: fetchUnifiedMTDMetrics,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  return {
    data,
    loading: isLoading,
    error,
    // Convenience accessors
    gmvMTD: data?.gmvMTD ?? 0,
    gmvPrevMTD: data?.gmvPrevMTD ?? 0,
    gmvVariacion: data?.gmvVariacion ?? 0,
    serviciosMTD: data?.serviciosMTD ?? 0,
    serviciosPrevMTD: data?.serviciosPrevMTD ?? 0,
    aovMTD: data?.aovMTD ?? 0,
    clientesMTD: data?.clientesMTD ?? 0,
    custodiosMTD: data?.custodiosMTD ?? 0,
    armadosMTD: data?.armadosMTD ?? 0,
    gmvByClient: data?.gmvByClient ?? [],
    gmvByClientPrev: data?.gmvByClientPrev ?? [],
  };
}

export type { UnifiedMTDResult };
