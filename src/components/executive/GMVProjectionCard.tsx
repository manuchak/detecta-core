import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRealisticProjectionsWithGuardrails } from '@/hooks/useRealisticProjectionsWithGuardrails';
import { usePreviousMonthData } from '@/hooks/usePreviousMonthData';
import { Loader2, TrendingUp, Target, DollarSign, AlertTriangle, Brain, Activity } from 'lucide-react';
import { getPaceStatus, getStatusTextColor } from '@/utils/paceStatus';
import { getCurrentMonthInfo, getDaysRemainingInMonth, formatMonthlyQuestion, getPreviousMonthName, capitalize } from '@/utils/dynamicDateUtils';
import { useMemo } from 'react';

export const GMVProjectionCard = () => {
  const { data, isLoading } = useRealisticProjectionsWithGuardrails();
  const previousMonthData = usePreviousMonthData();
  const currentMonth = getCurrentMonthInfo();
  const previousMonth = getPreviousMonthName();

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
            Proyección GMV {capitalize(currentMonth.fullName)}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Brain className="h-4 w-4 text-primary/60" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    {data.regime.mathematicalJustification}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge 
              variant={
                data.regime.type === 'exponential' ? 'default' :
                data.regime.type === 'volatile' ? 'destructive' :
                data.regime.type === 'declining' ? 'secondary' : 'outline'
              }
              className="text-xs"
            >
              <Activity className="h-3 w-3 mr-1" />
              {data.regime.type === 'exponential' ? '🚀 Exponencial' :
               data.regime.type === 'volatile' ? '⚡ Volátil' :
               data.regime.type === 'declining' ? '📉 Declive' : '📈 Normal'}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {data.daysRemaining} días restantes
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Answer */}
        <div className="text-center p-6 bg-gradient-to-r from-warning/10 to-primary/10 rounded-xl border border-warning/20">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            RESPUESTA: {formatMonthlyQuestion('¿Cómo cerramos')} en GMV
          </div>
          <div className="text-4xl font-bold text-warning mb-2">
            ${calculations.mostLikelyGMV.toFixed(1)}M
          </div>
          <div className="text-lg text-muted-foreground flex items-center justify-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span>Proyección más probable ({data.mostLikely.probability}%)</span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs max-w-sm space-y-1">
                    <p><strong>Régimen detectado:</strong> {data.regime.type}</p>
                    <p><strong>Confianza matemática:</strong> {(data.regime.confidence * 100).toFixed(1)}%</p>
                    {data.regime.adaptiveGuardrails && (
                      <p><strong>⚙️ Ajustado por guardrails adaptativos</strong></p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge 
              variant={
                data.confidence.overall === 'high' ? 'default' :
                data.confidence.overall === 'medium' ? 'secondary' : 'destructive'
              }
              className="text-xs"
            >
              {data.confidence.overall === 'high' ? '🎯 Alta confianza' :
               data.confidence.overall === 'medium' ? '⚖️ Media confianza' : '⚠️ Baja confianza'}
            </Badge>
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

        {/* Comparison vs Previous Month */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">vs {previousMonthData.month}:</div>
              <div className="text-sm text-muted-foreground">
                {previousMonthData.month} cerró con ${previousMonthData.gmv.toFixed(1)}M GMV
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${calculations.mostLikelyGMV > previousMonthData.gmv ? 'text-success' : 'text-destructive'}`}>
                {calculations.mostLikelyGMV > previousMonthData.gmv ? '+' : ''}
                ${(calculations.mostLikelyGMV - previousMonthData.gmv).toFixed(1)}M
              </div>
              <div className={`text-sm ${calculations.mostLikelyGMV > previousMonthData.gmv ? 'text-success' : 'text-destructive'}`}>
                {calculations.mostLikelyGMV > previousMonthData.gmv ? '+' : ''}
                {(((calculations.mostLikelyGMV - previousMonthData.gmv) / previousMonthData.gmv) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Confidence & Warnings */}
        <div className={`p-3 rounded-lg border ${
          data.confidence.overall === 'high' ? 'bg-success/10 border-success/20' :
          data.confidence.overall === 'medium' ? 'bg-warning/10 border-warning/20' :
          'bg-destructive/10 border-destructive/20'
        }`}>
          <div className={`flex items-start gap-2 ${
            data.confidence.overall === 'high' ? 'text-success' :
            data.confidence.overall === 'medium' ? 'text-warning' : 'text-destructive'
          }`}>
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium">
                {calculations.mostLikelyGMV < previousMonthData.gmv ? 
                  `Riesgo: faltarían $${(previousMonthData.gmv - calculations.mostLikelyGMV).toFixed(1)}M para superar ${previousMonthData.month}. Necesitas ${data.insights.paceNeeded} servicios/día vs ${data.current.dailyPace.toFixed(1)} actual.` :
                  `En camino de superar ${previousMonthData.month} por $${(calculations.mostLikelyGMV - previousMonthData.gmv).toFixed(1)}M`
                }
              </div>
              {data.confidence.warnings.length > 0 && (
                <div className="text-xs space-y-1">
                  {data.confidence.warnings.map((warning, idx) => (
                    <div key={idx}>⚠️ {warning}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};