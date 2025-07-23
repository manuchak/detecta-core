import React from 'react';
import { LTVDetails } from '@/hooks/useLTVDetails';

interface LTVTooltipProps {
  data: LTVDetails;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const LTVTooltip: React.FC<LTVTooltipProps> = ({ data }) => {
  if (data.loading) {
    return (
      <div className="p-4 max-w-sm">
        <div className="text-sm text-muted-foreground">Cargando datos...</div>
      </div>
    );
  }

  const { yearlyData, currentMonthData } = data;

  return (
    <div className="p-4 max-w-md space-y-4">
      {/* Fórmula */}
      <div className="pb-2 border-b border-border">
        <h4 className="font-semibold text-sm mb-1">Lifetime Value (LTV)</h4>
        <p className="text-xs text-muted-foreground">
          Ingreso promedio mensual × 12 meses (estimación anual)
        </p>
      </div>

      {/* Datos del período */}
      <div>
        <h5 className="font-medium text-sm mb-2">Datos del Período (Jun-Jul 2025)</h5>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-blue-600">Total Custodios Activos</span>
            <span className="font-medium">{yearlyData.totalCustodios}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Ingresos Totales</span>
            <span className="font-medium">{formatCurrency(yearlyData.ingresosTotales)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-600">Ingreso Promedio por Custodio</span>
            <span className="font-medium">{formatCurrency(yearlyData.ingresoPromedioPorCustodio)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border">
            <span className="text-primary font-medium">LTV General</span>
            <span className="font-semibold">{formatCurrency(yearlyData.ltvGeneral)}</span>
          </div>
        </div>
      </div>

      {/* Datos del mes actual */}
      <div>
        <h5 className="font-medium text-sm mb-2">Mes Actual ({currentMonthData.month})</h5>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-blue-600">Custodios Activos</span>
            <span className="font-medium">{currentMonthData.custodiosActivos}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Ingresos del Mes</span>
            <span className="font-medium">{formatCurrency(currentMonthData.ingresosTotales)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-600">Ingreso Promedio</span>
            <span className="font-medium">{formatCurrency(currentMonthData.ingresoPromedioPorCustodio)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border">
            <span className="text-primary font-medium">LTV del Mes</span>
            <span className="font-semibold">{formatCurrency(currentMonthData.ltvCalculado)}</span>
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
              <div className="flex gap-3">
                <span className="text-blue-600">{month.custodiosActivos}C</span>
                <span className="text-green-600">{formatCurrency(month.ingresoPromedioPorCustodio)}</span>
                <span className="font-medium">{formatCurrency(month.ltvCalculado)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
          <p>C = Custodios, Segundo valor = Ingreso promedio, Tercero = LTV estimado</p>
        </div>
      </div>
    </div>
  );
};