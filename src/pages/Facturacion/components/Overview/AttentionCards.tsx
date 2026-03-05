import { cn } from '@/lib/utils';
import { AlertTriangle, FileWarning, Banknote } from 'lucide-react';
import type { FinanceOverviewData } from '../../hooks/useFinanceOverview';

interface Props {
  data: FinanceOverviewData;
}

const fmt = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
};

export function AttentionCards({ data }: Props) {
  const cards = [
    {
      title: 'Aging >60 días',
      value: data.agingOver60Count > 0 ? fmt(data.agingOver60Amount) : '—',
      subtitle: data.agingOver60Count > 0 ? `${data.agingOver60Count} facturas vencidas` : 'Sin vencimiento crítico',
      icon: AlertTriangle,
      severity: data.agingOver60Count > 0 ? 'danger' : 'ok',
    },
    {
      title: 'Apoyos Pendientes',
      value: data.apoyosPendientes > 0 ? fmt(data.apoyosPendientesMonto) : '—',
      subtitle: `${data.apoyosPendientes} solicitudes por aprobar`,
      icon: FileWarning,
      severity: data.apoyosPendientes > 3 ? 'warning' : data.apoyosPendientes > 0 ? 'info' : 'ok',
    },
    {
      title: 'CxP por Dispersar',
      value: data.cxpPorDispersar > 0 ? fmt(data.cxpPorDispersarMonto) : '—',
      subtitle: `${data.cxpPorDispersar} cortes aprobados`,
      icon: Banknote,
      severity: data.cxpPorDispersar > 0 ? 'warning' : 'ok',
    },
  ];

  const severityStyles = {
    danger: 'border-red-500/40 bg-red-500/5',
    warning: 'border-amber-500/40 bg-amber-500/5',
    info: 'border-primary/40 bg-primary/5',
    ok: 'border-border/50 bg-muted/20',
  };

  const iconStyles = {
    danger: 'text-red-600 dark:text-red-400 bg-red-500/10',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    info: 'text-primary bg-primary/10',
    ok: 'text-muted-foreground bg-muted/30',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={cn(
              'rounded-xl border p-4 flex items-center gap-3 transition-colors',
              severityStyles[card.severity as keyof typeof severityStyles]
            )}
          >
            <div className={cn('p-2 rounded-lg shrink-0', iconStyles[card.severity as keyof typeof iconStyles])}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
              <p className="text-xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground truncate">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
