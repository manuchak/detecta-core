import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, MapPin, DollarSign, Users, TrendingUp, Database } from 'lucide-react';
import { useArmadosInternosMetrics } from '../hooks/useArmadosInternosMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-MX').format(num);
}

export default function ArmadosInternosDashboard() {
  const { data: metrics, isLoading, error } = useArmadosInternosMetrics();

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
        <AlertDescription>No se pudieron cargar las métricas de armados internos.</AlertDescription>
      </Alert>
    );
  }

  const { resumen, distribucionKm, porArmado, eficiencia, calidadDatos, alertas } = metrics;

  return (
    <div className="space-y-6">
      {/* Data Quality Alert */}
      {calidadDatos.pctDatosConfiables < 95 && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <Database className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">Calidad de Datos</AlertTitle>
          <AlertDescription>
            <p>{calidadDatos.registrosSinKm} registros sin km_recorridos detectados ({(100 - calidadDatos.pctDatosConfiables).toFixed(1)}% del total)</p>
            {calidadDatos.registrosAnomalos > 0 && (
              <p>{calidadDatos.registrosAnomalos} registros con valores anómalos (&gt;10,000 km)</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Km Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(resumen.kmTotales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumen.serviciosTotales} servicios válidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Costo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(resumen.costoTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio: {formatCurrency(resumen.costoPromedioServicio)}/servicio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Km Promedio/Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {resumen.kmPromedio.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">km por servicio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Capacidad Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {eficiencia.armadosConCapacidad}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              armados con días libres
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tariffs Table and Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tariffs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Tarifas por Rango de Km
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rango</TableHead>
                  <TableHead className="text-right">$/Km</TableHead>
                  <TableHead className="text-right">Servicios</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distribucionKm.map((rango, i) => (
                  <TableRow key={rango.rango}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                        />
                        {rango.rango}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${rango.tarifaPorKm.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">{rango.servicios}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={rango.porcentaje > 30 ? 'default' : 'outline'}>
                        {rango.porcentaje.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(rango.costoTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Distribución por Rango
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribucionKm} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="rango" type="category" width={100} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'servicios' ? `${value} servicios` : formatCurrency(value),
                      name === 'servicios' ? 'Servicios' : 'Costo'
                    ]}
                  />
                  <Bar dataKey="servicios" name="servicios">
                    {distribucionKm.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Armados Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Armados Internos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Armado</TableHead>
                <TableHead className="text-right">Servicios</TableHead>
                <TableHead className="text-right">Km Totales</TableHead>
                <TableHead className="text-right">Km Prom</TableHead>
                <TableHead className="text-right">Costo Total</TableHead>
                <TableHead className="text-right">Días Activos</TableHead>
                <TableHead className="text-right">Capacidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porArmado.slice(0, 10).map((armado) => (
                <TableRow key={armado.id}>
                  <TableCell className="font-medium">{armado.nombre}</TableCell>
                  <TableCell className="text-right">{armado.servicios}</TableCell>
                  <TableCell className="text-right">{formatNumber(armado.kmTotales)}</TableCell>
                  <TableCell className="text-right">{armado.kmPromedio.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(armado.costoTotal)}</TableCell>
                  <TableCell className="text-right">{armado.diasActivos}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={armado.capacidadDisponible > 10 ? 'default' : 'outline'}>
                      {armado.capacidadDisponible} días
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {porArmado.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay datos de armados internos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alerts and Recommendations */}
      {alertas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💡 Alertas y Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertas.map((alerta, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Badge variant={alerta.severidad === 'alta' ? 'destructive' : alerta.severidad === 'media' ? 'secondary' : 'outline'}>
                  {alerta.severidad}
                </Badge>
                <div>
                  <p className="font-medium">{alerta.descripcion}</p>
                  <p className="text-sm text-muted-foreground">{alerta.accionSugerida}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Data Quality Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Calidad de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Registros</p>
              <p className="text-2xl font-bold">{formatNumber(calidadDatos.totalRegistros)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registros Válidos</p>
              <p className="text-2xl font-bold text-green-600">{formatNumber(calidadDatos.registrosValidos)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sin Km</p>
              <p className="text-2xl font-bold text-amber-600">{formatNumber(calidadDatos.registrosSinKm)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confiabilidad</p>
              <div className="flex items-center gap-2">
                <Progress value={calidadDatos.pctDatosConfiables} className="flex-1 h-2" />
                <span className="text-sm font-medium">{calidadDatos.pctDatosConfiables.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
