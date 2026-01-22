import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  XCircle, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  Minus
} from 'lucide-react';
import { useRejectionAnalytics, PeriodoRechazo } from '@/hooks/useRejectionAnalytics';
import { format, subDays, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';
import { CATEGORY_CHART_COLORS } from '@/constants/rejectionCategories';

const PERIODO_OPTIONS: { value: PeriodoRechazo; label: string }[] = [
  { value: 'ultimos_30', label: 'Últimos 30 días' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes_actual', label: 'Este mes' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'year', label: 'Año' }
];

function getDateRangeLabel(periodo: PeriodoRechazo): string {
  const hoy = new Date();
  switch (periodo) {
    case 'semana':
      return `${format(subDays(hoy, 7), 'd MMM', { locale: es })} - ${format(hoy, 'd MMM yyyy', { locale: es })}`;
    case 'mes_actual':
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return `${format(inicioMes, 'd MMM', { locale: es })} - ${format(hoy, 'd MMM yyyy', { locale: es })}`;
    case 'ultimos_30':
      return `${format(subDays(hoy, 30), 'd MMM', { locale: es })} - ${format(hoy, 'd MMM yyyy', { locale: es })}`;
    case 'trimestre':
      return `${format(subMonths(hoy, 3), 'd MMM', { locale: es })} - ${format(hoy, 'd MMM yyyy', { locale: es })}`;
    case 'year':
      return `${format(new Date(hoy.getFullYear(), 0, 1), 'd MMM', { locale: es })} - ${format(hoy, 'd MMM yyyy', { locale: es })}`;
  }
}

export default function RejectionsDashboard() {
  const [periodo, setPeriodo] = useState<PeriodoRechazo>('mes_actual');
  const { data: metrics, isLoading, error } = useRejectionAnalytics(periodo);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No se pudieron cargar las métricas de rechazos.</AlertDescription>
      </Alert>
    );
  }

  const { 
    totalRechazos, 
    totalAceptaciones, 
    tasaRechazo, 
    tiempoPromedioRechazo,
    variacionVsPeriodoAnterior,
    porCategoria,
    topMotivos,
    tendencia,
    rechazosRecientes 
  } = metrics;

  // Status badge colors
  const getTasaColor = (tasa: number) => {
    if (tasa < 2) return 'bg-emerald-500';
    if (tasa < 5) return 'bg-amber-500';
    return 'bg-destructive';
  };

  const getTasaLabel = (tasa: number) => {
    if (tasa < 2) return 'Excelente';
    if (tasa < 5) return 'Normal';
    return 'Alto';
  };

  const getTiempoColor = (minutos: number) => {
    if (minutos < 30) return 'text-emerald-600';
    if (minutos < 60) return 'text-amber-600';
    return 'text-destructive';
  };

  // Empty state
  if (totalRechazos === 0 && totalAceptaciones === 0) {
    return (
      <div className="space-y-6">
        {/* Period Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Período de análisis</p>
              <p className="text-xs text-muted-foreground">{getDateRangeLabel(periodo)}</p>
            </div>
          </div>
          <ToggleGroup type="single" value={periodo} onValueChange={(v) => v && setPeriodo(v as PeriodoRechazo)}>
            {PERIODO_OPTIONS.map(opt => (
              <ToggleGroupItem key={opt.value} value={opt.value} size="sm">
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <Card className="p-12 text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">¡Sin rechazos en este período!</h3>
          <p className="text-muted-foreground">
            No se registraron rechazos de custodios en el período seleccionado.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Período de análisis</p>
            <p className="text-xs text-muted-foreground">{getDateRangeLabel(periodo)}</p>
          </div>
        </div>
        <ToggleGroup type="single" value={periodo} onValueChange={(v) => v && setPeriodo(v as PeriodoRechazo)}>
          {PERIODO_OPTIONS.map(opt => (
            <ToggleGroupItem key={opt.value} value={opt.value} size="sm">
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasa de Rechazo */}
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm text-muted-foreground">Tasa de Rechazo</span>
              <Badge className={cn("text-white", getTasaColor(tasaRechazo))}>
                {getTasaLabel(tasaRechazo)}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold">{tasaRechazo.toFixed(1)}%</span>
              {variacionVsPeriodoAnterior !== null && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded",
                  variacionVsPeriodoAnterior > 0 
                    ? "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950"
                    : variacionVsPeriodoAnterior < 0
                    ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950"
                    : "text-muted-foreground bg-muted"
                )}>
                  {variacionVsPeriodoAnterior > 0 ? <TrendingUp className="h-3 w-3" /> : 
                   variacionVsPeriodoAnterior < 0 ? <TrendingDown className="h-3 w-3" /> :
                   <Minus className="h-3 w-3" />}
                  <span>{variacionVsPeriodoAnterior > 0 ? '+' : ''}{variacionVsPeriodoAnterior.toFixed(1)} pts</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              vs período anterior
            </p>
          </CardContent>
        </Card>

        {/* Total Rechazos */}
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Rechazos</span>
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-3xl font-bold">{totalRechazos}</span>
            <p className="text-xs text-muted-foreground mt-2">
              de {totalRechazos + totalAceptaciones} respuestas totales
            </p>
          </CardContent>
        </Card>

        {/* Total Aceptaciones */}
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm text-muted-foreground">Aceptaciones</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-3xl font-bold">{totalAceptaciones}</span>
            <p className="text-xs text-muted-foreground mt-2">
              Tasa de aceptación: {((totalAceptaciones / (totalRechazos + totalAceptaciones)) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        {/* Tiempo Promedio */}
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm text-muted-foreground">Tiempo Promedio</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className={cn("text-3xl font-bold", getTiempoColor(tiempoPromedioRechazo))}>
              {tiempoPromedioRechazo.toFixed(0)} min
            </span>
            <p className="text-xs text-muted-foreground mt-2">
              desde el primer contacto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pareto Chart */}
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Pareto de Motivos de Rechazo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topMotivos} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="motivo" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'count') return [value, 'Rechazos'];
                      if (name === 'acumulado') return [`${value.toFixed(1)}%`, 'Acumulado'];
                      return [value, name];
                    }}
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="count" 
                    fill="hsl(var(--destructive))" 
                    radius={[4, 4, 0, 0]}
                    name="Rechazos"
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="acumulado" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="Acumulado"
                  />
                  <ReferenceLine 
                    yAxisId="right" 
                    y={80} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    label={{ value: '80%', position: 'right', fontSize: 10 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Los motivos sobre la línea 80% representan las causas principales
            </p>
          </CardContent>
        </Card>

        {/* Distribution by Category (Donut) */}
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={porCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="categoryLabel"
                    label={({ porcentaje }) => `${porcentaje.toFixed(0)}%`}
                    labelLine={false}
                  >
                    {porCategoria.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_CHART_COLORS[entry.categoryId] || 'hsl(0 0% 45%)'}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value} rechazos`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-[40%] space-y-2">
                {porCategoria.map((cat) => (
                  <div key={cat.categoryId} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_CHART_COLORS[cat.categoryId] || 'hsl(0 0% 45%)' }}
                    />
                    <span className="truncate flex-1">{cat.categoryLabel}</span>
                    <span className="font-medium">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="bg-background/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Evolución Temporal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendencia} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRechazos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAceptaciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'rechazos') return [value, 'Rechazos'];
                    if (name === 'aceptaciones') return [value, 'Aceptaciones'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="aceptaciones" 
                  stroke="hsl(142 71% 45%)" 
                  fillOpacity={1}
                  fill="url(#colorAceptaciones)"
                  name="Aceptaciones"
                />
                <Area 
                  type="monotone" 
                  dataKey="rechazos" 
                  stroke="hsl(var(--destructive))" 
                  fillOpacity={1}
                  fill="url(#colorRechazos)"
                  name="Rechazos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Rejections Table */}
      <Card className="bg-background/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Rechazos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {rechazosRecientes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay rechazos recientes para mostrar
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Custodio</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Tiempo Resp.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rechazosRecientes.slice(0, 10).map((rechazo) => (
                  <TableRow key={rechazo.id}>
                    <TableCell className="text-sm">
                      {format(rechazo.fecha, 'dd MMM yy', { locale: es })}
                    </TableCell>
                    <TableCell className="font-medium">{rechazo.custodioNombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {rechazo.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {rechazo.motivo}
                    </TableCell>
                    <TableCell className="text-right">
                      {rechazo.tiempoRespuesta === null || rechazo.tiempoRespuesta === undefined
                        ? '-'
                        : rechazo.tiempoRespuesta === 0 
                          ? '< 1 min' 
                          : `${rechazo.tiempoRespuesta} min`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
