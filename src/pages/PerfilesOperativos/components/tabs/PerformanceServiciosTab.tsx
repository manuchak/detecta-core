import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, CheckCircle, XCircle, Clock, MapPin, DollarSign, MessageSquare, ThumbsUp, Shield } from 'lucide-react';
import { useProfilePerformance } from '../../hooks/useProfilePerformance';
import type { OperativeProfileFull } from '../../hooks/useOperativeProfile';

interface PerformanceServiciosTabProps {
  custodioId: string;
  nombre: string;
  telefono: string | null;
  profile?: OperativeProfileFull;
}

export function PerformanceServiciosTab({ custodioId, nombre, telefono, profile }: PerformanceServiciosTabProps) {
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

  const ScoreBar = ({ label, score, color, maxScore = 100 }: { label: string; score: number; color: string; maxScore?: number }) => {
    const percentage = (score / maxScore) * 100;
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span className="font-medium">{score.toFixed(1)}{maxScore === 10 ? '/10' : '%'}</span>
        </div>
        <Progress value={percentage} className={`h-2 ${color}`} />
      </div>
    );
  };

  // Database scores from profile
  const dbScores = profile ? {
    comunicacion: profile.score_comunicacion || 0,
    aceptacion: profile.score_aceptacion || 0,
    confiabilidad: profile.score_confiabilidad || 0,
    total: profile.score_total || 0
  } : null;

  return (
    <div className="space-y-6">
      {/* Score Global Calculado */}
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

      {/* Scores Detallados de la Base de Datos */}
      {dbScores && (dbScores.comunicacion > 0 || dbScores.aceptacion > 0 || dbScores.confiabilidad > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Scores Detallados (Base de Datos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <ScoreBar 
                  label="Comunicación" 
                  score={dbScores.comunicacion} 
                  color="[&>div]:bg-purple-500" 
                  maxScore={10}
                />
                <ScoreBar 
                  label="Aceptación" 
                  score={dbScores.aceptacion} 
                  color="[&>div]:bg-blue-500" 
                  maxScore={10}
                />
              </div>
              <div className="space-y-4">
                <ScoreBar 
                  label="Confiabilidad" 
                  score={dbScores.confiabilidad} 
                  color="[&>div]:bg-green-500" 
                  maxScore={10}
                />
                <ScoreBar 
                  label="Score Total" 
                  score={dbScores.total} 
                  color="[&>div]:bg-primary" 
                  maxScore={10}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Ponderación: Comunicación 30% • Aceptación 40% • Confiabilidad 30%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tasas de Respuesta (si están disponibles) */}
      {profile && (profile.tasa_aceptacion || profile.tasa_respuesta || profile.tasa_confiabilidad) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Tasas de Respuesta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                icon={ThumbsUp}
                label="Tasa de Aceptación"
                value={`${(profile.tasa_aceptacion || 0).toFixed(0)}%`}
                color="bg-green-500/10 text-green-500"
              />
              <MetricCard
                icon={MessageSquare}
                label="Tasa de Respuesta"
                value={`${(profile.tasa_respuesta || 0).toFixed(0)}%`}
                color="bg-blue-500/10 text-blue-500"
              />
              <MetricCard
                icon={Shield}
                label="Tasa de Confiabilidad"
                value={`${(profile.tasa_confiabilidad || 0).toFixed(0)}%`}
                color="bg-purple-500/10 text-purple-500"
              />
            </div>
          </CardContent>
        </Card>
      )}

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
