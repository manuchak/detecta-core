import React from 'react';
import { useROIMarketingMonthly } from '@/hooks/useROIMarketingMonthly';

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
  const { monthlyData, currentMonthData, loading } = useROIMarketingMonthly();
  
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

  // Obtener el nombre del mes actual
  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Mostrar los últimos 3 meses para la evolución
  const recentMonths = monthlyData.slice(-3);

  if (loading) {
    return (
      <div className="w-80 p-4 bg-card border border-border rounded-lg shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded"></div>
          <div className="h-3 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

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
      {currentMonthData && (
        <div>
          <h4 className="font-medium text-foreground mb-2">Mes Actual ({currentMonthName})</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-600">Inversión del Mes</span>
              <span className="font-medium">{formatCurrency(currentMonthData.inversion)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Retorno Generado</span>
              <span className="font-medium">{formatCurrency(currentMonthData.retorno)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600 font-medium">ROI del Mes</span>
              <span className="font-bold">{formatPercentage(currentMonthData.roi)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custodios Activos</span>
              <span className="font-medium">{currentMonthData.custodios}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Servicios</span>
              <span className="font-medium">{currentMonthData.servicios}</span>
            </div>
          </div>
        </div>
      )}

      {/* Evolución Mensual */}
      {recentMonths.length > 0 && (
        <div>
          <h4 className="font-medium text-foreground mb-2">Evolución Mensual</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
              <span>Mes</span>
              <div className="flex items-center gap-4">
                <span className="w-16 text-center">Inversión</span>
                <span className="w-16 text-center">Retorno</span>
                <span className="w-12 text-center">ROI</span>
              </div>
            </div>
            {recentMonths.map((mes, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-muted-foreground capitalize truncate w-20">{mes.mes.split(' ')[0]}</span>
                <div className="flex items-center gap-4">
                  <span className="text-blue-600 text-xs w-16 text-center">
                    {formatCurrency(mes.inversion).replace(/\s/g, '')}
                  </span>
                  <span className="text-green-600 text-xs w-16 text-center">
                    {formatCurrency(mes.retorno).replace(/\s/g, '')}
                  </span>
                  <span className="font-medium w-12 text-right text-xs">
                    {formatPercentage(mes.roi)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};