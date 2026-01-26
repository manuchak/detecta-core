import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, DollarSign, TrendingUp, Route } from 'lucide-react';
import { useProfileEconomics } from '../../hooks/useProfileEconomics';
import { usePoolBenchmarks } from '../../hooks/usePoolBenchmarks';
import { useArmadoEconomics } from '../../hooks/useArmadoEconomics';
import { EarningsSummaryCard } from './economics/EarningsSummaryCard';
import { UnitEconomicsCard } from './economics/UnitEconomicsCard';
import { EarningsTrendChart } from './economics/EarningsTrendChart';
import { ServiceBreakdownCard } from './economics/ServiceBreakdownCard';
import { PoolRankingCard } from './economics/PoolRankingCard';
import { MonthlyBreakdownTable } from './economics/MonthlyBreakdownTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface EconomicsTabProps {
  nombre: string;
  tipo: 'custodio' | 'armado';
}

export function EconomicsTab({ nombre, tipo }: EconomicsTabProps) {
  const { data: economics, isLoading: loadingEconomics, error: errorEconomics } = useProfileEconomics(nombre);
  const { data: benchmarks, isLoading: loadingBenchmarks } = usePoolBenchmarks(nombre);
  const { data: armadoEconomics, isLoading: loadingArmado, error: errorArmado } = useArmadoEconomics(
    tipo === 'armado' ? nombre : undefined
  );

  // Armado economics view
  if (tipo === 'armado') {
    if (loadingArmado) {
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

    if (errorArmado || !armadoEconomics) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar datos económicos: {errorArmado?.message || 'Datos no disponibles'}
          </AlertDescription>
        </Alert>
      );
    }

    if (armadoEconomics.serviciosTotales === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay datos económicos disponibles para este armado. Los datos se mostrarán una vez que complete servicios.
          </AlertDescription>
        </Alert>
      );
    }

    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);

    return (
      <div className="space-y-6">
        {/* Activity period */}
        {armadoEconomics.primerServicio && armadoEconomics.ultimoServicio && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Activo desde {format(new Date(armadoEconomics.primerServicio), "d 'de' MMMM yyyy", { locale: es })}
              {' · '}
              Último servicio: {format(new Date(armadoEconomics.ultimoServicio), "d 'de' MMMM yyyy", { locale: es })}
              {' · '}
              {armadoEconomics.diasActivo} días de trayectoria
            </span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Costo Total Estimado</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(armadoEconomics.costoTotalEstimado)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {armadoEconomics.serviciosTotales} servicios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Route className="h-4 w-4" />
                <span className="text-xs">KM Totales</span>
              </div>
              <p className="text-2xl font-bold">{armadoEconomics.kmTotales.toLocaleString('es-MX')} km</p>
              <p className="text-xs text-muted-foreground mt-1">
                Promedio: {(armadoEconomics.kmTotales / armadoEconomics.serviciosTotales).toFixed(0)} km/servicio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Tarifa Promedio</span>
              </div>
              <p className="text-2xl font-bold">${armadoEconomics.tarifaPromedioKm.toFixed(2)}/km</p>
              <p className="text-xs text-muted-foreground mt-1">
                Modelo escalonado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Costo/Servicio</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(armadoEconomics.costoPromedioServicio)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Promedio por servicio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Distribution by KM range */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por Rango de KM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {armadoEconomics.distribucionPorRango.map((rango) => (
                <div key={rango.rango} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium">{rango.rango}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{rango.servicios} servicios</span>
                      <span className="font-mono">${rango.tarifaAplicada.toFixed(1)}/km</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${rango.porcentaje}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm">
                    {formatCurrency(rango.costoTotal)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Modelo de tarifas:</strong> $6.0/km (0-100km) → $5.5/km (101-250km) → $5.0/km (251-400km) → $4.6/km (+400km)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendencia Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={armadoEconomics.tendenciaMensual}>
                  <defs>
                    <linearGradient id="colorCostoArmado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="mesLabel" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'costoEstimado' ? formatCurrency(value) : value,
                      name === 'costoEstimado' ? 'Costo' : name === 'servicios' ? 'Servicios' : 'KM'
                    ]}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="costoEstimado"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorCostoArmado)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Monthly table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Mes</th>
                    <th className="text-right py-2">Servicios</th>
                    <th className="text-right py-2">KM</th>
                    <th className="text-right py-2">Costo Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {armadoEconomics.tendenciaMensual.map((mes) => (
                    <tr key={mes.mes} className="border-b border-muted/50">
                      <td className="py-2">{mes.mesLabel}</td>
                      <td className="text-right py-2">{mes.servicios}</td>
                      <td className="text-right py-2">{mes.kmTotales.toLocaleString('es-MX')}</td>
                      <td className="text-right py-2 font-mono">{formatCurrency(mes.costoEstimado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Custodio economics view (existing logic)
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
