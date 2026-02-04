import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { Gauge, Info, CheckCircle2 } from 'lucide-react';
import { CollectionEfficiency, formatCurrency } from '../../hooks/useFinancialReports';

interface CollectionEfficiencyChartProps {
  data: CollectionEfficiency[];
  promedioEficiencia: number;
  isLoading?: boolean;
}

export function CollectionEfficiencyChart({ data, promedioEficiencia, isLoading }: CollectionEfficiencyChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">Eficiencia de Cobranza</CardTitle>
        </CardHeader>
        <CardContent className="h-48 animate-pulse bg-muted/50 rounded" />
      </Card>
    );
  }

  const getEfficiencyColor = (value: number) => {
    if (value >= 90) return 'hsl(var(--chart-2))'; // emerald
    if (value >= 70) return 'hsl(var(--chart-3))'; // amber  
    return 'hsl(var(--destructive))'; // red
  };

  const getEfficiencyLabel = (value: number) => {
    if (value >= 90) return { text: 'Óptima', color: 'text-emerald-600 dark:text-emerald-400' };
    if (value >= 70) return { text: 'Aceptable', color: 'text-amber-600 dark:text-amber-400' };
    return { text: 'Mejorable', color: 'text-red-600 dark:text-red-400' };
  };

  const currentMonth = data[data.length - 1];
  const efficiencyStatus = getEfficiencyLabel(promedioEficiencia);

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Eficiencia de Cobranza</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Eficiencia = (Cobrado / Facturado) × 100.
                    Mide qué porcentaje de lo facturado se cobra en el mismo período.
                    <br /><br />
                    • Óptima: ≥90% | Aceptable: 70-90% | Mejorable: &lt;70%
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Badge 
            variant="outline" 
            className={`${efficiencyStatus.color} bg-opacity-10 border-0`}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {efficiencyStatus.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <div className="text-xl font-bold">{promedioEficiencia}%</div>
            <div className="text-xs text-muted-foreground">Promedio</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{formatCurrency(currentMonth?.facturado || 0)}</div>
            <div className="text-xs text-muted-foreground">Facturado (últ.)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-emerald-600">
              {formatCurrency(currentMonth?.cobrado || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Cobrado (últ.)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{currentMonth?.diasPromedioCobro || 0}d</div>
            <div className="text-xs text-muted-foreground">Días prom.</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="mesLabel" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `${value}%`}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string, props: any) => {
                  const item = props.payload;
                  return [
                    <div key="tooltip" className="space-y-1">
                      <div><strong>Eficiencia: {value}%</strong></div>
                      <div>Facturado: {formatCurrency(item.facturado)}</div>
                      <div>Cobrado: {formatCurrency(item.cobrado)}</div>
                      <div>Días prom: {item.diasPromedioCobro}d</div>
                    </div>,
                    ''
                  ];
                }}
                labelFormatter={(label) => `Mes: ${label}`}
              />
              <Bar 
                dataKey="eficiencia" 
                radius={[4, 4, 0, 0]}
                name="Eficiencia"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getEfficiencyColor(entry.eficiencia)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
