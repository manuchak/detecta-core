import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, TrendingUp, CheckCircle, XCircle, Clock, MapPin, DollarSign, MessageSquare, ThumbsUp, Shield, AlertTriangle, FileCheck, ClipboardCheck, Info } from 'lucide-react';
import { useProfilePerformance } from '../../hooks/useProfilePerformance';
import type { OperativeProfileFull } from '../../hooks/useOperativeProfile';
import { TrendCharts } from './TrendCharts';

interface PerformanceServiciosTabProps {
  custodioId: string;
  nombre: string;
  profile?: OperativeProfileFull;
}

export function PerformanceServiciosTab({ custodioId, nombre, profile }: PerformanceServiciosTabProps) {
  const telefono = profile?.telefono || null;
  const { metrics, isLoading, isError } = useProfilePerformance(custodioId, nombre, telefono);

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
    icon: Icon, label, value, subValue, color 
  }: { 
    icon: any; label: string; value: string | number; subValue?: string; color: string;
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

  const dimensions = [
    {
      label: 'Puntualidad',
      score: metrics.scorePuntualidad,
      weight: '30%',
      color: '[&>div]:bg-blue-500',
      detail: `${metrics.puntualidadATiempo} a tiempo, ${metrics.puntualidadRetrasoLeve} retraso leve, ${metrics.puntualidadRetrasoGrave} grave (de ${metrics.puntualidadTotal})`,
      tooltip: 'Basado en hora_presentacion vs fecha_hora_cita. Llegar antes o puntual = a tiempo.',
    },
    {
      label: 'Confiabilidad',
      score: metrics.scoreConfiabilidad,
      weight: '25%',
      color: '[&>div]:bg-green-500',
      detail: `${metrics.cancelaciones} cancelaciones, ${metrics.rechazos} rechazos de ${metrics.totalAsignaciones} asignaciones`,
      tooltip: '% de asignaciones no canceladas ni rechazadas.',
    },
    {
      label: 'Checklist',
      score: metrics.scoreChecklist,
      weight: '20%',
      color: '[&>div]:bg-amber-500',
      detail: `${metrics.serviciosConChecklist} completados de ${metrics.ejecucionesCompletadas} servicios`,
      tooltip: '% de servicios finalizados con checklist de inspección completado.',
    },
    {
      label: 'Documentación',
      score: metrics.scoreDocumentacion,
      weight: '15%',
      color: '[&>div]:bg-purple-500',
      detail: `${metrics.docsVerificados} verificados de ${metrics.docsSubidos} subidos (${metrics.docsVigentes} vigentes)`,
      tooltip: '% de documentos subidos que están verificados por el equipo.',
    },
    {
      label: 'Volumen',
      score: Math.min(100, Math.round((metrics.ejecucionesCompletadas / 100) * 100)),
      weight: '10%',
      color: '[&>div]:bg-cyan-500',
      detail: `${metrics.ejecucionesCompletadas} servicios completados`,
      tooltip: 'Normalizado: 100 servicios = 100%. Mide actividad y disponibilidad.',
    },
  ];

  // Alerts for 0% dimensions
  const alerts: { icon: any; title: string; description: string }[] = [];
  if (metrics.scoreChecklist === 0 && metrics.ejecucionesCompletadas > 0) {
    alerts.push({
      icon: ClipboardCheck,
      title: 'Sin checklists completados',
      description: `${metrics.ejecucionesCompletadas} servicios sin registro de inspección pre-servicio`,
    });
  }
  if (metrics.scoreDocumentacion === 0 && metrics.docsSubidos > 0) {
    alerts.push({
      icon: FileCheck,
      title: 'Documentación sin verificar',
      description: `${metrics.docsSubidos} documentos pendientes de revisión`,
    });
  }
  if (metrics.docsSubidos === 0) {
    alerts.push({
      icon: FileCheck,
      title: 'Sin documentación',
      description: 'No se han subido documentos al portal',
    });
  }

  const getScoreBadge = (score: number) => {
    if (score === 0) return <Badge variant="destructive" className="text-[10px] px-1.5">0%</Badge>;
    if (score < 50) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px] px-1.5">{score}%</Badge>;
    return null;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Score Global with 6 dimensions */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Score Global de Rendimiento
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Ponderado: Puntualidad 30% · Confiabilidad 25% · Checklist 20% · Documentación 15% · Volumen 10%
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              {/* Donut */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" className="text-muted/20" />
                  <circle
                    cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none"
                    strokeDasharray={`${(metrics.scoreGlobal / 100) * 352} 352`}
                    className="text-primary transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{metrics.scoreGlobal}</span>
                </div>
              </div>

              {/* 6 dimension bars */}
              <div className="flex-1 space-y-3">
                {dimensions.map((dim) => (
                  <div key={dim.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 cursor-help">
                            {dim.label}
                            <Info className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">({dim.weight})</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[250px]">
                          <p className="text-xs font-medium mb-1">{dim.tooltip}</p>
                          <p className="text-xs text-muted-foreground">{dim.detail}</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="flex items-center gap-1.5">
                        {getScoreBadge(dim.score)}
                        <span className="font-medium">{dim.score}%</span>
                      </span>
                    </div>
                    <Progress value={dim.score} className={`h-2 ${dim.color}`} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <Alert key={i} variant="destructive" className="border-destructive/30 bg-destructive/5">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                <AlertDescription className="text-xs">{alert.description}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Puntualidad Detail */}
        {metrics.puntualidadTotal > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Detalle de Puntualidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard icon={CheckCircle} label="A tiempo" value={metrics.puntualidadATiempo} subValue={`${metrics.scorePuntualidad}%`} color="bg-green-500/10 text-green-500" />
                <MetricCard icon={Clock} label="Retraso leve (≤15min)" value={metrics.puntualidadRetrasoLeve} color="bg-amber-500/10 text-amber-500" />
                <MetricCard icon={XCircle} label="Retraso grave (>15min)" value={metrics.puntualidadRetrasoGrave} color="bg-red-500/10 text-red-500" />
                <MetricCard icon={TrendingUp} label="Con datos de hora" value={metrics.puntualidadTotal} subValue={`de ${metrics.totalEjecuciones} totales`} color="bg-blue-500/10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasas de Respuesta */}
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
                <MetricCard icon={ThumbsUp} label="Tasa de Aceptación" value={`${(profile.tasa_aceptacion || 0).toFixed(0)}%`} color="bg-green-500/10 text-green-500" />
                <MetricCard icon={MessageSquare} label="Tasa de Respuesta" value={`${(profile.tasa_respuesta || 0).toFixed(0)}%`} color="bg-blue-500/10 text-blue-500" />
                <MetricCard icon={Shield} label="Tasa de Confiabilidad" value={`${(profile.tasa_confiabilidad || 0).toFixed(0)}%`} color="bg-purple-500/10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métricas de Asignación */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Métricas de Asignación</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard icon={Clock} label="Total Asignaciones" value={metrics.totalAsignaciones} subValue="Desde registro" color="bg-blue-500/10 text-blue-500" />
            <MetricCard icon={CheckCircle} label="Confirmadas" value={metrics.asignacionesCompletadas} subValue={`${metrics.tasaAsignacion}% del total`} color="bg-green-500/10 text-green-500" />
            <MetricCard icon={XCircle} label="Canceladas" value={metrics.cancelaciones} color="bg-red-500/10 text-red-500" />
            <MetricCard icon={AlertTriangle} label="Rechazos" value={metrics.rechazos} subValue="Total histórico" color="bg-amber-500/10 text-amber-500" />
          </div>
        </div>

        {/* Métricas de Ejecución */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Métricas de Ejecución</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard icon={Clock} label="Total Ejecuciones" value={metrics.totalEjecuciones} subValue="Servicios ejecutados" color="bg-purple-500/10 text-purple-500" />
            <MetricCard icon={CheckCircle} label="Completadas" value={metrics.ejecucionesCompletadas} color="bg-green-500/10 text-green-500" />
            <MetricCard icon={MapPin} label="Kilómetros Totales" value={metrics.kmTotales.toLocaleString()} subValue="km recorridos" color="bg-amber-500/10 text-amber-500" />
            <MetricCard icon={DollarSign} label="Ingresos Generados" value={`$${metrics.ingresosTotales.toLocaleString()}`} subValue="MXN total" color="bg-emerald-500/10 text-emerald-500" />
          </div>
        </div>

        {/* Tendencias */}
        <div className="pt-2">
          <h3 className="text-lg font-semibold mb-4">Tendencias Temporales</h3>
          <TrendCharts custodioId={custodioId} nombre={nombre} />
        </div>
      </div>
    </TooltipProvider>
  );
}
