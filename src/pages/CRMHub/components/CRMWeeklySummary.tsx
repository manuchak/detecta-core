import { Card, CardContent } from '@/components/ui/card';
import { Trophy, XCircle, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklySummaryData {
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  lostValue: number;
  lostReason?: string;
  newDeals: number;
  newValue: number;
  stalledDeals: number;
  stalledValue: number;
}

interface CRMWeeklySummaryProps {
  data: WeeklySummaryData;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function CRMWeeklySummary({ data, isLoading }: CRMWeeklySummaryProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      icon: Trophy,
      label: 'deals ganados',
      count: data.wonDeals,
      value: data.wonValue,
      colorClass: 'text-green-600',
      bgClass: 'bg-green-500/10',
    },
    {
      icon: XCircle,
      label: 'deal perdido',
      count: data.lostDeals,
      value: data.lostValue,
      subtext: data.lostReason ? `(razón: ${data.lostReason})` : undefined,
      colorClass: 'text-red-600',
      bgClass: 'bg-red-500/10',
    },
    {
      icon: Plus,
      label: 'nuevos deals',
      count: data.newDeals,
      value: data.newValue,
      subtext: 'potencial',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-500/10',
    },
    {
      icon: AlertTriangle,
      label: 'deals stalled',
      count: data.stalledDeals,
      value: data.stalledValue,
      subtext: 'en riesgo',
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-500/10',
    },
  ];

  // Only show items with data
  const activeItems = items.filter(item => item.count > 0);

  if (activeItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          Sin actividad esta semana
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Resumen Esta Semana
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {activeItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg shrink-0', item.bgClass)}>
                  <Icon className={cn('h-4 w-4', item.colorClass)} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className={cn('text-lg font-bold', item.colorClass)}>
                      {item.count}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                    {item.subtext && (
                      <span className="text-xs text-muted-foreground">{item.subtext}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
