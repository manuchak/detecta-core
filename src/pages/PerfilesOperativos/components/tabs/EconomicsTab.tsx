import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { useProfileEconomics } from '../../hooks/useProfileEconomics';
import { usePoolBenchmarks } from '../../hooks/usePoolBenchmarks';
import { EarningsSummaryCard } from './economics/EarningsSummaryCard';
import { UnitEconomicsCard } from './economics/UnitEconomicsCard';
import { EarningsTrendChart } from './economics/EarningsTrendChart';
import { ServiceBreakdownCard } from './economics/ServiceBreakdownCard';
import { PoolRankingCard } from './economics/PoolRankingCard';
import { MonthlyBreakdownTable } from './economics/MonthlyBreakdownTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EconomicsTabProps {
  nombre: string;
  tipo: 'custodio' | 'armado';
}

export function EconomicsTab({ nombre, tipo }: EconomicsTabProps) {
  const { data: economics, isLoading: loadingEconomics, error: errorEconomics } = useProfileEconomics(nombre);
  const { data: benchmarks, isLoading: loadingBenchmarks } = usePoolBenchmarks(nombre);

  if (tipo === 'armado') {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Las métricas económicas para armados están en desarrollo</p>
      </div>
    );
  }

  if (loadingEconomics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (errorEconomics || !economics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar datos económicos: {errorEconomics?.message || 'Datos no disponibles'}
        </AlertDescription>
      </Alert>
    );
  }

  if (economics.serviciosTotales === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No hay datos económicos disponibles para este custodio. Los datos se mostrarán una vez que complete servicios.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Período de actividad */}
      {economics.primerServicio && economics.ultimoServicio && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Activo desde {format(new Date(economics.primerServicio), "d 'de' MMMM yyyy", { locale: es })}
            {' · '}
            Último servicio: {format(new Date(economics.ultimoServicio), "d 'de' MMMM yyyy", { locale: es })}
            {' · '}
            {economics.diasActivo} días de trayectoria
          </span>
        </div>
      )}

      {/* Resumen de ingresos */}
      <EarningsSummaryCard economics={economics} />

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Unit Economics y Breakdown */}
        <div className="space-y-6">
          <UnitEconomicsCard economics={economics} benchmarks={benchmarks} />
          <ServiceBreakdownCard economics={economics} />
        </div>

        {/* Columna central y derecha: Gráficos y Rankings */}
        <div className="lg:col-span-2 space-y-6">
          <EarningsTrendChart data={economics.tendenciaMensual} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loadingBenchmarks ? (
              <Skeleton className="h-80" />
            ) : benchmarks ? (
              <PoolRankingCard benchmarks={benchmarks} />
            ) : null}
            
            {/* Stats adicionales */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-medium mb-3">Métricas Clave</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ingresos/Día activo</span>
                    <span className="font-medium">
                      {economics.diasActivo > 0 
                        ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(economics.ingresosTotales / economics.diasActivo)
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Servicios/Mes promedio</span>
                    <span className="font-medium">
                      {(economics.serviciosTotales / 6).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Km/Servicio promedio</span>
                    <span className="font-medium">
                      {economics.serviciosTotales > 0 
                        ? (economics.kmTotales / economics.serviciosTotales).toFixed(0) + ' km'
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de rendimiento mensual */}
      <MonthlyBreakdownTable data={economics.tendenciaMensual} />
    </div>
  );
}
