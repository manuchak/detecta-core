import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { ArrowUpRight, ArrowDownRight, Minus, Info, GitCompare } from 'lucide-react';
import { PeriodComparison, formatCurrency } from '../../hooks/useFinancialReports';
import { cn } from '@/lib/utils';

interface PeriodComparisonTableProps {
  data: PeriodComparison[];
  isLoading?: boolean;
}

export function PeriodComparisonTable({ data, isLoading }: PeriodComparisonTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">Comparativo Mensual</CardTitle>
        </CardHeader>
        <CardContent className="h-48 animate-pulse bg-muted/50 rounded" />
      </Card>
    );
  }

  const formatValue = (metrica: string, value: number): string => {
    if (metrica.includes('%') || metrica === 'DSO') {
      return metrica.includes('%') ? `${value}%` : `${value} días`;
    }
    return formatCurrency(value);
  };

  const getTrendIcon = (tendencia: 'up' | 'down' | 'neutral') => {
    switch (tendencia) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendBadge = (item: PeriodComparison) => {
    const isPositive = item.tendencia === 'up';
    const isNeutral = item.tendencia === 'neutral';

    if (isNeutral) {
      return (
        <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-0">
          <Minus className="h-3 w-3 mr-1" />
          Sin cambio
        </Badge>
      );
    }

    const colorClass = isPositive 
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : 'bg-red-500/10 text-red-600 dark:text-red-400';

    return (
      <Badge variant="outline" className={`${colorClass} border-0`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
        {item.variacionPct > 0 ? '+' : ''}{item.variacionPct}%
      </Badge>
    );
  };

  // Summary metrics
  const positiveCount = data.filter(d => d.tendencia === 'up').length;
  const negativeCount = data.filter(d => d.tendencia === 'down').length;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Comparativo vs Mes Anterior</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Comparación de métricas clave entre el mes actual y el anterior.
                    Para DSO y Días Promedio, una baja es positiva (verde).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center text-emerald-600">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
              {positiveCount}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="flex items-center text-red-600">
              <ArrowDownRight className="h-3 w-3 mr-0.5" />
              {negativeCount}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs h-8">Métrica</TableHead>
              <TableHead className="text-xs h-8 text-right">Actual</TableHead>
              <TableHead className="text-xs h-8 text-right">Anterior</TableHead>
              <TableHead className="text-xs h-8 text-right">Variación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index} className="hover:bg-muted/30">
                <TableCell className="py-2 font-medium text-sm">{item.metrica}</TableCell>
                <TableCell className="py-2 text-right text-sm">
                  {formatValue(item.metrica, item.actual)}
                </TableCell>
                <TableCell className="py-2 text-right text-sm text-muted-foreground">
                  {formatValue(item.metrica, item.anterior)}
                </TableCell>
                <TableCell className="py-2 text-right">
                  {getTrendBadge(item)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
