import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, ReferenceLine, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Target, Activity, 
  AlertTriangle, CheckCircle, AlertCircle, ArrowRight, Info
} from 'lucide-react';
import { useServiceCapacity } from '@/hooks/useServiceCapacity';

export function MonthlyCapacityDetailView() {
  const { capacityData, loading } = useServiceCapacity();
  
  const calculations = useMemo(() => {
    if (!capacityData) return null;
    
    const availabilityRate = (capacityData.availableCustodians / capacityData.activeCustodians) * 100;
    const gapVsForecast = capacityData.monthlyCapacity.total - capacityData.forecastMesActual;
    const utilizacionActual = capacityData.utilizationMetrics.current;
    
    const chartData = [{
      name: 'Mes Actual',
      capacidad: capacityData.monthlyCapacity.total,
      forecast: capacityData.forecastMesActual,
      proyeccion: Math.round(capacityData.monthlyCapacity.total * (utilizacionActual / 100))
    }];
    
    const pieData = [
      { name: 'Local', value: capacityData.monthlyCapacity.local, color: '#4F9EF8' },
      { name: 'Regional', value: capacityData.monthlyCapacity.regional, color: '#10B981' },
      { name: 'Foráneo', value: capacityData.monthlyCapacity.foraneo, color: '#A855F7' }
    ];
    
    const comparisonData = [
      {
        name: 'Diaria',
        local: capacityData.dailyCapacity.local,
        regional: capacityData.dailyCapacity.regional,
        foraneo: capacityData.dailyCapacity.foraneo
      },
      {
        name: 'Mensual (÷22)',
        local: Math.round(capacityData.monthlyCapacity.local / 22),
        regional: Math.round(capacityData.monthlyCapacity.regional / 22),
        foraneo: Math.round(capacityData.monthlyCapacity.foraneo / 22)
      }
    ];
    
    return {
      availabilityRate,
      gapVsForecast,
      utilizacionActual,
      chartData,
      pieData,
      comparisonData
    };
  }, [capacityData]);
  
  if (loading || !capacityData || !calculations) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              Cargando datos de capacidad...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-warning" />;
      default: return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };
  
  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'critical': return 'border-l-destructive bg-destructive/5';
      case 'warning': return 'border-l-warning bg-warning/5';
      default: return 'border-l-success bg-success/5';
    }
  };
  
  const getAlertLabel = (type: string) => {
    switch (type) {
      case 'critical': return 'Crítico';
      case 'warning': return 'Advertencia';
      default: return 'Saludable';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-4">
        {/* Card 1: Capacidad Total Mensual */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Capacidad Total Mensual
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-lg md:text-2xl font-bold text-foreground">
                {capacityData.monthlyCapacity.total.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                servicios / 22 días laborables
              </p>
            </div>
            <Badge variant={capacityData.alerts.type === 'healthy' ? 'default' : 'destructive'} className="mt-3 w-fit">
              {getAlertLabel(capacityData.alerts.type)}
            </Badge>
          </CardContent>
        </Card>

        {/* Card 2: Utilización Actual */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Utilización Actual
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <div className="text-lg md:text-2xl font-bold text-foreground">
                  {capacityData.utilizationMetrics.current.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  vs {capacityData.utilizationMetrics.healthy}% objetivo
                </div>
              </div>
              <Progress 
                value={capacityData.utilizationMetrics.current} 
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {capacityData.utilizationMetrics.current <= 75 ? '✓ Óptima' :
               capacityData.utilizationMetrics.current <= 85 ? '⚠ Alta' :
               '🚨 Crítica'}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Custodios Disponibles */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Custodios Disponibles
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <div className="text-lg md:text-2xl font-bold text-foreground">
                  {capacityData.availableCustodians}
                </div>
                <div className="text-xs text-muted-foreground">
                  de {capacityData.activeCustodians}
                </div>
              </div>
              <Progress 
                value={calculations.availabilityRate} 
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {calculations.availabilityRate.toFixed(0)}% disponibilidad
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Gap vs Forecast */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gap vs Forecast
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <div className={`text-2xl font-bold ${calculations.gapVsForecast >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {calculations.gapVsForecast >= 0 ? '+' : ''}{calculations.gapVsForecast.toLocaleString()}
                </div>
                {calculations.gapVsForecast >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {calculations.gapVsForecast >= 0 ? 'Capacidad extra' : 'Déficit de capacidad'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Utilización vs forecast: {capacityData.utilizacionVsForecast.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Card */}
      {capacityData.alerts && (
        <Card className={`border-l-4 ${getAlertStyles(capacityData.alerts.type)}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getAlertIcon(capacityData.alerts.type)}
              Estado Operacional: {getAlertLabel(capacityData.alerts.type)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground">{capacityData.alerts.message}</p>
            {capacityData.alerts.recommendations && capacityData.alerts.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Recomendaciones:</p>
                <ul className="space-y-1">
                  {capacityData.alerts.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2 text-muted-foreground">
                      <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Capacity vs Demand Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Capacidad vs Demanda</CardTitle>
          <CardDescription>Comparación de capacidad mensual, forecast y proyección actual</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={calculations.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="capacidad" fill="#4F9EF8" name="Capacidad Mensual" />
              <Bar dataKey="forecast" fill="#10B981" name="Forecast Mes" />
              <Line 
                type="monotone" 
                dataKey="proyeccion" 
                stroke="#A855F7" 
                strokeWidth={3}
                name="Proyección MTD"
              />
              {capacityData.forecastMesActual > capacityData.monthlyCapacity.total && (
                <ReferenceLine 
                  y={capacityData.monthlyCapacity.total} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                  label={{ value: 'Límite Capacidad', position: 'right' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Service Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo de Servicio</CardTitle>
            <CardDescription>Capacidad mensual total por categoría</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={calculations.pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {calculations.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Capacidad Diaria vs Mensual</CardTitle>
            <CardDescription>Comparación de capacidad promedio por día</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={calculations.comparisonData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar dataKey="local" stackId="a" fill="#4F9EF8" name="Local" />
                <Bar dataKey="regional" stackId="a" fill="#10B981" name="Regional" />
                <Bar dataKey="foraneo" stackId="a" fill="#A855F7" name="Foráneo" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Custodian Availability Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Disponibilidad de Custodios</CardTitle>
          <CardDescription>
            Estado actual de la flota: {capacityData.availableCustodians} de {capacityData.activeCustodians} disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gauge visual */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="hsl(var(--muted))"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke={
                        calculations.availabilityRate >= 75 ? '#10B981' : 
                        calculations.availabilityRate >= 60 ? '#F59E0B' : 
                        '#EF4444'
                      }
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${(calculations.availabilityRate / 100) * 439.6} 439.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-bold text-foreground">
                      {calculations.availabilityRate.toFixed(0)}%
                    </span>
                    <p className="text-xs text-muted-foreground">Disponibilidad</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {calculations.availabilityRate >= 75 ? '✓ Disponibilidad óptima' :
                   calculations.availabilityRate >= 60 ? '⚠ Disponibilidad moderada' :
                   '🚨 Disponibilidad crítica'}
                </p>
              </div>
            
            {/* Breakdown */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-foreground">Disponibles para asignación</span>
                  <span className="font-semibold text-foreground">{capacityData.availableCustodians}</span>
                </div>
                <Progress value={calculations.availabilityRate} className="h-3" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4F9EF8' }}></div>
                    Regresando de foráneo
                  </span>
                  <span className="font-semibold text-foreground">
                    {capacityData.unavailableCustodians.returningFromForeign}
                  </span>
                </div>
                <Progress 
                  value={(capacityData.unavailableCustodians.returningFromForeign / capacityData.activeCustodians) * 100} 
                  className="h-3"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                    En ruta actualmente
                  </span>
                  <span className="font-semibold text-foreground">
                    {capacityData.unavailableCustodians.currentlyOnRoute}
                  </span>
                </div>
                <Progress 
                  value={(capacityData.unavailableCustodians.currentlyOnRoute / capacityData.activeCustodians) * 100} 
                  className="h-3"
                />
              </div>
              
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">Total Activos</span>
                  <span className="font-bold text-foreground">{capacityData.activeCustodians}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Utilization Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Utilización Actual vs Saludable */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Utilización Actual</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-foreground">Actual: {capacityData.utilizationMetrics.current.toFixed(1)}%</span>
                <span className="text-muted-foreground">Objetivo: 75%</span>
              </div>
              <Progress 
                value={capacityData.utilizationMetrics.current} 
                className="h-3"
              />
              <p className="text-xs text-muted-foreground">
                {capacityData.utilizationMetrics.current <= 75 ? '✓ Operación saludable' :
                 capacityData.utilizationMetrics.current <= 85 ? '⚠ Operación en riesgo' :
                 '🚨 Riesgo de sobrecarga'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Forecast vs Capacidad */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Forecast vs Capacidad</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-foreground">Utilización: {capacityData.utilizacionVsForecast.toFixed(0)}%</span>
                <span className="text-muted-foreground">Forecast: {capacityData.forecastMesActual}</span>
              </div>
              <Progress 
                value={Math.min(capacityData.utilizacionVsForecast, 100)} 
                className="h-3"
              />
              <p className="text-xs text-muted-foreground">
                {capacityData.utilizacionVsForecast < 100 ? 
                  `${Math.round(100 - capacityData.utilizacionVsForecast)}% de margen disponible` :
                  `Déficit de ${Math.round(capacityData.utilizacionVsForecast - 100)}%`
                }
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Distribución de Capacidad */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Distribución de Capacidad</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4F9EF8' }}></div>
                  Local (60%)
                </span>
                <span className="font-semibold text-foreground">{capacityData.monthlyCapacity.local}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                  Regional (30%)
                </span>
                <span className="font-semibold text-foreground">{capacityData.monthlyCapacity.regional}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#A855F7' }}></div>
                  Foráneo (10%)
                </span>
                <span className="font-semibold text-foreground">{capacityData.monthlyCapacity.foraneo}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
