import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MonthlyEconomics } from '../../../hooks/useProfileEconomics';

interface MonthlyBreakdownTableProps {
  data: MonthlyEconomics[];
}

export function MonthlyBreakdownTable({ data }: MonthlyBreakdownTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-MX').format(Math.round(value));
  };

  // Calcular tendencia comparando con mes anterior
  const getTrend = (index: number) => {
    if (index === 0) return 'neutral';
    const current = data[index].ingresos;
    const previous = data[index - 1].ingresos;
    if (current > previous * 1.1) return 'up';
    if (current < previous * 0.9) return 'down';
    return 'neutral';
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Ordenar de más reciente a más antiguo para la tabla
  const sortedData = [...data].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-primary" />
          Rendimiento Mensual Detallado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mes</TableHead>
              <TableHead className="text-right">Servicios</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Km</TableHead>
              <TableHead className="text-right">$/Km</TableHead>
              <TableHead className="text-right">$/Servicio</TableHead>
              <TableHead className="text-center">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((month, index) => {
              const originalIndex = data.length - 1 - index;
              const trend = getTrend(originalIndex);
              const isCurrentMonth = index === 0;
              
              return (
                <TableRow key={month.mes} className={isCurrentMonth ? 'bg-primary/5' : ''}>
                  <TableCell className="font-medium">
                    {month.mesLabel}
                    {isCurrentMonth && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Actual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{month.servicios}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(month.ingresos)}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(month.km)}</TableCell>
                  <TableCell className="text-right">
                    {month.ingresoPorKm > 0 ? `$${month.ingresoPorKm.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {month.ingresoPorServicio > 0 ? formatCurrency(month.ingresoPorServicio) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <TrendIcon trend={trend} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Resumen */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total 6 meses</p>
            <p className="font-bold">
              {formatCurrency(data.reduce((sum, m) => sum + m.ingresos, 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Promedio mensual</p>
            <p className="font-bold">
              {formatCurrency(data.reduce((sum, m) => sum + m.ingresos, 0) / 6)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total servicios</p>
            <p className="font-bold">
              {data.reduce((sum, m) => sum + m.servicios, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
