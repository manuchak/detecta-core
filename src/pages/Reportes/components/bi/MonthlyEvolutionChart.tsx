import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, ReferenceLine, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface MonthlyEvolutionData {
  mes: string;
  servicios: number;
  horasTotales: number;
  aprovechamiento: number;
  revenueLoss: number;
  cusaem: number;
  seicsa: number;
}

interface MonthlyEvolutionChartProps {
  data: MonthlyEvolutionData[];
  targetAprovechamiento?: number;
}

const chartConfig = {
  cusaem: {
    label: 'Cusaem',
    color: 'hsl(var(--chart-1))'
  },
  seicsa: {
    label: 'SEICSA',
    color: 'hsl(var(--chart-2))'
  },
  aprovechamiento: {
    label: 'Aprovechamiento %',
    color: 'hsl(var(--chart-3))'
  },
  revenueLoss: {
    label: 'Revenue Leakage',
    color: 'hsl(var(--destructive))'
  }
};

export function MonthlyEvolutionChart({ data, targetAprovechamiento = 50 }: MonthlyEvolutionChartProps) {
  return (
    <Card className="bg-background/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-corporate-blue" />
          <CardTitle className="text-lg">Evolución Mensual</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Servicios por proveedor y tendencia de aprovechamiento
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="mes" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Servicios', angle: -90, position: 'insideLeft', fontSize: 11 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Aprovechamiento %', angle: 90, position: 'insideRight', fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            
            {/* Stacked bars for services by provider */}
            <Bar 
              yAxisId="left"
              dataKey="cusaem" 
              stackId="a" 
              fill="hsl(var(--chart-1))" 
              name="Cusaem"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              yAxisId="left"
              dataKey="seicsa" 
              stackId="a" 
              fill="hsl(var(--chart-2))" 
              name="SEICSA"
              radius={[4, 4, 0, 0]}
            />
            
            {/* Revenue leakage area (subtle background) */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenueLoss"
              fill="hsl(var(--destructive) / 0.1)"
              stroke="none"
              name="Revenue Leakage ($)"
            />
            
            {/* Utilization line */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="aprovechamiento" 
              stroke="hsl(var(--chart-3))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Aprovechamiento %"
            />
            
            {/* Target line */}
            <ReferenceLine 
              yAxisId="right"
              y={targetAprovechamiento} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="5 5"
              label={{ 
                value: `Meta ${targetAprovechamiento}%`, 
                position: 'right',
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))'
              }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
