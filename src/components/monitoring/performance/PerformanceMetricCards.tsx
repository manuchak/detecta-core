import { MetricCard } from '@/components/recruitment/ui/MetricCard';
import { PerformanceMetrics } from '@/hooks/usePerformanceDiario';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Target,
  Clock,
  CheckCircle2,
  ClipboardCheck,
  Users,
  BarChart3,
  LucideIcon,
} from 'lucide-react';

interface Props {
  metricas: PerformanceMetrics;
  loading?: boolean;
}

function rateVariant(rate: number): 'success' | 'warning' | 'critical' {
  if (rate >= 90) return 'success';
  if (rate >= 70) return 'warning';
  return 'critical';
}

const iconStyles = {
  default: 'text-muted-foreground',
  critical: 'text-red-500',
  warning: 'text-orange-600',
  success: 'text-green-600',
  info: 'text-blue-600',
};

const variantBg = {
  default: 'border-border bg-card',
  critical: 'border-red-200 bg-red-50/30',
  warning: 'border-orange-200 bg-orange-50/50',
  success: 'border-green-200 bg-green-50/50',
  info: 'border-blue-200 bg-blue-50/50',
};

interface MiniMetric {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant: 'success' | 'warning' | 'critical' | 'info' | 'default';
}

function MobileMetricCard({ title, value, icon: Icon, variant }: MiniMetric) {
  return (
    <Card className={cn('p-2.5', variantBg[variant])}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn('h-3.5 w-3.5', iconStyles[variant])} />
        <span className="text-[10px] font-medium text-muted-foreground truncate">{title}</span>
      </div>
      <p className="text-xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}

export default function PerformanceMetricCards({ metricas, loading }: Props) {
  const isMobile = useIsMobile();

  const items: (MiniMetric & { subtitle: string })[] = [
    { title: 'Fill Rate', value: `${metricas.fillRate}%`, subtitle: `${metricas.totalServicios} servicios hoy`, icon: Target, variant: rateVariant(metricas.fillRate) },
    { title: 'On Time', value: `${metricas.onTimeRate}%`, subtitle: 'Llegadas puntuales', icon: Clock, variant: rateVariant(metricas.onTimeRate) },
    { title: 'OTIF', value: `${metricas.otifRate}%`, subtitle: 'Puntual + checklist', icon: CheckCircle2, variant: rateVariant(metricas.otifRate) },
    { title: 'Checklists', value: `${metricas.checklistsCompletados}`, subtitle: `${metricas.checklistsRate}% de ${metricas.checklistsEvaluables ?? metricas.totalServicios} evaluables`, icon: ClipboardCheck, variant: rateVariant(metricas.checklistsRate) },
    { title: 'Custodios', value: metricas.custodiosActivos, subtitle: 'Hoy', icon: Users, variant: 'info' as const },
    { title: 'Svcs/Cust', value: metricas.serviciosPorCustodio, subtitle: 'Promedio hoy', icon: BarChart3, variant: 'default' as const },
  ];

  if (loading) {
    return (
      <div className={cn('grid gap-3', isMobile ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4')}>
        {items.map((_, i) => (
          <Card key={i} className={cn('animate-pulse', isMobile ? 'p-2.5' : 'p-4')}>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {items.map((m) => (
          <MobileMetricCard key={m.title} title={m.title} value={m.value} icon={m.icon} variant={m.variant} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((m) => (
        <MetricCard
          key={m.title}
          title={m.title}
          value={m.value}
          subtitle={m.subtitle}
          icon={m.icon}
          variant={m.variant}
          size="sm"
        />
      ))}
    </div>
  );
}
