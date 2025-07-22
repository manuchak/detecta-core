import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { useCohortAnalytics } from "@/hooks/useCohortAnalytics";

export const ProductivityChart = () => {
  const { productivityStats, isLoading } = useCohortAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productividad Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!productivityStats.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productividad Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">No hay datos disponibles</div>
        </CardContent>
      </Card>
    );
  }

  const chartData = productivityStats
    .slice()
    .reverse() // Mostrar cronológicamente
    .map(item => ({
      mes: item.month_year,
      custodios: item.active_custodians,
      servicios: item.avg_services_per_custodian,
      ingresos: item.avg_income_per_custodian / 1000, // En miles para mejor visualización
      serviciosTotales: item.total_services,
      ingresosTotales: item.total_income
    }));

  // Calcular promedios
  const avgServicios = chartData.reduce((acc, item) => acc + item.servicios, 0) / chartData.length;
  const avgIngresos = chartData.reduce((acc, item) => acc + item.ingresos, 0) / chartData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productividad Mensual Promedio</CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Servicios: {avgServicios.toFixed(1)}/custodio</span>
          <span>Ingresos: ${(avgIngresos * 1000).toLocaleString()}/custodio</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="mes" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                stroke="hsl(var(--foreground))"
                fontSize={12}
                label={{ value: 'Servicios', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--foreground))"
                fontSize={12}
                label={{ value: 'Ingresos (Miles)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--popover-foreground))'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'servicios') return [`${value} servicios`, 'Servicios Promedio'];
                  if (name === 'ingresos') return [`$${(value * 1000).toLocaleString()}`, 'Ingresos Promedio'];
                  if (name === 'custodios') return [value, 'Custodios Activos'];
                  return [value, name];
                }}
                labelFormatter={(label) => `Mes: ${label}`}
              />
              
              {/* Custodios activos como barras */}
              <Bar 
                yAxisId="left"
                dataKey="custodios" 
                fill="hsl(var(--muted))"
                opacity={0.6}
                name="custodios"
              />
              
              {/* Servicios promedio */}
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="servicios" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                name="servicios"
              />
              
              {/* Ingresos promedio */}
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="ingresos" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                name="ingresos"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Stats summary */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {avgServicios.toFixed(1)}
            </div>
            <div className="text-muted-foreground">Servicios/Custodio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              ${(avgIngresos * 1000).toLocaleString()}
            </div>
            <div className="text-muted-foreground">Ingresos/Custodio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {Math.round(chartData.reduce((acc, item) => acc + item.custodios, 0) / chartData.length)}
            </div>
            <div className="text-muted-foreground">Custodios Promedio</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};