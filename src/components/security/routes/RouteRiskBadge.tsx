import React from 'react';
import { useRouteRiskAssessment } from '@/hooks/security/useRouteRiskAssessment';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, MapPin, CheckCircle2, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const RISK_STYLES: Record<string, { bg: string; text: string; icon: typeof Shield }> = {
  extremo: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-500', icon: AlertTriangle },
  alto: { bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-500', icon: AlertTriangle },
  medio: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-600', icon: Info },
  bajo: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-600', icon: CheckCircle2 },
};

interface Props {
  origen?: string;
  destino?: string;
}

export function RouteRiskBadge({ origen, destino }: Props) {
  const { data, isLoading } = useRouteRiskAssessment(origen, destino);

  if (!origen || !destino || origen.length < 3 || destino.length < 3) return null;

  if (isLoading) {
    return <Skeleton className="h-[120px] rounded-lg" />;
  }

  if (!data) return null;

  const style = RISK_STYLES[data.maxRiskLevel] || RISK_STYLES.bajo;
  const RiskIcon = style.icon;

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${style.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RiskIcon className={`h-4 w-4 ${style.text}`} />
          <span className="text-xs font-medium text-foreground">Evaluación de Riesgo de Ruta</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className={`text-[10px] ${style.text} border-current`}>
                {data.maxRiskLevel.toUpperCase()} · {data.maxScore}pts
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Score máximo en zonas monitoreadas (0-100)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {data.recentEventsCount} eventos (90d)
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {data.safePointsNearby} puntos seguros
        </span>
      </div>

      {data.recommendations.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-current/10">
          {data.recommendations.slice(0, 3).map((rec, i) => (
            <p key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
              <span className="shrink-0 mt-0.5">•</span>
              {rec}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
