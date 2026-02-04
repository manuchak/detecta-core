import React from 'react';
import { cn } from '@/lib/utils';
import { FacturacionMetrics } from '../hooks/useFacturacionMetrics';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatUtils';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  MapPin,
  Percent,
  AlertTriangle,
  Banknote
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

type SemaphoreLevel = 'success' | 'warning' | 'danger' | 'neutral';

interface FinancialMetric {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  semaphore: SemaphoreLevel;
}

interface FacturacionHeroBarProps {
  metrics: FacturacionMetrics;
  isLoading: boolean;
}

const semaphoreStyles: Record<SemaphoreLevel, { border: string; bg: string }> = {
  success: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
  },
  danger: {
    border: 'border-l-red-500',
    bg: 'bg-red-50/50 dark:bg-red-950/20',
  },
  neutral: {
    border: 'border-l-slate-400',
    bg: 'bg-muted/30',
  },
};

const getMargenSemaphore = (porcentaje: number): SemaphoreLevel => {
  if (porcentaje >= 50) return 'success';
  if (porcentaje >= 30) return 'warning';
  return 'danger';
};

const getCostoSemaphore = (costos: number, ingresos: number): SemaphoreLevel => {
  if (ingresos === 0) return 'neutral';
  const ratio = (costos / ingresos) * 100;
  if (ratio <= 45) return 'success';
  if (ratio <= 55) return 'warning';
  return 'danger';
};

const getCancelacionSemaphore = (tasa: number): SemaphoreLevel => {
  if (tasa <= 3) return 'success';
  if (tasa <= 5) return 'warning';
  return 'danger';
};

export function FacturacionHeroBar({ metrics, isLoading }: FacturacionHeroBarProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-[72px] bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const financialMetrics: FinancialMetric[] = [
    {
      id: 'ingresos',
      title: 'Ingresos',
      value: formatCurrency(metrics.ingresosBrutos),
      description: 'Total facturado',
      icon: DollarSign,
      semaphore: 'success',
    },
    {
      id: 'costos',
      title: 'Costos',
      value: formatCurrency(metrics.costosOperativos),
      description: 'Pagos custodios',
      icon: Banknote,
      semaphore: getCostoSemaphore(metrics.costosOperativos, metrics.ingresosBrutos),
    },
    {
      id: 'margen',
      title: 'Margen',
      value: formatCurrency(metrics.margenBruto),
      description: 'Utilidad bruta',
      icon: TrendingUp,
      semaphore: getMargenSemaphore(metrics.porcentajeMargen),
    },
    {
      id: 'porcentaje',
      title: '% Margen',
      value: formatPercent(metrics.porcentajeMargen, false),
      description: 'Rentabilidad',
      icon: Percent,
      semaphore: getMargenSemaphore(metrics.porcentajeMargen),
    },
    {
      id: 'ticket',
      title: 'Ticket',
      value: formatCurrency(metrics.ticketPromedio),
      description: 'Promedio',
      icon: DollarSign,
      semaphore: 'neutral',
    },
    {
      id: 'servicios',
      title: 'Servicios',
      value: formatNumber(metrics.serviciosCompletados),
      description: 'Finalizados',
      icon: Package,
      semaphore: 'success',
    },
    {
      id: 'km',
      title: 'Km',
      value: formatNumber(metrics.kmFacturables),
      description: 'Recorridos',
      icon: MapPin,
      semaphore: 'neutral',
    },
    {
      id: 'cancelaciones',
      title: 'Cancelados',
      value: `${metrics.serviciosCancelados}`,
      description: `${metrics.tasaCancelacion.toFixed(1)}% tasa`,
      icon: AlertTriangle,
      semaphore: getCancelacionSemaphore(metrics.tasaCancelacion),
    },
  ];

  return (
    <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
      {financialMetrics.map((metric) => {
        const styles = semaphoreStyles[metric.semaphore];
        const Icon = metric.icon;
        
        return (
          <div
            key={metric.id}
            className={cn(
              'relative p-2.5 rounded-lg border border-l-4 transition-all hover:shadow-sm',
              styles.border,
              styles.bg,
              'border-border/50'
            )}
          >
            <div className="flex items-start justify-between">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate font-medium">
                {metric.title}
              </p>
              <Icon className="h-3 w-3 text-muted-foreground/70" />
            </div>
            <p className="text-lg font-bold mt-0.5 leading-tight">{metric.value}</p>
            <p className="text-[10px] text-muted-foreground truncate">{metric.description}</p>
          </div>
        );
      })}
    </div>
  );
}
