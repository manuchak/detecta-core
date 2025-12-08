/**
 * Panel de precisión del forecast para GMVProjectionCard
 * Muestra MAPE, tendencia y feriados próximos
 */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useForecastAccuracyTracking } from '@/hooks/useForecastAccuracyTracking';
import { useHolidayAdjustment } from '@/hooks/useHolidayAdjustment';
import { ChevronDown, TrendingUp, TrendingDown, Minus, Calendar, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface ForecastAccuracyPanelProps {
  daysRemaining: number;
  ensembleConfidence?: number;
}

export const ForecastAccuracyPanel = ({ daysRemaining, ensembleConfidence }: ForecastAccuracyPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: accuracy, isLoading: accuracyLoading } = useForecastAccuracyTracking();
  const { data: holidays, isLoading: holidaysLoading } = useHolidayAdjustment(daysRemaining);
  
  if (accuracyLoading || holidaysLoading) return null;
  
  const mape = accuracy?.currentMAPE ?? 18.5;
  const targetMAPE = accuracy?.targetMAPE ?? 15;
  const progressValue = Math.max(0, Math.min(100, 100 - mape)); // Invertido: menor MAPE = mayor progreso
  
  const getTrendIcon = () => {
    switch (accuracy?.trend) {
      case 'improving': return <TrendingDown className="h-3 w-3 text-success" />;
      case 'degrading': return <TrendingUp className="h-3 w-3 text-destructive" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };
  
  const getTrendText = () => {
    switch (accuracy?.trend) {
      case 'improving': return 'Mejorando';
      case 'degrading': return 'Degradando';
      default: return 'Estable';
    }
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Precisión del Modelo</span>
          <Badge 
            variant={accuracy?.isOnTarget ? 'default' : 'secondary'}
            className="text-xs"
          >
            MAPE: {mape.toFixed(1)}%
          </Badge>
          {accuracy?.isOnTarget ? (
            <CheckCircle className="h-3 w-3 text-success" />
          ) : (
            <AlertTriangle className="h-3 w-3 text-warning" />
          )}
        </div>
        <div className="flex items-center gap-2">
        {holidays && holidays.totalImpactDays > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {holidays.holidaysInPeriod} feriado{holidays.holidaysInPeriod > 1 ? 's' : ''}
                    {holidays.extendedImpactDays > 0 && (
                      <span className="ml-1 text-warning">+{holidays.extendedImpactDays}</span>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs max-w-xs">
                    {holidays.explanation}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3 space-y-4 px-3 pb-3">
        {/* MAPE Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Precisión actual</span>
            <span>Target: {targetMAPE}% MAPE</span>
          </div>
          <Progress 
            value={progressValue} 
            className="h-2"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              {getTrendIcon()}
              <span className="text-muted-foreground">{getTrendText()}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              sMAPE: {accuracy?.smape?.toFixed(1) ?? mape.toFixed(1)}%
            </span>
          </div>
        </div>
        
        {/* Métricas detalladas */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-background rounded-lg">
            <div className="text-lg font-semibold text-primary">
              {mape.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">MAPE Actual</div>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <div className="text-lg font-semibold text-muted-foreground">
              {accuracy?.historicalMAPE?.toFixed(1) ?? '20.0'}%
            </div>
            <div className="text-xs text-muted-foreground">Promedio 3M</div>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <div className={`text-lg font-semibold ${accuracy?.isOnTarget ? 'text-success' : 'text-warning'}`}>
              {targetMAPE}%
            </div>
            <div className="text-xs text-muted-foreground">Target</div>
          </div>
        </div>
        
        {/* Feriados y días de impacto extendido */}
        {holidays && holidays.totalImpactDays > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Feriados y días de impacto ({holidays.totalImpactDays} días)
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {/* Feriados oficiales */}
              {holidays.holidays.map((holiday, idx) => (
                <div key={`h-${idx}`} className="flex justify-between items-center text-xs p-2 bg-background rounded">
                  <span className="font-medium">{holiday.nombre}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{holiday.fecha}</span>
                    <Badge variant="destructive" className="text-xs">
                      -{holiday.impacto_pct.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
              {/* Días de impacto extendido */}
              {holidays.extendedDays.map((day, idx) => (
                <div key={`e-${idx}`} className="flex justify-between items-center text-xs p-2 bg-muted/50 rounded border-l-2 border-warning">
                  <span className="text-muted-foreground">
                    {day.tipo === 'before' ? '← ' : '→ '}{day.relacionadoCon}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{day.fecha}</span>
                    <Badge variant="secondary" className="text-xs">
                      -{((1 - day.factor_ajuste) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-warning flex items-center gap-1 pt-1 border-t">
              <AlertTriangle className="h-3 w-3" />
              Impacto total: {((1 - holidays.adjustmentFactor) * 100).toFixed(1)}% reducción en proyección
            </div>
          </div>
        )}
        
        {/* Confianza del ensemble */}
        {ensembleConfidence !== undefined && (
          <div className="flex items-center justify-between text-xs pt-2 border-t">
            <span className="text-muted-foreground">Confianza del Ensemble</span>
            <Badge variant={ensembleConfidence > 0.7 ? 'default' : ensembleConfidence > 0.5 ? 'secondary' : 'destructive'}>
              {(ensembleConfidence * 100).toFixed(0)}%
            </Badge>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
