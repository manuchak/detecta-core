import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealisticProjections } from '@/hooks/useRealisticProjections';
import { Loader2, TrendingUp, Target, DollarSign, AlertTriangle } from 'lucide-react';
import { getPaceStatus, getStatusTextColor } from '@/utils/paceStatus';
import { useMemo } from 'react';

export const GMVProjectionCard = () => {
  const { data, isLoading } = useRealisticProjections();

  const calculations = useMemo(() => {
    if (!data) return null;
    
    const mostLikelyGMV = data.mostLikely.gmv;
    const currentGMV = data.current.gmv;
    const remainingGMV = mostLikelyGMV - currentGMV;
    const dailyGMVNeeded = remainingGMV / data.daysRemaining;
    
    // Status for daily pace (current vs needed)
    const paceStatus = getPaceStatus(data.current.dailyPace, data.insights.paceNeeded);
    
    return {
      mostLikelyGMV,
      currentGMV,
      remainingGMV,
      dailyGMVNeeded,
      paceStatus
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !calculations) return null;

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-medium flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-success" />
            Proyección GMV Diciembre 2024
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Quedan {data.daysRemaining} días
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Answer */}
        <div className="text-center p-6 bg-gradient-to-r from-warning/10 to-primary/10 rounded-xl border border-warning/20">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            RESPUESTA: ¿Cómo cerramos diciembre 2024 en GMV?
          </div>
          <div className="text-4xl font-bold text-warning mb-2">
            ${calculations.mostLikelyGMV.toFixed(1)}M
          </div>
          <div className="text-lg text-muted-foreground flex items-center justify-center gap-2">
            Proyección más probable ({data.mostLikely.probability}%)
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
        </div>

        {/* Scenarios */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Escenarios múltiples:</div>
          <div className="grid grid-cols-3 gap-3">
            {data.scenarios.map((scenario) => (
              <div key={scenario.name} className={`p-3 rounded-lg border ${
                scenario.color === 'destructive' ? 'bg-destructive/10 border-destructive/20' :
                scenario.color === 'warning' ? 'bg-warning/10 border-warning/20' :
                'bg-success/10 border-success/20'
              }`}>
                <div className={`text-lg font-bold ${
                  scenario.color === 'destructive' ? 'text-destructive' :
                  scenario.color === 'warning' ? 'text-warning' :
                  'text-success'
                }`}>
                  ${scenario.gmv.toFixed(1)}M
                </div>
                <div className="text-sm font-medium">{scenario.name}</div>
                <div className="text-xs text-muted-foreground">{scenario.probability}% prob.</div>
                <div className="text-xs text-muted-foreground mt-1">{scenario.services} servicios</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">${calculations.currentGMV.toFixed(1)}M</div>
            <div className="text-sm text-muted-foreground">GMV actual</div>
            <div className="text-xs text-success">
              {((calculations.currentGMV / calculations.mostLikelyGMV) * 100).toFixed(1)}% completado
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">${calculations.remainingGMV.toFixed(1)}M</div>
            <div className="text-sm text-muted-foreground">GMV restante</div>
            <div className="text-xs text-warning">
              {((calculations.remainingGMV / calculations.mostLikelyGMV) * 100).toFixed(1)}% por alcanzar
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{data.insights.paceNeeded}</div>
            <div className="text-sm text-muted-foreground">Servicios/día necesario</div>
            <div className={`text-xs font-medium ${getStatusTextColor(calculations.paceStatus.status)}`}>
              vs {data.current.dailyPace.toFixed(1)} actual
              {calculations.paceStatus.status === 'exceeding' ? ' ✓' : 
               calculations.paceStatus.status === 'behind' ? ' ⚠️' : ''}
            </div>
          </div>
        </div>

        {/* Comparison vs August */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">vs Noviembre 2024:</div>
              <div className="text-sm text-muted-foreground">
                Noviembre cerró con ${data.target.gmv.toFixed(1)}M GMV
              </div>
            </div>
            <div className="text-right">
            <div className={`text-lg font-bold ${calculations.mostLikelyGMV > data.target.gmv ? 'text-success' : 'text-destructive'}`}>
                {calculations.mostLikelyGMV > data.target.gmv ? '+' : ''}
                ${(calculations.mostLikelyGMV - data.target.gmv).toFixed(1)}M
              </div>
              <div className={`text-sm ${calculations.mostLikelyGMV > data.target.gmv ? 'text-success' : 'text-destructive'}`}>
                {calculations.mostLikelyGMV > data.target.gmv ? '+' : ''}
                {(((calculations.mostLikelyGMV - data.target.gmv) / data.target.gmv) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Action Item */}
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">
              {calculations.mostLikelyGMV < data.target.gmv ? 
                `Faltarían $${(data.target.gmv - calculations.mostLikelyGMV).toFixed(1)}M para igualar noviembre. Necesitas ${data.insights.paceNeeded} servicios/día vs ${data.current.dailyPace.toFixed(1)} actual.` :
                `En camino de superar noviembre por $${(calculations.mostLikelyGMV - data.target.gmv).toFixed(1)}M`
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};