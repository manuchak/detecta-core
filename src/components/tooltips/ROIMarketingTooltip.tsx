import React from 'react';

interface ROIMarketingTooltipProps {
  data: {
    roiTotal: number;
    totalGastos: number;
    totalIngresos: number;
    totalCandidatos: number;
    totalCustodiosActivos: number;
    lastUpdated: Date;
  };
}

export const ROIMarketingTooltip: React.FC<ROIMarketingTooltipProps> = ({ data }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const roiMensual = [
    { mes: 'Junio', inversion: 45000, retorno: 52000, roi: 15.56 },
    { mes: 'Julio', inversion: 38000, retorno: 41000, roi: 7.89 }
  ];

  return (
    <div className="w-80 p-4 bg-card border border-border rounded-lg shadow-lg space-y-4">
      {/* Header */}
      <div className="border-b border-border pb-2">
        <h3 className="font-semibold text-foreground">ROI Marketing</h3>
        <p className="text-sm text-muted-foreground">
          (Ingresos - Inversión) ÷ Inversión × 100
        </p>
      </div>

      {/* Datos del Período */}
      <div>
        <h4 className="font-medium text-foreground mb-2">Datos del Período (Últimos 90 días)</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-600">Total Inversión</span>
            <span className="font-medium">{formatCurrency(data.totalGastos)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Ingresos Generados</span>
            <span className="font-medium">{formatCurrency(data.totalIngresos)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-600 font-medium">ROI General</span>
            <span className="font-bold">{formatPercentage(data.roiTotal)}</span>
          </div>
        </div>
      </div>

      {/* Mes Actual */}
      <div>
        <h4 className="font-medium text-foreground mb-2">Mes Actual (Julio 2025)</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-600">Inversión del Mes</span>
            <span className="font-medium">{formatCurrency(38000)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Retorno Generado</span>
            <span className="font-medium">{formatCurrency(41000)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-600 font-medium">ROI del Mes</span>
            <span className="font-bold">7.89%</span>
          </div>
        </div>
      </div>

      {/* Evolución Mensual */}
      <div>
        <h4 className="font-medium text-foreground mb-2">Evolución Mensual</h4>
        <div className="space-y-1 text-sm">
          {roiMensual.map((mes, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-muted-foreground">{mes.mes}</span>
              <div className="flex items-center gap-4">
                <span className="text-blue-600">{formatCurrency(mes.inversion)}</span>
                <span className="text-green-600">{formatCurrency(mes.retorno)}</span>
                <span className="font-medium w-12 text-right">{formatPercentage(mes.roi)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};