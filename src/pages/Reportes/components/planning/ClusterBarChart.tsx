import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ClusterInactividad, ClusterKey } from '../../types/planningResources';
import { CLUSTER_CONFIG } from '../../types/planningResources';

interface ClusterBarChartProps {
  clusters: ClusterInactividad;
  total: number;
  showNuncaAsignado?: boolean;
}

export default function ClusterBarChart({ clusters, total, showNuncaAsignado = true }: ClusterBarChartProps) {
  // Definir orden de clusters para mostrar
  const clusterOrder: ClusterKey[] = showNuncaAsignado
    ? ['activo_30d', 'inactivo_30_60d', 'inactivo_60_90d', 'inactivo_90_120d', 'inactivo_mas_120d', 'nunca_asignado']
    : ['activo_30d', 'inactivo_30_60d', 'inactivo_60_90d', 'inactivo_90_120d', 'inactivo_mas_120d'];
  
  // Calcular total excluyendo nunca_asignado si no se muestra
  const totalParaBarra = showNuncaAsignado 
    ? total 
    : total - clusters.nunca_asignado;
  
  if (totalParaBarra === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        Sin datos disponibles
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Barra apilada */}
      <TooltipProvider>
        <div className="flex h-6 rounded-full overflow-hidden bg-muted/30">
          {clusterOrder.map((key) => {
            const value = clusters[key];
            const percentage = (value / totalParaBarra) * 100;
            
            if (percentage === 0) return null;
            
            const config = CLUSTER_CONFIG[key];
            
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div
                    className={`${config.bgClass} transition-all hover:opacity-80 cursor-default`}
                    style={{ width: `${percentage}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <span className="font-medium">{config.label}</span>
                    <span className="ml-2">{value} ({percentage.toFixed(1)}%)</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      
      {/* Leyenda compacta */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
        {clusterOrder.map((key) => {
          const value = clusters[key];
          const config = CLUSTER_CONFIG[key];
          
          return (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${config.bgClass}`} />
              <span className="text-muted-foreground truncate">{config.label}</span>
              <span className="font-medium ml-auto">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
