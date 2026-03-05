import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, DollarSign, CreditCard, BarChart3 } from 'lucide-react';
import type { FinanceOverviewData } from '../../hooks/useFinanceOverview';

interface Props {
  data: FinanceOverviewData;
}

const formatMoney = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
};

function VariationBadge({ value }: { value: number }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full',
      isPositive && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      isNegative && 'bg-red-500/10 text-red-600 dark:text-red-400',
      !isPositive && !isNegative && 'bg-muted text-muted-foreground'
    )}>
      <Icon className="h-3 w-3" />
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

export function PLBanner({ data }: Props) {
  const metrics = [
    {
      label: 'Ingresos MTD',
      value: formatMoney(data.ingresosMTD),
      variation: data.ingresosVar,
      icon: DollarSign,
      accent: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Egresos MTD',
      value: formatMoney(data.cxpMTD),
      variation: data.cxpVar,
      icon: CreditCard,
      accent: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      invertVariation: true,
    },
    {
      label: 'Margen Operativo',
      value: formatMoney(data.margenMTD),
      variation: data.margenVar,
      icon: BarChart3,
      accent: data.margenPct >= 30
        ? 'from-primary/20 to-primary/5 border-primary/30'
        : 'from-red-500/20 to-red-500/5 border-red-500/30',
      iconColor: data.margenPct >= 30 ? 'text-primary' : 'text-red-600 dark:text-red-400',
      suffix: `${data.margenPct.toFixed(1)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className={cn(
              'relative overflow-hidden rounded-xl border p-4',
              'bg-gradient-to-br',
              m.accent
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {m.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">{m.value}</span>
                  {m.suffix && (
                    <span className="text-sm font-medium text-muted-foreground">{m.suffix}</span>
                  )}
                </div>
                <VariationBadge value={m.invertVariation ? -m.variation : m.variation} />
              </div>
              <div className={cn('p-2.5 rounded-lg bg-background/60 backdrop-blur-sm', m.iconColor)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">vs mes anterior, misma fecha</p>
          </div>
        );
      })}
    </div>
  );
}
