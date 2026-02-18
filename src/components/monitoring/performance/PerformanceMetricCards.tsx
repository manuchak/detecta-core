import { MetricCard } from '@/components/recruitment/ui/MetricCard';
import { PerformanceMetrics } from '@/hooks/usePerformanceDiario';
import {
  Target,
  Clock,
  CheckCircle2,
  ClipboardCheck,
  Users,
  BarChart3,
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

export default function PerformanceMetricCards({ metricas, loading }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <MetricCard
        title="Fill Rate"
        value={`${metricas.fillRate}%`}
        subtitle={`${metricas.totalServicios} servicios hoy`}
        icon={Target}
        variant={rateVariant(metricas.fillRate)}
        size="sm"
        loading={loading}
      />
      <MetricCard
        title="On Time"
        value={`${metricas.onTimeRate}%`}
        subtitle="Llegadas puntuales"
        icon={Clock}
        variant={rateVariant(metricas.onTimeRate)}
        size="sm"
        loading={loading}
      />
      <MetricCard
        title="OTIF"
        value={`${metricas.otifRate}%`}
        subtitle="Puntual + checklist"
        icon={CheckCircle2}
        variant={rateVariant(metricas.otifRate)}
        size="sm"
        loading={loading}
      />
      <MetricCard
        title="Checklists"
        value={`${metricas.checklistsCompletados}`}
        subtitle={`${metricas.checklistsRate}% completados`}
        icon={ClipboardCheck}
        variant={rateVariant(metricas.checklistsRate)}
        size="sm"
        loading={loading}
      />
      <MetricCard
        title="Custodios Activos"
        value={metricas.custodiosActivos}
        subtitle="Hoy"
        icon={Users}
        variant="info"
        size="sm"
        loading={loading}
      />
      <MetricCard
        title="Svcs/Custodio"
        value={metricas.serviciosPorCustodio}
        subtitle="Promedio hoy"
        icon={BarChart3}
        variant="default"
        size="sm"
        loading={loading}
      />
    </div>
  );
}
