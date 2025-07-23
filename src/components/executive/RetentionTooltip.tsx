import React from 'react';
import { RetentionDetailsData } from '@/hooks/useRetentionDetails';

interface RetentionTooltipProps {
  data: RetentionDetailsData;
}

export function RetentionTooltip({ data }: RetentionTooltipProps) {
  const { yearlyData, currentMonthData, monthlyBreakdown } = data;

  return (
    <div className="w-80 space-y-3">
      {/* Header */}
      <div className="pb-2 border-b border-border">
        <h4 className="font-semibold text-sm mb-1">Tasa de Retención</h4>
        <p className="text-xs text-muted-foreground">
          Custodios activos mes anterior que repiten en mes actual
        </p>
      </div>

      {/* Métricas anuales */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Retención promedio anual:</span>
          <span className="font-medium text-sm">{yearlyData.retentionPromedio.toFixed(1)}%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Custodios retenidos (total):</span>
          <span className="font-medium text-sm">{yearlyData.totalCustodiosRetenidos.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Meses con datos:</span>
          <span className="font-medium text-sm">{yearlyData.mesesConDatos}</span>
        </div>
      </div>

      {/* Datos del mes actual */}
      <div className="pt-2 border-t border-border">
        <h5 className="font-medium text-sm mb-2">Mes Actual</h5>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Custodios mes anterior:</span>
            <span className="text-xs font-medium">{currentMonthData.custodiosAnterior}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Custodios retenidos:</span>
            <span className="text-xs font-medium text-green-600">{currentMonthData.custodiosRetenidos}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Custodios nuevos:</span>
            <span className="text-xs font-medium text-blue-600">{currentMonthData.custodiosNuevos}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Custodios perdidos:</span>
            <span className="text-xs font-medium text-red-600">{currentMonthData.custodiosPerdidos}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border/50">
            <span className="text-xs font-medium">Tasa de retención:</span>
            <span className="text-xs font-semibold">{currentMonthData.tasaRetencion.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Evolución mensual */}
      <div className="pt-2 border-t border-border">
        <h5 className="font-medium text-sm mb-2">Evolución Mensual</h5>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {monthlyBreakdown.slice(-6).reverse().map((month, index) => (
            <div key={month.month} className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {month.monthName}:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs">{month.custodiosRetenidos}/{month.custodiosAnterior}</span>
                <span 
                  className={`text-xs font-medium ${
                    month.tasaRetencion >= 90 ? 'text-green-600' :
                    month.tasaRetencion >= 80 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}
                >
                  {month.tasaRetencion.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fórmula */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Fórmula:</strong> (Custodios retenidos / Custodios mes anterior) × 100
        </p>
      </div>
    </div>
  );
}