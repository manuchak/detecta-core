import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useServiceDistribution } from '@/hooks/useServiceDistribution';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, MapPin } from 'lucide-react';

export const ServiceDistributionChart = () => {
  const { distribution, total, loading } = useServiceDistribution();

  const colors = [
    'hsl(var(--primary))',
    'hsl(217, 91%, 60%)',
    'hsl(262, 83%, 58%)',
    'hsl(142, 76%, 36%)',
  ];

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Distribución de Viajes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const pieData = distribution.map(d => ({
    name: d.tipo,
    value: d.cantidad,
    porcentaje: d.porcentaje,
    gmv: d.gmv,
    variacion: d.variacion
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Distribución de Viajes
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {total} servicios
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-foreground">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.value} servicios ({data.porcentaje.toFixed(1)}%)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          GMV: {formatCurrency(data.gmv)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend with variations */}
        <div className="space-y-2 mt-2">
          {distribution.map((d, idx) => (
            <div key={d.tipo} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="text-foreground">{d.tipo}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{d.porcentaje.toFixed(1)}%</span>
                <span className={`flex items-center text-xs ${d.variacion >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {d.variacion >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {d.variacion >= 0 ? '+' : ''}{d.variacion.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
