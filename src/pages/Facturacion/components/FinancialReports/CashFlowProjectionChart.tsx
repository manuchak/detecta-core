import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Landmark, Info, CalendarDays } from 'lucide-react';
import { CashFlowProjection, formatCurrency } from '../../hooks/useFinancialReports';

interface CashFlowProjectionChartProps {
  data: CashFlowProjection[];
  totalProyectado: number;
  isLoading?: boolean;
}

export function CashFlowProjectionChart({ data, totalProyectado, isLoading }: CashFlowProjectionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">Proyección de Flujo</CardTitle>
        </CardHeader>
        <CardContent className="h-48 animate-pulse bg-muted/50 rounded" />
      </Card>
    );
  }

  // Filter to show only significant dates
  const filteredData = data.filter(d => d.montoEsperado > 0 || data.indexOf(d) === 0);
  const displayData = filteredData.length > 15 ? filteredData.slice(0, 15) : filteredData;

  // Calculate totals
  const total30d = data.reduce((sum, d) => sum + d.montoEsperado, 0);
  const totalPonderado = data.reduce((sum, d) => sum + (d.montoEsperado * d.probabilidad / 100), 0);
  const numFacturas = data.reduce((sum, d) => sum + d.numFacturas, 0);

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Proyección de Flujo (30 días)</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Ingresos esperados basados en fechas de vencimiento de facturas pendientes.
                    La línea muestra el acumulado y las barras el monto por día.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-0">
            <CalendarDays className="h-3 w-3 mr-1" />
            {numFacturas} facturas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold">{formatCurrency(total30d)}</div>
            <div className="text-xs text-muted-foreground">Total Esperado</div>
          </div>
          <div className="text-center border-l border-r border-border">
            <div className="text-lg font-semibold text-emerald-600">{formatCurrency(totalPonderado)}</div>
            <div className="text-xs text-muted-foreground">Prob. Ponderada</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {total30d > 0 ? Math.round((totalPonderado / total30d) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Prob. Promedio</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={displayData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="fechaLabel" 
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                yAxisId="monto"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                yAxisId="acumulado"
                orientation="right"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'montoEsperado') return [formatCurrency(value), 'Por cobrar'];
                  if (name === 'montoAcumulado') return [formatCurrency(value), 'Acumulado'];
                  return [value, name];
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={24}
                formatter={(value) => {
                  if (value === 'montoEsperado') return 'Por cobrar';
                  if (value === 'montoAcumulado') return 'Acumulado';
                  return value;
                }}
              />
              <Bar 
                yAxisId="monto"
                dataKey="montoEsperado" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                opacity={0.7}
              />
              <Line
                yAxisId="acumulado"
                type="monotone"
                dataKey="montoAcumulado"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
