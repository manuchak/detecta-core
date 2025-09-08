import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMonthClosureAnalysis } from '@/hooks/useMonthClosureAnalysis';
import { Loader2, TrendingUp, Target, DollarSign } from 'lucide-react';

export const GMVProjectionCard = () => {
  const { data, isLoading } = useMonthClosureAnalysis();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const projectedGMV = data.projection.gmv;
  const currentGMV = data.current.gmv;
  const remainingGMV = projectedGMV - currentGMV;
  const dailyGMVNeeded = remainingGMV / data.daysRemaining;

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-medium flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-success" />
            Proyección GMV Septiembre
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Quedan {data.daysRemaining} días
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Answer */}
        <div className="text-center p-6 bg-gradient-to-r from-success/10 to-primary/10 rounded-xl border border-success/20">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            RESPUESTA: ¿Cómo cerramos septiembre en GMV?
          </div>
          <div className="text-4xl font-bold text-success mb-2">
            ${projectedGMV.toFixed(1)}M
          </div>
          <div className="text-lg text-muted-foreground">
            Proyección total GMV septiembre
          </div>
        </div>

        {/* Progress Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">${currentGMV.toFixed(1)}M</div>
            <div className="text-sm text-muted-foreground">GMV actual</div>
            <div className="text-xs text-success">
              {((currentGMV / projectedGMV) * 100).toFixed(1)}% completado
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">${remainingGMV.toFixed(1)}M</div>
            <div className="text-sm text-muted-foreground">GMV restante</div>
            <div className="text-xs text-warning">
              {((remainingGMV / projectedGMV) * 100).toFixed(1)}% por alcanzar
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">${dailyGMVNeeded.toFixed(0)}K</div>
            <div className="text-sm text-muted-foreground">GMV/día necesario</div>
            <div className="text-xs text-primary">
              {Math.round(dailyGMVNeeded * 1000000 / data.current.aov)} servicios/día
            </div>
          </div>
        </div>

        {/* Comparison vs August */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">vs Agosto 2025:</div>
              <div className="text-sm text-muted-foreground">
                Agosto cerró con ${data.target.gmv.toFixed(1)}M GMV
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${projectedGMV > data.target.gmv ? 'text-success' : 'text-destructive'}`}>
                {projectedGMV > data.target.gmv ? '+' : ''}
                ${(projectedGMV - data.target.gmv).toFixed(1)}M
              </div>
              <div className={`text-sm ${projectedGMV > data.target.gmv ? 'text-success' : 'text-destructive'}`}>
                {projectedGMV > data.target.gmv ? '+' : ''}
                {(((projectedGMV - data.target.gmv) / data.target.gmv) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Action Item */}
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-primary">
            <Target className="h-4 w-4" />
            <span className="font-medium">
              {projectedGMV > data.target.gmv ? 
                `¡En camino de superar agosto por $${(projectedGMV - data.target.gmv).toFixed(1)}M!` :
                `Necesitas acelerar para alcanzar agosto`
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};