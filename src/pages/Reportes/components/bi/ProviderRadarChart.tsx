import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Target } from 'lucide-react';

interface ProviderMetrics {
  proveedor: string;
  servicios: number;
  horasTotales: number;
  aprovechamiento: number;
  costoEstimado: number;
  clientesUnicos: number;
  horasPromedio: number;
}

interface ProviderRadarChartProps {
  providers: ProviderMetrics[];
}

const chartConfig = {
  cusaem: {
    label: 'Cusaem',
    color: 'hsl(var(--chart-1))'
  },
  seicsa: {
    label: 'SEICSA',
    color: 'hsl(var(--chart-2))'
  }
};

export function ProviderRadarChart({ providers }: ProviderRadarChartProps) {
  const cusaem = providers.find(p => p.proveedor === 'Cusaem');
  const seicsa = providers.find(p => p.proveedor === 'SEICSA');

  if (!cusaem || !seicsa) return null;

  // Normalize values to 0-100 scale for radar
  const maxServicios = Math.max(cusaem.servicios, seicsa.servicios, 1);
  const maxHoras = Math.max(cusaem.horasTotales, seicsa.horasTotales, 1);
  const maxClientes = Math.max(cusaem.clientesUnicos, seicsa.clientesUnicos, 1);

  const radarData = [
    {
      dimension: 'Volumen',
      cusaem: (cusaem.servicios / maxServicios) * 100,
      seicsa: (seicsa.servicios / maxServicios) * 100,
      fullMark: 100
    },
    {
      dimension: 'Aprovechamiento',
      cusaem: cusaem.aprovechamiento,
      seicsa: seicsa.aprovechamiento,
      fullMark: 100
    },
    {
      dimension: 'Horas Promedio',
      cusaem: Math.min((cusaem.horasPromedio / 12) * 100, 100),
      seicsa: Math.min((seicsa.horasPromedio / 12) * 100, 100),
      fullMark: 100
    },
    {
      dimension: 'Diversificación',
      cusaem: (cusaem.clientesUnicos / maxClientes) * 100,
      seicsa: (seicsa.clientesUnicos / maxClientes) * 100,
      fullMark: 100
    },
    {
      dimension: 'Eficiencia Costo',
      cusaem: cusaem.costoEstimado > 0 ? Math.min((cusaem.horasTotales / (cusaem.costoEstimado / 150)) * 100, 100) : 0,
      seicsa: seicsa.costoEstimado > 0 ? Math.min((seicsa.horasTotales / (seicsa.costoEstimado / 150)) * 100, 100) : 0,
      fullMark: 100
    }
  ];

  return (
    <Card className="bg-background/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-corporate-blue" />
          <CardTitle className="text-lg">Comparativa de Proveedores</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Análisis multidimensional normalizado
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid className="stroke-muted" />
            <PolarAngleAxis 
              dataKey="dimension" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
              tickCount={5}
            />
            <Radar
              name="Cusaem"
              dataKey="cusaem"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="SEICSA"
              dataKey="seicsa"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Legend />
            <ChartTooltip content={<ChartTooltipContent />} />
          </RadarChart>
        </ChartContainer>

        {/* Provider summary cards */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-3 rounded-lg bg-chart-1/10 border border-chart-1/20">
            <p className="text-sm font-medium text-chart-1">Cusaem</p>
            <p className="text-xs text-muted-foreground mt-1">
              {cusaem.servicios} servicios • {cusaem.aprovechamiento.toFixed(1)}% aprovech.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-chart-2/10 border border-chart-2/20">
            <p className="text-sm font-medium text-chart-2">SEICSA</p>
            <p className="text-xs text-muted-foreground mt-1">
              {seicsa.servicios} servicios • {seicsa.aprovechamiento.toFixed(1)}% aprovech.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
