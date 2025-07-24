import React from 'react';
import { EngagementDetails } from '@/hooks/useEngagementDetails';
import { Activity } from 'lucide-react';

interface EngagementTooltipProps {
  data: EngagementDetails;
}

export function EngagementTooltip({ data }: EngagementTooltipProps) {
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('es-MX').format(Math.round(value));
  };

  const formatEngagement = (value: number): string => {
    return `${value.toFixed(1)} servicios/mes`;
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Activity className="h-4 w-4 text-primary" />
        <div>
          <div className="font-semibold text-foreground">Engagement</div>
          <div className="text-xs text-muted-foreground">Servicios promedio por custodio al mes</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-muted-foreground font-medium">FÓRMULA</div>
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded text-center">
          Total Servicios ÷ Total Custodios Activos
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-muted-foreground font-medium mb-2">DATOS DEL PERÍODO (2025)</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Total Servicios</div>
              <div className="font-medium text-foreground">{formatNumber(data.yearlyData.totalServices)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Custodios Activos</div>
              <div className="font-medium text-foreground">{formatNumber(data.yearlyData.totalActiveCustodians)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-muted-foreground">Engagement Promedio</div>
              <div className="font-medium text-primary">{formatEngagement(data.yearlyData.avgServicesPerCustodian)}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground font-medium mb-2">MES ACTUAL ({data.currentMonthData.month.toUpperCase()})</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Servicios</div>
              <div className="font-medium text-foreground">{formatNumber(data.currentMonthData.services)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Custodios</div>
              <div className="font-medium text-foreground">{formatNumber(data.currentMonthData.custodians)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-muted-foreground">Engagement Mensual</div>
              <div className="font-medium text-primary">{formatEngagement(data.currentMonthData.engagement)}</div>
            </div>
          </div>
        </div>

        {data.yearlyData.monthlyEvolution.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-2">EVOLUCIÓN MENSUAL</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {data.yearlyData.monthlyEvolution.slice(-6).map((month) => (
                <div key={month.month} className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    {month.month.split('-')[1]}/25
                  </span>
                  <div className="text-right">
                    <div className="text-foreground">{formatNumber(month.services)} servicios</div>
                    <div className="text-muted-foreground">{formatNumber(month.custodians)} custodios</div>
                    <div className="font-medium text-primary">{formatEngagement(month.engagement)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}