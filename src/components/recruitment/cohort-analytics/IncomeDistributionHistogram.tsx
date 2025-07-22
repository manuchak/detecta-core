import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useCohortAnalytics } from "@/hooks/useCohortAnalytics";

const LEVEL_COLORS = {
  1: 'hsl(var(--destructive))',      // Rojo - Crítico
  2: 'hsl(var(--warning))',          // Naranja - Bajo
  3: 'hsl(var(--warning))',          // Amarillo - Medio
  4: 'hsl(var(--success))',          // Verde claro - Bueno
  5: 'hsl(var(--success))'           // Verde oscuro - Excelente
};

const LEVEL_LABELS = {
  1: '$0 - $9,999',
  2: '$10,000 - $14,999',
  3: '$15,000 - $19,999',
  4: '$20,000 - $29,999',
  5: '$30,000+'
};

export const IncomeDistributionHistogram = () => {
  const { incomeDistribution, isLoading } = useCohortAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Ingresos Mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = incomeDistribution.map((item, index) => ({
    nivel: item.income_level,
    rango: item.income_range,
    custodios: item.custodian_count,
    porcentaje: item.percentage,
    servicios: item.avg_services,
    ingresos: item.avg_income,
    color: index === 0 ? 'hsl(var(--success))' : 
           index === 1 ? 'hsl(var(--warning))' : 
           index === 2 ? 'hsl(var(--warning))' : 
           index === 3 ? 'hsl(var(--success))' : 'hsl(var(--success))'
  }));

  const targetAchieved = incomeDistribution.find(item => item.income_level === 'Alto')?.percentage || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Distribución de Ingresos Mensuales</span>
          <div className="text-sm font-normal text-muted-foreground">
            Target 30K+: <span className="text-success font-semibold">{targetAchieved.toFixed(1)}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="nivel" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
                label={{ value: 'Custodios (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--popover-foreground))'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'porcentaje') return [`${value}%`, 'Porcentaje'];
                  if (name === 'custodios') return [value, 'Custodios'];
                  if (name === 'servicios') return [value, 'Servicios Promedio'];
                  if (name === 'ingresos') return [`$${value.toLocaleString()}`, 'Ingresos Promedio'];
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.nivel === label);
                  return `${label}: ${item?.rango}`;
                }}
              />
              <Bar dataKey="porcentaje" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
          {chartData.map((item) => (
            <div key={item.nivel} className="text-center">
              <div 
                className="w-4 h-4 rounded mx-auto mb-1"
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="font-medium">{item.porcentaje}%</div>
              <div className="text-muted-foreground">{item.custodios} custodios</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};