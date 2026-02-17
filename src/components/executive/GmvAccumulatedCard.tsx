import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Truck } from 'lucide-react';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

export const GmvAccumulatedCard = () => {
  const { monthlyByYear, currentYear, currentMonth, loading } = useExecutiveMultiYearData();

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6"><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  // YTD: sum months 1..currentMonth for current year and previous year (fair comparison)
  const sumYTD = (year: number) => {
    return monthlyByYear
      .filter(d => d.year === year && d.month <= currentMonth)
      .reduce((acc, d) => ({ gmv: acc.gmv + d.gmv, services: acc.services + d.services }), { gmv: 0, services: 0 });
  };

  const current = sumYTD(currentYear);
  const previous = sumYTD(currentYear - 1);

  const gmvDelta = previous.gmv > 0 ? ((current.gmv - previous.gmv) / previous.gmv) * 100 : 0;
  const svcDelta = previous.services > 0 ? ((current.services - previous.services) / previous.services) * 100 : 0;

  const fmt = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const periodLabel = `Ene-${MONTH_NAMES[currentMonth - 1]}`;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">YTD {currentYear} vs {currentYear - 1}</CardTitle>
          <span className="text-xs text-muted-foreground">{periodLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* GMV YTD */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">GMV YTD</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(current.gmv)}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">vs {fmt(previous.gmv)}</span>
            <span className={`flex items-center text-sm font-medium ${gmvDelta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {gmvDelta >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {gmvDelta >= 0 ? '+' : ''}{gmvDelta.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Services YTD */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Servicios YTD</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{current.services.toLocaleString('es-MX')}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">vs {previous.services.toLocaleString('es-MX')}</span>
            <span className={`flex items-center text-sm font-medium ${svcDelta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {svcDelta >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {svcDelta >= 0 ? '+' : ''}{svcDelta.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
