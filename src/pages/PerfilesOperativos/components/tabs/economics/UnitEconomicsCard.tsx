import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CustodioEconomics } from '../../../hooks/useProfileEconomics';
import { PoolBenchmarks } from '../../../hooks/usePoolBenchmarks';

interface UnitEconomicsCardProps {
  economics: CustodioEconomics;
  benchmarks?: PoolBenchmarks;
}

export function UnitEconomicsCard({ economics, benchmarks }: UnitEconomicsCardProps) {
  const formatCurrency = (value: number, decimals = 2) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const getComparisonIcon = (value: number, poolValue: number) => {
    if (!poolValue) return null;
    const diff = ((value - poolValue) / poolValue) * 100;
    if (diff > 5) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
    if (diff < -5) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getProgressValue = (value: number, poolValue: number, topValue: number) => {
    if (!topValue) return 50;
    return Math.min(100, (value / topValue) * 100);
  };

  const metrics = [
    {
      label: 'Ingreso por Kilómetro',
      value: economics.ingresoPorKm,
      poolValue: benchmarks?.promedioIngresoPorKm || 0,
      topValue: benchmarks?.topIngresoPorKm || economics.ingresoPorKm * 1.5,
      format: (v: number) => formatCurrency(v) + '/km',
      description: 'Eficiencia de monetización por distancia'
    },
    {
      label: 'Ingreso por Hora',
      value: economics.ingresoPorHora,
      poolValue: 0, // No tenemos este benchmark aún
      topValue: economics.ingresoPorHora * 1.5,
      format: (v: number) => formatCurrency(v, 0) + '/hr',
      description: 'Rendimiento por tiempo trabajado'
    },
    {
      label: 'Ingreso por Servicio',
      value: economics.ingresoPorServicio,
      poolValue: benchmarks?.promedioIngresoPorServicio || 0,
      topValue: economics.ingresoPorServicio * 1.5,
      format: (v: number) => formatCurrency(v, 0),
      description: 'Valor promedio por servicio completado'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="h-5 w-5 text-primary" />
          Unit Economics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{metric.label}</span>
                {metric.poolValue > 0 && getComparisonIcon(metric.value, metric.poolValue)}
              </div>
              <span className="text-lg font-bold">{metric.format(metric.value)}</span>
            </div>
            
            <Progress 
              value={getProgressValue(metric.value, metric.poolValue, metric.topValue)} 
              className="h-2"
            />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{metric.description}</span>
              {metric.poolValue > 0 && (
                <Badge variant="outline" className="text-xs">
                  Pool: {metric.format(metric.poolValue)}
                </Badge>
              )}
            </div>
          </div>
        ))}

        {/* Horas totales trabajadas */}
        {economics.horasTotales > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Horas registradas</span>
              <span className="font-medium">{Math.round(economics.horasTotales)} hrs</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
