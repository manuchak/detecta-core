import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, DollarSign, Clock, TrendingDown, Building2, Percent } from 'lucide-react';
import { useProveedoresExternosMetrics } from '../hooks/useProveedoresExternosMetrics';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS_SEMAFORO = {
  rojo: 'hsl(var(--destructive))',
  amarillo: 'hsl(45 93% 47%)',
  verde: 'hsl(142 76% 36%)',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProveedoresExternosDashboard() {
  const { data: metrics, isLoading, error } = useProveedoresExternosMetrics();

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
        <AlertDescription>No se pudieron cargar las métricas de proveedores externos.</AlertDescription>
      </Alert>
    );
  }

  const { utilizacion, distribucionDuracion, porProveedor, alertas, evolucionMensual } = metrics;

  return (
    <div className="space-y-6">
      {/* Critical Alerts Banner */}
      {alertas.filter(a => a.severidad === 'alta').map((alerta, i) => (
        <Alert key={i} variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">⚠️ {alerta.tipo.replace(/_/g, ' ')}</AlertTitle>
          <AlertDescription className="mt-2">
            <p>{alerta.descripcion}</p>
            <p className="mt-1 font-semibold">
              Impacto Financiero: {formatCurrency(alerta.impactoFinanciero)}/mes
            </p>
            <p className="mt-1 text-sm opacity-80">💡 {alerta.accionSugerida}</p>
          </AlertDescription>
        </Alert>
      ))}

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-destructive" />
              Índice de Aprovechamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {utilizacion.indiceAprovechamiento.toFixed(1)}%
            </div>
            <Progress 
              value={utilizacion.indiceAprovechamiento} 
              className="mt-2 h-2" 
            />
            <p className="text-xs text-muted-foreground mt-1">Meta: 70%</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-destructive" />
              Revenue Leakage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {formatCurrency(utilizacion.revenueLeakage)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {utilizacion.horasDesperdiciadas.toFixed(0)}h desperdiciadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Duración Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {utilizacion.duracionPromedio.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">de 12h contratadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              Costo Efectivo/Hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(utilizacion.costoEfectivoPorHora)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs {formatCurrency(utilizacion.tarifaBase / 12)}/h contratada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Duration Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Distribución por Duración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucionDuracion.filter(d => d.servicios > 0)}
                    dataKey="servicios"
                    nameKey="rango"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ rango, porcentaje }) => `${rango}: ${porcentaje.toFixed(1)}%`}
                  >
                    {distribucionDuracion.map((entry, index) => (
                      <Cell key={index} fill={COLORS_SEMAFORO[entry.colorSemaforo]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} servicios`, 'Cantidad']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-xs">Crítico (&lt;4h)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS_SEMAFORO.amarillo }} />
                <span className="text-xs">Bajo (4-8h)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS_SEMAFORO.verde }} />
                <span className="text-xs">Óptimo (&gt;8h)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Tendencia Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucionMensual}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'aprovechamiento' ? `${value.toFixed(1)}%` : formatCurrency(value),
                      name === 'aprovechamiento' ? 'Aprovechamiento' : 'Leakage'
                    ]}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="aprovechamiento"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Aprovechamiento %"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenueLeakage"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    name="Revenue Leakage"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Proveedores Externos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Esquema</TableHead>
                <TableHead className="text-right">Tarifa Base</TableHead>
                <TableHead className="text-right">Servicios</TableHead>
                <TableHead className="text-right">Duración Prom</TableHead>
                <TableHead className="text-right">Aprovechamiento</TableHead>
                <TableHead className="text-right">Revenue Leakage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porProveedor.map((prov) => (
                <TableRow key={prov.id}>
                  <TableCell className="font-medium">{prov.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{prov.esquemaPago}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(prov.tarifaBase)}</TableCell>
                  <TableCell className="text-right">{prov.servicios}</TableCell>
                  <TableCell className="text-right">{prov.duracionPromedio.toFixed(1)}h</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={prov.aprovechamiento < 30 ? 'destructive' : prov.aprovechamiento < 60 ? 'secondary' : 'default'}>
                      {prov.aprovechamiento.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-destructive font-medium">
                    {formatCurrency(prov.revenueLeakage)}
                  </TableCell>
                </TableRow>
              ))}
              {porProveedor.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay datos de proveedores externos
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
          <CardTitle>💡 Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alertas.map((alerta, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant={alerta.severidad === 'alta' ? 'destructive' : alerta.severidad === 'media' ? 'secondary' : 'outline'}>
                {alerta.severidad}
              </Badge>
              <div>
                <p className="font-medium">{alerta.accionSugerida}</p>
                <p className="text-sm text-muted-foreground">{alerta.descripcion}</p>
              </div>
            </div>
          ))}
          {alertas.length === 0 && (
            <p className="text-muted-foreground">No hay recomendaciones pendientes.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
