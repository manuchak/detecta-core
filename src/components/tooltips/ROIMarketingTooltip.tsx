import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Target, Users, Calculator } from 'lucide-react';
import { ROIMarketingMetrics } from '@/hooks/useROIMarketingDetails';

interface ROIMarketingTooltipProps {
  data: ROIMarketingMetrics;
}

export const ROIMarketingTooltip: React.FC<ROIMarketingTooltipProps> = ({ data }) => {
  const {
    roiTotal,
    detallesPorCanal,
    totalGastos,
    totalIngresos,
    totalCandidatos,
    totalCustodiosActivos,
    cpaPromedio,
    lastUpdated
  } = data;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getBestChannel = () => {
    return detallesPorCanal.length > 0
      ? detallesPorCanal.reduce((best, channel) => 
          channel.roiPorcentaje > best.roiPorcentaje ? channel : best
        )
      : null;
  };

  const getWorstChannel = () => {
    return detallesPorCanal.length > 0
      ? detallesPorCanal.reduce((worst, channel) => 
          channel.roiPorcentaje < worst.roiPorcentaje ? channel : worst
        )
      : null;
  };

  const bestChannel = getBestChannel();
  const worstChannel = getWorstChannel();
  const conversionRate = totalCandidatos > 0 ? (totalCustodiosActivos / totalCandidatos) * 100 : 0;

  return (
    <div className="w-[400px] max-h-[500px] overflow-y-auto space-y-4">
      {/* Header con ROI total */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            ROI Marketing - Últimos 90 días
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">ROI Total</span>
            <div className="flex items-center gap-1">
              {roiTotal >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`font-bold ${roiTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(roiTotal)}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Por cada peso invertido, se generan {formatCurrency(1 + roiTotal/100)}
          </div>
        </CardContent>
      </Card>

      {/* Métricas globales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Inversión Total</div>
              <div className="font-semibold">{formatCurrency(totalGastos)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Ingresos Generados</div>
              <div className="font-semibold text-green-600">{formatCurrency(totalIngresos)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">CPA Promedio</div>
              <div className="font-semibold">{formatCurrency(cpaPromedio)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Tasa Conversión</div>
              <div className="font-semibold">{conversionRate.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actividad por canal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Actividad por Canal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Total Candidatos</div>
              <div className="font-semibold">{totalCandidatos}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Custodios Activos</div>
              <div className="font-semibold">{totalCustodiosActivos}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mejores y peores canales */}
      {bestChannel && worstChannel && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Rendimiento por Canal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-600">Mejor: {bestChannel.canal}</span>
                <span className="text-sm font-bold text-green-600">
                  {formatPercentage(bestChannel.roiPorcentaje)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {bestChannel.custodiosActivos} custodios activos • {formatCurrency(bestChannel.gastoTotal)} invertido
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-600">Menor: {worstChannel.canal}</span>
                <span className="text-sm font-bold text-red-600">
                  {formatPercentage(worstChannel.roiPorcentaje)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {worstChannel.custodiosActivos} custodios activos • {formatCurrency(worstChannel.gastoTotal)} invertido
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desglose completo por canal */}
      {detallesPorCanal.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Desglose por Canal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detallesPorCanal.map((canal, index) => (
              <div key={index} className="border-l-2 pl-3 border-muted">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{canal.canal}</span>
                  <span className={`text-sm font-bold ${canal.roiPorcentaje >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(canal.roiPorcentaje)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Inversión: {formatCurrency(canal.gastoTotal)}</div>
                  <div>Ingresos: {formatCurrency(canal.ingresosGenerados)}</div>
                  <div>{canal.candidatosGenerados} candidatos → {canal.custodiosActivos} activos</div>
                  {canal.cpaReal > 0 && <div>CPA: {formatCurrency(canal.cpaReal)}</div>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Footer con última actualización */}
      <div className="text-xs text-muted-foreground text-center py-2">
        Última actualización: {lastUpdated.toLocaleString('es-MX')}
      </div>
    </div>
  );
};