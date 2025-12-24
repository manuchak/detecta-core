
import { QueryClient } from '@tanstack/react-query';

// Configuración optimizada para el cache del dashboard
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache por 1 minuto - reduced for fresher data
        staleTime: 1 * 60 * 1000,
        // Mantener en memoria por 3 minutos
        gcTime: 3 * 60 * 1000,
        // Refetch automático en focus - ENABLED for fresh data
        refetchOnWindowFocus: true,
        // Refetch automático al montar - ENABLED for navigation updates
        refetchOnMount: true,
        // Retry solo 2 veces
        retry: 2,
        // Delay progresivo en retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
};

// Estrategias de pre-carga para datos críticos
export const preloadCriticalData = async (queryClient: QueryClient) => {
  // Pre-cargar datos más comunes
  const commonQueries = [
    ['dashboard-services', 'month', 'all'],
    ['dashboard-services', 'monthToDate', 'all'],
    ['gmv-analysis-complete']
  ];

  // Ejecutar pre-carga en paralelo
  await Promise.allSettled(
    commonQueries.map(queryKey => 
      queryClient.prefetchQuery({
        queryKey,
        staleTime: 5 * 60 * 1000, // 5 minutos para pre-carga
      })
    )
  );
};

// Invalidar cache selectivamente
export const invalidateDashboardCache = (queryClient: QueryClient, timeframe?: string) => {
  if (timeframe) {
    // Invalidar solo queries específicas del timeframe
    queryClient.invalidateQueries({
      queryKey: ['dashboard-services', timeframe],
    });
  } else {
    // Invalidar todo el cache del dashboard
    queryClient.invalidateQueries({
      queryKey: ['dashboard-services'],
    });
    queryClient.invalidateQueries({
      queryKey: ['gmv-analysis-complete'],
    });
  }
};

// Optimización de memoria - limpiar cache antiguo
export const cleanupOldCache = (queryClient: QueryClient) => {
  // Remover queries no utilizadas por más de 15 minutos
  queryClient.getQueryCache().clear();
  
  // Recolección de basura forzada
  if (typeof window !== 'undefined' && window.gc) {
    window.gc();
  }
};

// Monitor de performance del cache
export const monitorCachePerformance = (queryClient: QueryClient) => {
  const cache = queryClient.getQueryCache();
  
  return {
    totalQueries: cache.getAll().length,
    staleQueries: cache.getAll().filter(query => query.isStale()).length,
    activeQueries: cache.getAll().filter(query => query.getObserversCount() > 0).length,
    memoryUsage: JSON.stringify(cache.getAll()).length, // Aproximación del uso de memoria
  };
};
