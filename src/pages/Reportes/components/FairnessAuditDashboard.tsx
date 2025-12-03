import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Scale, Users, TrendingUp, UserCheck, BarChart3 } from 'lucide-react';
import { useFairnessAuditMetrics } from '../hooks/useFairnessAuditMetrics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const CATEGORIA_COLORS = {
  MUY_FAVORECIDO: 'hsl(var(--destructive))',
  FAVORECIDO: 'hsl(25 95% 53%)',
  NORMAL: 'hsl(var(--muted-foreground))',
  SUBFAVORECIDO: 'hsl(45 93% 47%)',
  MUY_SUBFAVORECIDO: 'hsl(var(--primary))',
};

const CATEGORIA_LABELS = {
  MUY_FAVORECIDO: '🔴 Muy Favorecido',
  FAVORECIDO: '🟠 Favorecido',
  NORMAL: '⚪ Normal',
  SUBFAVORECIDO: '🟡 Subfavorecido',
  MUY_SUBFAVORECIDO: '🔵 Muy Subfavorecido',
};

export default function FairnessAuditDashboard() {
  const { data: metrics, isLoading, error } = useFairnessAuditMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No se pudieron cargar las métricas de auditoría.</AlertDescription>
      </Alert>
    );
  }

  const { indices, custodiosDesviados, sesgoPlanificadores, evolucionEquidad, alertas, recomendaciones } = metrics;

  // Determine status color
  const statusColor = indices.giniInterpretacion === 'bajo' 
    ? 'bg-green-500' 
    : indices.giniInterpretacion === 'moderado' 
    ? 'bg-amber-500' 
    : 'bg-destructive';
  
  const statusText = indices.giniInterpretacion === 'bajo' 
    ? 'EQUIDAD SALUDABLE' 
    : indices.giniInterpretacion === 'moderado' 
    ? 'DESIGUALDAD MODERADA' 
    : 'DESIGUALDAD ALTA';

  const muyFavorecidos = custodiosDesviados.filter(c => c.categoria === 'MUY_FAVORECIDO').length;
  const favorecidos = custodiosDesviados.filter(c => c.categoria === 'FAVORECIDO').length;

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className={`${statusColor}/10 border-${statusColor.replace('bg-', '')}/30`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full ${statusColor} flex items-center justify-center`}>
              <Scale className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{statusText}</h2>
              <p className="text-muted-foreground">
                {muyFavorecidos + favorecidos > 0 
                  ? `${muyFavorecidos} custodios muy favorecidos, ${favorecidos} favorecidos detectados`
                  : 'Distribución de asignaciones equitativa'}
              </p>
              <p className="text-sm mt-1">
                Índice Gini: <span className="font-mono font-bold">{indices.gini.toFixed(4)}</span>
                {' '}(umbral saludable: &lt;0.25)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Índice Gini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {indices.gini.toFixed(4)}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>0 (igual)</span>
                <span>1 (desigual)</span>
              </div>
              <div className="h-2 rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-destructive relative">
                <div 
                  className="absolute w-3 h-3 bg-white border-2 border-foreground rounded-full -top-0.5"
                  style={{ left: `${Math.min(indices.gini * 100, 100)}%`, transform: 'translateX(-50%)' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Entropía Shannon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {indices.entropiaPct.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              del máximo posible ({indices.entropia.toFixed(2)} / {indices.entropiaMaxima.toFixed(2)} bits)
            </p>
            <Progress value={indices.entropiaPct} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ratio Palma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {indices.palmaRatio.toFixed(2)}x
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Top 10% vs Bottom 40%
            </p>
            <Badge variant={indices.palmaRatio > 2 ? 'destructive' : indices.palmaRatio > 1.5 ? 'secondary' : 'default'} className="mt-2">
              {indices.palmaRatio > 2 ? 'Desigual' : indices.palmaRatio > 1.5 ? 'Moderado' : 'Equitativo'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Custodios Desviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {custodiosDesviados.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {muyFavorecidos} muy favorecidos, {favorecidos} favorecidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alertas.filter(a => a.severidad === 'alta').length > 0 && (
        <div className="space-y-2">
          {alertas.filter(a => a.severidad === 'alta').map((alerta, i) => (
            <Alert key={i} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alerta.tipo.replace(/_/g, ' ')}</AlertTitle>
              <AlertDescription>
                {alerta.descripcion}. <strong>Recomendación:</strong> {alerta.recomendacion}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolución del Índice Gini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucionEquidad}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="periodo" className="text-xs" />
                  <YAxis domain={[0, 0.5]} className="text-xs" />
                  <Tooltip formatter={(value: number) => [value.toFixed(4), 'Gini']} />
                  <Line
                    type="monotone"
                    dataKey="gini"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  {/* Reference line at 0.25 threshold */}
                  <Line
                    type="monotone"
                    dataKey={() => 0.25}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    dot={false}
                    name="Meta"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Línea punteada: umbral saludable (0.25)
            </p>
          </CardContent>
        </Card>

        {/* HHI Gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Índice Herfindahl-Hirschman (HHI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold font-mono">
                {indices.hhi.toFixed(0)}
              </div>
              <Badge 
                variant={indices.hhiInterpretacion === 'baja' ? 'default' : indices.hhiInterpretacion === 'moderada' ? 'secondary' : 'destructive'}
                className="mt-2"
              >
                Concentración {indices.hhiInterpretacion}
              </Badge>
              <div className="w-full mt-6">
                <div className="flex justify-between text-xs mb-1">
                  <span>0</span>
                  <span className="text-green-600">1,500</span>
                  <span className="text-amber-600">2,500</span>
                  <span className="text-destructive">10,000</span>
                </div>
                <div className="h-3 rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-destructive relative">
                  <div 
                    className="absolute w-4 h-4 bg-white border-2 border-foreground rounded-full -top-0.5"
                    style={{ left: `${Math.min((indices.hhi / 10000) * 100, 100)}%`, transform: 'translateX(-50%)' }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                &lt;1,500: Baja concentración (saludable)<br/>
                1,500-2,500: Moderada<br/>
                &gt;2,500: Alta concentración (problema)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deviated Custodios Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Custodios con Desviación Significativa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Custodio</TableHead>
                <TableHead className="text-right">Servicios</TableHead>
                <TableHead className="text-right">Z-Score</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">vs Promedio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {custodiosDesviados.slice(0, 15).map((custodio) => (
                <TableRow key={custodio.id}>
                  <TableCell className="font-medium">{custodio.nombre}</TableCell>
                  <TableCell className="text-right">{custodio.servicios}</TableCell>
                  <TableCell className="text-right font-mono">
                    {custodio.zScore > 0 ? '+' : ''}{custodio.zScore.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: CATEGORIA_COLORS[custodio.categoria],
                        color: CATEGORIA_COLORS[custodio.categoria]
                      }}
                    >
                      {CATEGORIA_LABELS[custodio.categoria]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={custodio.desviacionPct > 0 ? 'text-destructive' : 'text-primary'}>
                      {custodio.desviacionPct > 0 ? '+' : ''}{custodio.desviacionPct.toFixed(0)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {custodiosDesviados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay custodios con desviación significativa
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Planificador Bias Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Análisis de Sesgo por Planificador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Planificador</TableHead>
                <TableHead className="text-right">Asignaciones</TableHead>
                <TableHead className="text-right">Custodios Únicos</TableHead>
                <TableHead className="text-right">Diversidad</TableHead>
                <TableHead>Custodio más Asignado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sesgoPlanificadores.slice(0, 10).map((planificador) => (
                <TableRow key={planificador.planificadorId}>
                  <TableCell className="font-medium">{planificador.nombre}</TableCell>
                  <TableCell className="text-right">{planificador.totalAsignaciones}</TableCell>
                  <TableCell className="text-right">{planificador.custodiosUnicos}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Progress value={planificador.indiceDiversidad} className="w-16 h-2" />
                      <span className="text-sm">{planificador.indiceDiversidad.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {planificador.custodioMasAsignado} ({planificador.maxAsignacionesMismoCustodio})
                  </TableCell>
                  <TableCell>
                    {planificador.alertaSesgo ? (
                      <Badge variant="destructive">⚠️ Sesgo</Badge>
                    ) : (
                      <Badge variant="default">✓ OK</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {sesgoPlanificadores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay datos de planificadores
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Recomendaciones de Acción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recomendaciones.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant={rec.prioridad === 'alta' ? 'destructive' : rec.prioridad === 'media' ? 'secondary' : 'outline'}>
                {rec.prioridad}
              </Badge>
              <div className="flex-1">
                <p className="font-medium">{rec.accion}</p>
                <p className="text-sm text-muted-foreground">{rec.impactoEsperado}</p>
                {rec.custodiosAfectados && rec.custodiosAfectados.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rec.custodiosAfectados.slice(0, 5).map((c, j) => (
                      <Badge key={j} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                    {rec.custodiosAfectados.length > 5 && (
                      <Badge variant="outline" className="text-xs">+{rec.custodiosAfectados.length - 5} más</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {recomendaciones.length === 0 && alertas.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              ✓ No hay recomendaciones pendientes. La distribución es equitativa.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
