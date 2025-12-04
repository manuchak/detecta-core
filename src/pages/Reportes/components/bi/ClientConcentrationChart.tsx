import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Treemap, ResponsiveContainer } from 'recharts';
import { Users, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ClientData {
  cliente: string;
  servicios: number;
  horas: number;
  porcentaje: number;
}

interface ClientConcentrationChartProps {
  clients: ClientData[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted))'
];

const chartConfig = {
  servicios: {
    label: 'Servicios',
    color: 'hsl(var(--chart-1))'
  }
};

export function ClientConcentrationChart({ clients }: ClientConcentrationChartProps) {
  const topClient = clients[0];
  const isHighConcentration = topClient && topClient.porcentaje > 50;
  const hhi = clients.reduce((sum, c) => sum + Math.pow(c.porcentaje, 2), 0);
  const isMonopolistic = hhi > 2500;

  // Prepare treemap data
  const treemapData = clients.map((client, index) => ({
    name: client.cliente.length > 20 ? client.cliente.substring(0, 20) + '...' : client.cliente,
    fullName: client.cliente,
    size: client.servicios,
    horas: client.horas,
    porcentaje: client.porcentaje,
    fill: COLORS[index % COLORS.length]
  }));

  const CustomContent = (props: any) => {
    const { x, y, width, height, name, porcentaje, fill } = props;
    
    if (width < 50 || height < 30) return null;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke="hsl(var(--background))"
          strokeWidth={2}
          rx={4}
          style={{ opacity: 0.85 }}
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 8}
          textAnchor="middle"
          fill="white"
          fontSize={width > 100 ? 12 : 10}
          fontWeight="bold"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="white"
          fontSize={10}
          opacity={0.9}
        >
          {porcentaje?.toFixed(1)}%
        </text>
      </g>
    );
  };

  return (
    <Card className="bg-background/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-corporate-blue" />
            <CardTitle className="text-lg">Concentración de Clientes</CardTitle>
          </div>
          {isHighConcentration && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Alta concentración
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Distribución de servicios por cliente (Top 10)
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="hsl(var(--background))"
            content={<CustomContent />}
          >
            <ChartTooltip 
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-popover p-2 rounded-lg border shadow-lg">
                    <p className="font-medium">{data.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.size} servicios ({data.porcentaje?.toFixed(1)}%)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.horas?.toFixed(1)} horas
                    </p>
                  </div>
                );
              }}
            />
          </Treemap>
        </ChartContainer>

        {/* Risk indicators */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Índice HHI</span>
            <span className={cn(
              "text-sm font-medium",
              isMonopolistic ? "text-red-600" : hhi > 1500 ? "text-amber-600" : "text-emerald-600"
            )}>
              {hhi.toFixed(0)} {isMonopolistic ? '(Monopolístico)' : hhi > 1500 ? '(Concentrado)' : '(Diversificado)'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Top cliente</span>
            <span className="text-sm font-medium">
              {topClient?.cliente.substring(0, 25)} ({topClient?.porcentaje.toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Clientes activos</span>
            <span className="text-sm font-medium">{clients.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
