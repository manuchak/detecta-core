import React from 'react';
import { CPADetails } from '@/hooks/useCPADetails';
import { useFormatters } from '@/hooks/useFormatters';
import { TrendingUp, TrendingDown, Calculator, Calendar, Users } from 'lucide-react';

interface CPATooltipProps {
  cpaDetails: CPADetails;
}

export function CPATooltip({ cpaDetails }: CPATooltipProps) {
  const { formatCurrency } = useFormatters();
  
  const { yearlyBreakdown, currentMonthData } = cpaDetails;

  return (
    <div className="space-y-4 p-2">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Calculator className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Detalle Costo de Adquisición</h3>
      </div>

      {/* Fórmula */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">FÓRMULA</p>
        <p className="text-xs">CPA = Costos Totales ÷ Custodios Nuevos</p>
      </div>

      {/* Datos Anuales 2025 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <h4 className="font-medium text-sm">Acumulado 2025</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Costos Totales</p>
            <p className="font-semibold">{formatCurrency(yearlyBreakdown.totalCosts)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Custodios Nuevos</p>
            <p className="font-semibold">{yearlyBreakdown.totalNewCustodians}</p>
          </div>
        </div>

        {/* Desglose de costos anuales */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">DESGLOSE ANUAL</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-orange-600">Personal (STAFF)</span>
              <span className="font-medium">{formatCurrency(yearlyBreakdown.costBreakdown.staff)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Tecnología (GPS+Platform)</span>
              <span className="font-medium">{formatCurrency(yearlyBreakdown.costBreakdown.technology)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Reclutamiento (Eval+Tox)</span>
              <span className="font-medium">{formatCurrency(yearlyBreakdown.costBreakdown.recruitment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-600">Marketing (Facebook)</span>
              <span className="font-medium">{formatCurrency(yearlyBreakdown.costBreakdown.marketing)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Datos del mes actual */}
      <div className="border-t border-border pt-3 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-green-500" />
          <h4 className="font-medium text-sm">Mes Actual ({currentMonthData.month})</h4>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Costos del Mes</p>
            <p className="font-semibold">{formatCurrency(currentMonthData.costs)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Custodios Nuevos</p>
            <p className="font-semibold">{currentMonthData.newCustodians}</p>
          </div>
        </div>

        <div className="bg-primary/10 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">CPA del Mes</span>
            <span className="font-bold text-sm">
              {currentMonthData.newCustodians > 0 
                ? formatCurrency(currentMonthData.cpa)
                : 'No hay datos'
              }
            </span>
          </div>
        </div>

        {/* Desglose costos mes actual */}
        {currentMonthData.costs > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">DESGLOSE {currentMonthData.month.toUpperCase()}</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-orange-600">Personal</span>
                <span>{formatCurrency(currentMonthData.costBreakdown.staff)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Tecnología</span>
                <span>{formatCurrency(currentMonthData.costBreakdown.technology)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Reclutamiento</span>
                <span>{formatCurrency(currentMonthData.costBreakdown.recruitment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-600">Marketing</span>
                <span>{formatCurrency(currentMonthData.costBreakdown.marketing)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Evolución mensual últimos 3 meses */}
      {yearlyBreakdown.monthlyData.length > 0 && (
        <div className="border-t border-border pt-3 space-y-2">
          <h4 className="font-medium text-xs text-muted-foreground">EVOLUCIÓN RECIENTE</h4>
          <div className="space-y-1">
            {yearlyBreakdown.monthlyData.slice(-3).map((monthData, index) => {
              const isCurrentMonth = monthData.month === new Date().toISOString().substring(0, 7);
              const monthName = new Date(monthData.month + '-01').toLocaleDateString('es-MX', { month: 'short' });
              
              return (
                <div 
                  key={monthData.month}
                  className={`flex justify-between items-center text-xs p-1 rounded ${
                    isCurrentMonth ? 'bg-primary/10' : ''
                  }`}
                >
                  <span className="capitalize">{monthName}</span>
                  <div className="flex items-center gap-2">
                    <span>{monthData.newCustodians} custodios</span>
                    <span className="font-medium">
                      {monthData.newCustodians > 0 ? formatCurrency(monthData.cpa) : '-'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}