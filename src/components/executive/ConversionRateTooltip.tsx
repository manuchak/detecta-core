import React from 'react';
import { ConversionRateDetails } from '@/hooks/useConversionRateDetails';

interface ConversionRateTooltipProps {
  data: ConversionRateDetails;
}

export const ConversionRateTooltip: React.FC<ConversionRateTooltipProps> = ({ data }) => {
  if (data.loading) {
    return (
      <div className="p-4 max-w-sm">
        <div className="text-sm text-muted-foreground">Cargando datos...</div>
      </div>
    );
  }

  const { yearlyData, currentMonthData, periodLabel } = data;

  return (
    <div className="p-4 max-w-md space-y-4">
      {/* Fórmula */}
      <div className="pb-2 border-b border-border">
        <h4 className="font-semibold text-sm mb-1">Tasa de Conversión</h4>
        <p className="text-xs text-muted-foreground">
          Custodios con primer servicio ÷ Leads ingresados × 100
        </p>
      </div>

      {/* Datos anuales */}
      <div>
        <h5 className="font-medium text-sm mb-2">Datos del Período ({periodLabel})</h5>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-blue-600">Total Leads</span>
            <span className="font-medium">{yearlyData.totalLeads}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Custodios con 1er Servicio</span>
            <span className="font-medium">{yearlyData.totalNewCustodians}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border">
            <span className="text-primary font-medium">Conversión General</span>
            <span className="font-semibold">{yearlyData.overallConversionRate.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Datos del mes actual */}
      <div>
        <h5 className="font-medium text-sm mb-2">Mes Actual ({currentMonthData.month})</h5>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-blue-600">Leads del Mes</span>
            <span className="font-medium">{currentMonthData.leads}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Custodios Nuevos</span>
            <span className="font-medium">{currentMonthData.newCustodians}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border">
            <span className="text-primary font-medium">Conversión del Mes</span>
            <span className="font-semibold">{currentMonthData.conversionRate.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Evolución mensual */}
      <div>
        <h5 className="font-medium text-sm mb-2">Evolución Mensual</h5>
        <div className="space-y-1 text-xs">
          {yearlyData.monthlyBreakdown.map((month) => (
            <div key={month.month} className="flex justify-between">
              <span className="text-muted-foreground">{month.month}</span>
              <div className="flex gap-2">
                <span className="text-blue-600">{month.leads}L</span>
                <span className="text-green-600">{month.newCustodians}C</span>
                <span className="font-medium">{month.conversionRate.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};