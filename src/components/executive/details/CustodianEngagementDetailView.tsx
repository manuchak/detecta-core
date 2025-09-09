import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Area, AreaChart,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, TrendingUp, TrendingDown, Clock, AlertTriangle, 
  Heart, Activity, Target, BarChart3, Calendar, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Coffee
} from 'lucide-react';
import { useCustodianEngagement } from '@/hooks/useCustodianEngagement';

const RISK_COLORS = {
  saludable: '#22c55e',
  moderado: '#eab308', 
  alto: '#f97316',
  critico: '#ef4444'
};

const TREND_COLORS = {
  creciendo: '#22c55e',
  estable: '#6b7280',
  declinando: '#ef4444'
};

export function CustodianEngagementDetailView() {
  const { engagementData, loading, refreshData } = useCustodianEngagement();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30d' | '90d' | '6m'>('30d');
  const [sortBy, setSortBy] = useState<'engagement' | 'risk' | 'activity'>('engagement');

  const sortedCustodians = useMemo(() => {
    if (!engagementData?.metricas) return [];
    
    return [...engagementData.metricas].sort((a, b) => {
      switch (sortBy) {
        case 'engagement':
          return b.scoreEngagement - a.scoreEngagement;
        case 'risk':
          const riskOrder = { critico: 4, alto: 3, moderado: 2, saludable: 1 };
          return riskOrder[b.nivelRiesgo] - riskOrder[a.nivelRiesgo];
        case 'activity':
          return b.viajesUltimos30Dias - a.viajesUltimos30Dias;
        default:
          return 0;
      }
    });
  }, [engagementData?.metricas, sortBy]);

  const riskDistribution = useMemo(() => {
    if (!engagementData?.metricas) return [];
    
    const distribution = engagementData.metricas.reduce((acc, custodio) => {
      acc[custodio.nivelRiesgo] = (acc[custodio.nivelRiesgo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([nivel, cantidad]) => ({
      name: nivel,
      value: cantidad,
      color: RISK_COLORS[nivel as keyof typeof RISK_COLORS]
    }));
  }, [engagementData?.metricas]);

  const formatPercentage = (value: number) => {
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'saludable':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'moderado':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'alto':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'critico':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'creciendo':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declinando':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!engagementData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay datos de engagement disponibles</p>
      </div>
    );
  }

  const { metricas, tendenciaMensual, resumenGeneral } = engagementData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Engagement de Custodios</h1>
          <p className="text-muted-foreground">
            Análisis detallado del engagement y bienestar laboral
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Promedio</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumenGeneral.engagementPromedio}/100</div>
            <Progress value={resumenGeneral.engagementPromedio} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {resumenGeneral.engagementPromedio >= 75 ? 'Excelente' : 
               resumenGeneral.engagementPromedio >= 60 ? 'Bueno' : 
               resumenGeneral.engagementPromedio >= 40 ? 'Regular' : 'Crítico'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custodios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumenGeneral.custodiosTotal}</div>
            <p className="text-xs text-muted-foreground">
              {resumenGeneral.custodiosSaludables} saludables, {resumenGeneral.custodiosEnRiesgo} en riesgo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Promedio/Mes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumenGeneral.horasPromedioPorCustodio}h</div>
            <p className="text-xs text-muted-foreground">
              {resumenGeneral.horasPromedioPorCustodio > 200 ? 'Alto riesgo' : 
               resumenGeneral.horasPromedioPorCustodio > 160 ? 'Moderado' : 'Saludable'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nivel de Riesgo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((resumenGeneral.custodiosEnRiesgo / resumenGeneral.custodiosTotal) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {resumenGeneral.custodiosEnRiesgo} custodios requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tendencia y Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tendencia de Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={tendenciaMensual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="custodiosActivos" fill="#3b82f6" name="Custodios Activos" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="engagementPromedio" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Engagement Promedio"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Distribución de Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Recomendaciones de Bienestar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {resumenGeneral.recomendaciones.map((recomendacion, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{recomendacion}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs para vista detallada */}
      <Tabs defaultValue="custodians" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="custodians">Custodios Individuales</TabsTrigger>
          <TabsTrigger value="workload">Análisis de Carga</TabsTrigger>
          <TabsTrigger value="wellness">Indicadores de Bienestar</TabsTrigger>
        </TabsList>

        <TabsContent value="custodians" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={sortBy === 'engagement' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('engagement')}
            >
              Por Engagement
            </Button>
            <Button
              variant={sortBy === 'risk' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('risk')}
            >
              Por Riesgo
            </Button>
            <Button
              variant={sortBy === 'activity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('activity')}
            >
              Por Actividad
            </Button>
          </div>

          <div className="grid gap-4">
            {sortedCustodians.map((custodio) => (
              <Card key={custodio.custodioId}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-2">
                      <h3 className="font-semibold">{custodio.nombreCustodio}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getRiskIcon(custodio.nivelRiesgo)}
                        <Badge variant={custodio.nivelRiesgo === 'saludable' ? 'default' : 'destructive'}>
                          {custodio.nivelRiesgo}
                        </Badge>
                        {getTrendIcon(custodio.tendenciaEngagement)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold">{custodio.scoreEngagement}</div>
                      <div className="text-xs text-muted-foreground">Engagement</div>
                      <Progress value={custodio.scoreEngagement} className="mt-1" />
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold">{custodio.viajesUltimos30Dias}</div>
                      <div className="text-xs text-muted-foreground">Viajes (30d)</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold">{custodio.horasTrabajadasMes}h</div>
                      <div className="text-xs text-muted-foreground">Horas/mes</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold">${custodio.ingresoPromedioDiario.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Ingreso/día</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <div>Frecuencia app: {custodio.frecuenciaUsoApp}/día</div>
                    <div>Descanso: {custodio.horasDescansoPromedio}h promedio</div>
                    <div>Días activos: {custodio.diasTrabajadosSemana}/semana</div>
                    <div>Satisfacción: {custodio.satisfaccionEstimada}%</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Carga de Trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={tendenciaMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="viajesPromedioPorCustodio" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    name="Viajes promedio por custodio"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="custodiosEnRiesgo" 
                    stackId="2" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.3}
                    name="Custodios en riesgo"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wellness" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Distribución de Horas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['< 160h', '160-200h', '200-240h', '> 240h'].map((rango, index) => {
                    const counts = metricas.filter(m => {
                      if (index === 0) return m.horasTrabajadasMes < 160;
                      if (index === 1) return m.horasTrabajadasMes >= 160 && m.horasTrabajadasMes < 200;
                      if (index === 2) return m.horasTrabajadasMes >= 200 && m.horasTrabajadasMes < 240;
                      return m.horasTrabajadasMes >= 240;
                    }).length;
                    
                    return (
                      <div key={rango} className="flex justify-between items-center">
                        <span className="text-sm">{rango}</span>
                        <Badge variant={index > 2 ? 'destructive' : 'secondary'}>
                          {counts} custodios
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Niveles de Descanso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['< 8h', '8-12h', '12-24h', '> 24h'].map((rango, index) => {
                    const counts = metricas.filter(m => {
                      if (index === 0) return m.horasDescansoPromedio < 8;
                      if (index === 1) return m.horasDescansoPromedio >= 8 && m.horasDescansoPromedio < 12;
                      if (index === 2) return m.horasDescansoPromedio >= 12 && m.horasDescansoPromedio <= 24;
                      return m.horasDescansoPromedio > 24;
                    }).length;
                    
                    return (
                      <div key={rango} className="flex justify-between items-center">
                        <span className="text-sm">{rango}</span>
                        <Badge variant={index === 0 ? 'destructive' : 'secondary'}>
                          {counts} custodios
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Satisfacción Estimada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['< 40%', '40-60%', '60-80%', '> 80%'].map((rango, index) => {
                    const counts = metricas.filter(m => {
                      if (index === 0) return m.satisfaccionEstimada < 40;
                      if (index === 1) return m.satisfaccionEstimada >= 40 && m.satisfaccionEstimada < 60;
                      if (index === 2) return m.satisfaccionEstimada >= 60 && m.satisfaccionEstimada < 80;
                      return m.satisfaccionEstimada >= 80;
                    }).length;
                    
                    return (
                      <div key={rango} className="flex justify-between items-center">
                        <span className="text-sm">{rango}</span>
                        <Badge variant={index < 2 ? 'destructive' : 'default'}>
                          {counts} custodios
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}