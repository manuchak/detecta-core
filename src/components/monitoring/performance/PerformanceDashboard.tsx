import { usePerformanceDiario } from '@/hooks/usePerformanceDiario';
import PerformanceMetricCards from './PerformanceMetricCards';
import OnTimeProblemsTable from './OnTimeProblemsTable';
import PerformanceHistoryCharts from './PerformanceHistoryCharts';
import { AlertCircle } from 'lucide-react';

const emptyMetrics = {
  totalServicios: 0,
  fillRate: 0,
  onTimeRate: 0,
  otifRate: 0,
  checklistsCompletados: 0,
  checklistsRate: 0,
  custodiosActivos: 0,
  serviciosPorCustodio: 0,
};

export default function PerformanceDashboard() {
  const { data, isLoading, isError } = usePerformanceDiario();

  const metricas = data?.metricas || emptyMetrics;
  const problemasPorCliente = data?.problemasPorCliente || [];
  const problemasPorCustodio = data?.problemasPorCustodio || [];

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar datos de performance</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <PerformanceMetricCards metricas={metricas} loading={isLoading} />

      {/* Historical Charts */}
      <PerformanceHistoryCharts />

      {/* Problem Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OnTimeProblemsTable
          title="Clientes con problemas de puntualidad"
          data={problemasPorCliente}
          loading={isLoading}
        />
        <OnTimeProblemsTable
          title="Custodios con problemas de puntualidad"
          data={problemasPorCustodio}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
