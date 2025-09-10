import { lazy } from 'react';
import { QueryClient } from '@tanstack/react-query';

// Lazy loading de componentes para reducir el bundle inicial
export const LazyKPIDashboard = lazy(() => import('../pages/Planeacion/components/KPIDashboard'));
export const LazyServiciosTab = lazy(() => import('../pages/Planeacion/components/ServiciosTab'));
export const LazyMatrizPreciosTab = lazy(() => import('../pages/Planeacion/components/MatrizPreciosTab').then(module => ({ default: module.MatrizPreciosTab })));
export const LazyCustodiosTab = lazy(() => import('../pages/Planeacion/components/CustodiosTab'));
export const LazyClientesTab = lazy(() => import('../pages/Planeacion/components/ClientesTab'));
export const LazyComodatosGPSTab = lazy(() => import('../pages/Planeacion/components/ComodatosGPSTab').then(module => ({ default: module.ComodatosGPSTab })));

// Configuración optimizada para queries pesadas
export const PERFORMANCE_QUERY_CONFIG = {
  // Cache más agresivo para datos que cambian poco
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 15 * 60 * 1000, // 15 minutos en memoria
  refetchOnWindowFocus: false,
  refetchOnReconnect: 'always' as const,
  retry: 1,
  retryDelay: 1000,
};

// Configuración para datos críticos que necesitan estar frescos
export const CRITICAL_QUERY_CONFIG = {
  staleTime: 30 * 1000, // 30 segundos
  gcTime: 5 * 60 * 1000, // 5 minutos
  refetchOnWindowFocus: false,
  refetchInterval: 2 * 60 * 1000, // Refetch cada 2 minutos
  retry: 2,
};

// Pre-carga estratégica de datos más comunes
export const preloadPlaneacionData = async (queryClient: QueryClient) => {
  const criticalQueries = [
    'planeacion-stats',
    'matriz-precios',
    'servicios-overview'
  ];

  // Pre-cargar en paralelo solo las queries más críticas
  await Promise.allSettled(
    criticalQueries.map(queryKey => 
      queryClient.prefetchQuery({
        queryKey: [queryKey],
        staleTime: 2 * 60 * 1000, // Cache por 2 minutos para pre-carga
      })
    )
  );
};

// Limpieza de cache para liberar memoria
export const cleanupPlaneacionCache = (queryClient: QueryClient) => {
  // Remover queries antiguas que no se han usado
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  
  queries.forEach(query => {
    const lastUsed = query.state.dataUpdatedAt;
    const now = Date.now();
    const tenMinutesAgo = now - (10 * 60 * 1000);
    
    // Limpiar queries no usadas en los últimos 10 minutos
    if (lastUsed < tenMinutesAgo && query.getObserversCount() === 0) {
      cache.remove(query);
    }
  });
};

// Monitor de rendimiento
export const monitorPlaneacionPerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstContentfulPaint: performance.getEntriesByType('paint')
        .find(entry => entry.name === 'first-contentful-paint')?.startTime,
      memoryUsage: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit,
      } : null
    };
  }
  return null;
};