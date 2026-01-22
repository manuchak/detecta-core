import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, CheckCircle, XCircle, Clock, MapPin, DollarSign } from 'lucide-react';
import { useProfilePerformance } from '../../hooks/useProfilePerformance';

interface PerformanceServiciosTabProps {
  custodioId: string;
  nombre: string;
  telefono: string | null;
}

export function PerformanceServiciosTab({ custodioId, nombre, telefono }: PerformanceServiciosTabProps) {
  const { metrics, isLoading, isError } = useProfilePerformance(custodioId, nombre, telefono || undefined);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Error al cargar métricas de rendimiento
      </div>
    );
  }

  const MetricCard = ({ 
    icon: Icon, 
    label, 
    value, 
    subValue,
    color 
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    subValue?: string;
    color: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">{label}</p>
      </CardContent>
    </Card>
  );

  const ScoreBar = ({ label, score, color }: { label: string; score: number; color: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{score}%</span>
      </div>
      <Progress value={score} className={`h-2 ${color}`} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Score Global */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Score Global de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(metrics.scoreGlobal / 100) * 352} 352`}
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{metrics.scoreGlobal}</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <ScoreBar label="Puntualidad" score={metrics.scorePuntualidad} color="[&>div]:bg-blue-500" />
              <ScoreBar label="Confiabilidad" score={metrics.scoreConfiabilidad} color="[&>div]:bg-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Asignación (servicios_planificados) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Métricas de Asignación</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={Clock}
            label="Total Asignaciones"
            value={metrics.totalAsignaciones}
            subValue="Desde registro"
            color="bg-blue-500/10 text-blue-500"
          />
          <MetricCard
            icon={CheckCircle}
            label="Completadas"
            value={metrics.asignacionesCompletadas}
            subValue={`${metrics.tasaAsignacion}% del total`}
            color="bg-green-500/10 text-green-500"
          />
          <MetricCard
            icon={XCircle}
            label="Canceladas"
            value={metrics.asignacionesCanceladas}
            subValue="Por el custodio"
            color="bg-red-500/10 text-red-500"
          />
          <MetricCard
            icon={TrendingUp}
            label="Tasa de Cumplimiento"
            value={`${metrics.tasaAsignacion}%`}
            subValue="Completadas vs asignadas"
            color="bg-primary/10 text-primary"
          />
        </div>
      </div>

      {/* Métricas de Ejecución (servicios_custodia) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Métricas de Ejecución</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={Clock}
            label="Total Ejecuciones"
            value={metrics.totalEjecuciones}
            subValue="Servicios ejecutados"
            color="bg-purple-500/10 text-purple-500"
          />
          <MetricCard
            icon={CheckCircle}
            label="Completadas"
            value={metrics.ejecucionesCompletadas}
            color="bg-green-500/10 text-green-500"
          />
          <MetricCard
            icon={MapPin}
            label="Kilómetros Totales"
            value={metrics.kmTotales.toLocaleString()}
            subValue="km recorridos"
            color="bg-amber-500/10 text-amber-500"
          />
          <MetricCard
            icon={DollarSign}
            label="Ingresos Generados"
            value={`$${metrics.ingresosTotales.toLocaleString()}`}
            subValue="MXN total"
            color="bg-emerald-500/10 text-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
