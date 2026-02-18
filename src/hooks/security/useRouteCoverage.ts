import { useMemo } from 'react';
import { analyzeRouteCoverage, RouteConnectivityReport, getCoverageStats } from '@/lib/security/cellularCoverage';

interface UseRouteCoverageProps {
  routeCoordinates: [number, number][] | null;
  totalRouteKm: number;
}

interface UseRouteCoverageReturn {
  report: RouteConnectivityReport | null;
  stats: ReturnType<typeof getCoverageStats>;
  connectivityBadge: { label: string; color: string; icon: string };
  hasIssues: boolean;
}

export const useRouteCoverage = ({ routeCoordinates, totalRouteKm }: UseRouteCoverageProps): UseRouteCoverageReturn => {
  const stats = useMemo(() => getCoverageStats(), []);
  
  const report = useMemo(() => {
    if (!routeCoordinates || routeCoordinates.length === 0 || totalRouteKm <= 0) return null;
    return analyzeRouteCoverage(routeCoordinates, totalRouteKm);
  }, [routeCoordinates, totalRouteKm]);
  
  const connectivityBadge = useMemo(() => {
    if (!report) return { label: 'Sin analizar', color: 'bg-muted text-muted-foreground', icon: '📶' };
    
    switch (report.overallConnectivity) {
      case 'full': return { label: 'Cobertura completa', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: '✅' };
      case 'partial': return { label: `Cobertura parcial (${report.deadZonesCrossed.length} zonas)`, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: '⚠️' };
      case 'critical': return { label: `Cobertura crítica (${report.totalKmWithoutSignal}km sin señal)`, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: '🚫' };
      default: return { label: 'Desconocido', color: 'bg-muted text-muted-foreground', icon: '❓' };
    }
  }, [report]);
  
  const hasIssues = report ? report.overallConnectivity !== 'full' : false;
  
  return { report, stats, connectivityBadge, hasIssues };
};