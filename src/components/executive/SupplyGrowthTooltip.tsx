import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, UserPlus, UserMinus } from 'lucide-react';

interface SupplyGrowthDetails {
  monthlyEvolution: Array<{
    month: string;
    monthName: string;
    nuevos: number;
    perdidos: number;
    netGrowth: number;
    growthRate: number;
    activeCustodians: number;
  }>;
  currentMonthData: {
    growthRate: number;
    netGrowth: number;
    nuevos: number;
    perdidos: number;
    activeCustodians: number;
  };
  yearlyData: {
    averageGrowthRate: number;
    totalNewCustodians: number;
    totalLostCustodians: number;
    netGrowthYear: number;
    strongestGrowthMonth: string;
    weakestGrowthMonth: string;
  };
}

interface SupplyGrowthTooltipProps {
  data: SupplyGrowthDetails | null;
}

export function SupplyGrowthTooltip({ data }: SupplyGrowthTooltipProps) {
  if (!data) {
    return (
      <Card className="w-96">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Supply Growth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Datos no disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const { monthlyEvolution, currentMonthData, yearlyData } = data;
  const recentMonths = monthlyEvolution.slice(-6); // Últimos 6 meses

  return (
    <Card className="w-96">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Supply Growth - Análisis Anual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métricas actuales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mes Actual</p>
            <div className="flex items-center gap-1">
              {currentMonthData.growthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className="font-medium text-sm">
                {currentMonthData.growthRate.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Custodios Activos</p>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-primary" />
              <span className="font-medium text-sm">
                {currentMonthData.activeCustodians.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-border/50" />

        {/* Resumen anual */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Resumen Anual
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Promedio Crecimiento</p>
              <span className="font-medium text-sm">
                {yearlyData.averageGrowthRate.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Crecimiento Neto</p>
              <span className="font-medium text-sm">
                {yearlyData.netGrowthYear >= 0 ? '+' : ''}{yearlyData.netGrowthYear}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <UserPlus className="h-3 w-3" />
                Nuevos
              </p>
              <span className="font-medium text-sm text-success">
                +{yearlyData.totalNewCustodians}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <UserMinus className="h-3 w-3" />
                Perdidos
              </p>
              <span className="font-medium text-sm text-destructive">
                -{yearlyData.totalLostCustodians}
              </span>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-border/50" />

        {/* Evolución reciente */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Últimos 6 Meses
          </h4>
          
          <div className="space-y-2">
            {recentMonths.map((month, index) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {month.monthName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {month.growthRate >= 0 ? '+' : ''}{month.growthRate.toFixed(1)}%
                  </span>
                  {month.growthRate >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="border-t border-border/50 pt-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Mejor mes:</span>
              <span className="text-xs font-medium">{yearlyData.strongestGrowthMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Mes más débil:</span>
              <span className="text-xs font-medium">{yearlyData.weakestGrowthMonth}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}