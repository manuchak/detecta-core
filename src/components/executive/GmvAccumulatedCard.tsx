import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Truck } from 'lucide-react';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

export const GmvAccumulatedCard = () => {
  const { yearlyTotals, currentYear, loading } = useExecutiveMultiYearData();

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6"><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  const current = yearlyTotals.find(y => y.year === currentYear);
  const previous = yearlyTotals.find(y => y.year === currentYear - 1);

  const gmvCurrent = current?.gmv || 0;
  const gmvPrev = previous?.gmv || 0;
  const gmvDelta = gmvPrev > 0 ? ((gmvCurrent - gmvPrev) / gmvPrev) * 100 : 0;

  const svcCurrent = current?.services || 0;
  const svcPrev = previous?.services || 0;
  const svcDelta = svcPrev > 0 ? ((svcCurrent - svcPrev) / svcPrev) * 100 : 0;

  const fmt = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Acumulado {currentYear} vs {currentYear - 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* GMV Accumulated */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">GMV Acumulado</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(gmvCurrent)}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">vs {fmt(gmvPrev)}</span>
            <span className={`flex items-center text-sm font-medium ${gmvDelta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {gmvDelta >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {gmvDelta >= 0 ? '+' : ''}{gmvDelta.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Services Total */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Total Servicios Año</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{svcCurrent.toLocaleString('es-MX')}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">vs {svcPrev.toLocaleString('es-MX')}</span>
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
