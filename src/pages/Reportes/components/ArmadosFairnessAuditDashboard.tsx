import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Users,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useArmadosFairnessMetrics, PeriodoEquidadArmados, ArmadoDesviado } from '../hooks/useArmadosFairnessMetrics';

const PERIODOS: { value: PeriodoEquidadArmados; label: string }[] = [
  { value: 'semana', label: 'Última Semana' },
  { value: 'mes_actual', label: 'Mes en Curso' },
  { value: 'ultimos_30', label: 'Últimos 30 días' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'year', label: 'Último Año' },
];

const INDICATOR_TOOLTIPS = {
  gini: 'El Índice Gini mide la desigualdad en la distribución de asignaciones. 0 = igualdad perfecta, 1 = desigualdad máxima. Meta: <0.25',
  entropia: 'La Entropía de Shannon mide la diversidad. 100% = asignaciones perfectamente distribuidas.',
  cobertura: 'Porcentaje del pool de armados activos que recibió al menos una asignación en el período.',
  hhi: 'Índice Herfindahl-Hirschman. <1,500 = baja concentración (saludable), >2,500 = alta (problema).',
  palma: 'Ratio entre el 10% más asignado vs el 40% menos asignado. >2x indica desigualdad significativa.',
};

function getCategoriaColor(categoria: ArmadoDesviado['categoria']) {
  switch (categoria) {
    case 'MUY_FAVORECIDO': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'FAVORECIDO': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'SUBFAVORECIDO': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'MUY_SUBFAVORECIDO': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function getCategoriaLabel(categoria: ArmadoDesviado['categoria']) {
  switch (categoria) {
    case 'MUY_FAVORECIDO': return 'Muy Favorecido';
    case 'FAVORECIDO': return 'Favorecido';
    case 'SUBFAVORECIDO': return 'Subfavorecido';
    case 'MUY_SUBFAVORECIDO': return 'Muy Subfavorecido';
    default: return 'Normal';
  }
}

function getHealthStatus(gini: number, cobertura: number) {
  if (gini < 0.25 && cobertura > 50) return { status: 'saludable', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', icon: CheckCircle2 };
  if (gini < 0.40 && cobertura > 30) return { status: 'moderado', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950', icon: AlertTriangle };
  return { status: 'crítico', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', icon: AlertTriangle };
}

export default function ArmadosFairnessAuditDashboard() {
  const [periodo, setPeriodo] = useState<PeriodoEquidadArmados>('mes_actual');
  const [showAllSinAsignacion, setShowAllSinAsignacion] = useState(false);
  
  const { data: metrics, isLoading, error } = useArmadosFairnessMetrics(periodo);
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error al cargar métricas</AlertTitle>
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    );
  }
  
  if (!metrics) return null;
  
  const health = getHealthStatus(metrics.resumen.gini, metrics.resumen.coberturaPool);
  const HealthIcon = health.icon;
  
  const sinAsignacionToShow = showAllSinAsignacion 
    ? metrics.armadosSinAsignacion 
    : metrics.armadosSinAsignacion.slice(0, 10);
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-corporate-blue" />
            <div>
              <h2 className="text-xl font-semibold">Equidad en Asignaciones de Armados Internos</h2>
              <p className="text-sm text-muted-foreground">
                Análisis de distribución del pool de {metrics.resumen.poolActivo} elementos activos
              </p>
            </div>
          </div>
          
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoEquidadArmados)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Health Status Banner */}
        <Card className={`${health.bg} border-none`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <HealthIcon className={`h-6 w-6 ${health.color}`} />
              <div>
                <p className={`font-semibold ${health.color} uppercase text-sm`}>
                  Equidad {health.status}
                </p>
                <p className="text-sm text-muted-foreground">
                  {metrics.resumen.armadosConAsignacion} de {metrics.resumen.poolActivo} armados recibieron asignaciones 
                  ({metrics.resumen.totalAsignaciones} servicios en total)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Insufficient Data Warning */}
        {metrics.datosInsuficientes && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Datos insuficientes</AlertTitle>
            <AlertDescription>
              No hay suficientes asignaciones en este período para un análisis estadístico significativo. 
              Prueba seleccionando un rango de tiempo más amplio.
            </AlertDescription>
          </Alert>
        )}
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Gini */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Índice Gini
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{INDICATOR_TOOLTIPS.gini}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.resumen.gini.toFixed(3)}</div>
              <Badge variant={metrics.resumen.giniInterpretacion === 'bajo' ? 'default' : 'destructive'} className="mt-1">
                {metrics.resumen.giniInterpretacion === 'bajo' ? 'Saludable' : 
                 metrics.resumen.giniInterpretacion === 'moderado' ? 'Moderado' : 'Alto'}
              </Badge>
            </CardContent>
          </Card>
          
          {/* Coverage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Cobertura Pool
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{INDICATOR_TOOLTIPS.cobertura}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.resumen.coberturaPool.toFixed(1)}%</div>
              <Progress value={metrics.resumen.coberturaPool} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.resumen.armadosConAsignacion}/{metrics.resumen.poolActivo} armados
              </p>
            </CardContent>
          </Card>
          
          {/* Entropy */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Entropía
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{INDICATOR_TOOLTIPS.entropia}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.resumen.entropiaPct.toFixed(1)}%</div>
              <Progress value={metrics.resumen.entropiaPct} className="mt-2 h-2" />
            </CardContent>
          </Card>
          
          {/* Sin Asignación */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Sin Asignación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.armadosSinAsignacion.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                elementos activos sin trabajo
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Alerts */}
        {metrics.alertas.length > 0 && (
          <div className="space-y-2">
            {metrics.alertas.map((alerta, i) => (
              <Alert key={i} variant={alerta.severidad === 'alta' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm font-medium">{alerta.descripcion}</AlertTitle>
                <AlertDescription className="text-xs">{alerta.recomendacion}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deviations Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Armados con Desviación Significativa
              </CardTitle>
              <CardDescription>
                Elementos que reciben más o menos asignaciones que el promedio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.desviaciones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No hay desviaciones significativas</p>
                  <p className="text-sm">La distribución es equitativa</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Armado</TableHead>
                      <TableHead className="text-right">Asig.</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">vs Prom.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.desviaciones.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium text-sm">{d.nombre}</TableCell>
                        <TableCell className="text-right">{d.asignaciones}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getCategoriaColor(d.categoria)}>
                            {getCategoriaLabel(d.categoria)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={d.desviacionPct > 0 ? 'text-red-600' : 'text-blue-600'}>
                            {d.desviacionPct > 0 ? (
                              <span className="flex items-center justify-end gap-1">
                                <TrendingUp className="h-3 w-3" />
                                +{d.desviacionPct.toFixed(0)}%
                              </span>
                            ) : (
                              <span className="flex items-center justify-end gap-1">
                                <TrendingDown className="h-3 w-3" />
                                {d.desviacionPct.toFixed(0)}%
                              </span>
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Underutilized Pool */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pool Subutilizado
              </CardTitle>
              <CardDescription>
                Armados activos sin asignaciones en el período ({metrics.armadosSinAsignacion.length} elementos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.armadosSinAsignacion.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>Todos los armados activos tienen asignaciones</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="text-right">Hist. Servicios</TableHead>
                        <TableHead>Zona</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sinAsignacionToShow.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium text-sm">{a.nombre}</TableCell>
                          <TableCell className="text-right">{a.serviciosHistoricos}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {a.zona || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {metrics.armadosSinAsignacion.length > 10 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => setShowAllSinAsignacion(!showAllSinAsignacion)}
                    >
                      {showAllSinAsignacion ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Mostrar menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Ver todos ({metrics.armadosSinAsignacion.length})
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Additional Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métricas Adicionales de Concentración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">HHI</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{INDICATOR_TOOLTIPS.hhi}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-semibold">{metrics.resumen.hhi.toFixed(0)}</p>
                <Badge variant="outline" className="mt-1">
                  Concentración {metrics.resumen.hhiInterpretacion}
                </Badge>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">Palma Ratio</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{INDICATOR_TOOLTIPS.palma}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-semibold">{metrics.resumen.palmaRatio.toFixed(2)}x</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Top 10% vs Bottom 40%
                </p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Total Asignaciones</span>
                <p className="text-xl font-semibold">{metrics.resumen.totalAsignaciones}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  en el período seleccionado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
