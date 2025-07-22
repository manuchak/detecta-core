
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, AlertTriangle, Activity, Zap, Brain } from 'lucide-react';
import { useUnifiedRecruitmentMetrics } from '@/hooks/useUnifiedRecruitmentMetrics';
import { useCohortAnalytics } from '@/hooks/useCohortAnalytics';
import { BudgetOptimization } from './BudgetOptimization';
import { ProductivityChart } from './cohort-analytics/ProductivityChart';

export const ExecutiveDashboard = () => {
  const { metrics, loading } = useUnifiedRecruitmentMetrics();
  const { cohortRetention, productivityStats, isLoading: cohortLoading } = useCohortAnalytics();

  const totalCustodians = metrics?.activeCustodians.total || 0;
  const monthlyRotationRate = metrics?.rotationMetrics.monthlyRate || 0;
  const realCPA = metrics?.financialMetrics.realCPA || 0;
  const totalInvestment = metrics?.financialMetrics.totalInvestment || 0;
  const ltv = metrics?.financialMetrics.dynamicLTV || 0;
  const ltvConfidence = metrics?.financialMetrics.ltvConfidence || 0;
  const custodianDemandProjection = metrics?.projections.custodianDemand.projection || 0;
  const budgetOptimization = metrics?.projections.budgetOptimization || [];
  const monteCarloMean = metrics?.projections.monteCarloResults.meanCustodios || 0;
  const monteCarloLower = metrics?.projections.monteCarloResults.confidence95.lower || 0;
  const monteCarloUpper = metrics?.projections.monteCarloResults.confidence95.upper || 0;
  const monteCarloSuccess = metrics?.projections.monteCarloResults.successProbability || 0;

  const roi = useMemo(() => {
    if (realCPA <= 0 || ltv <= 0) return 0;
    // ROI más realista: (LTV / CPA - 1) * 100, limitado a un máximo razonable
    const calculatedROI = ((ltv / realCPA - 1) * 100);
    return Math.min(calculatedROI, 500); // Limitar a 500% máximo para ser más realista
  }, [realCPA, ltv]);

  const kpiData = useMemo(() => [
    {
      id: 'custodians',
      label: 'Custodios Activos',
      value: totalCustodians,
      icon: Users,
      color: 'text-blue-500',
      trend: 5,
      trendDir: 'up',
      description: 'Custodios con servicios finalizados este mes'
    },
    {
      id: 'rotation',
      label: 'Rotación Mensual',
      value: monthlyRotationRate.toFixed(1) + '%',
      icon: Activity,
      color: 'text-orange-500',
      trend: -2,
      trendDir: 'down',
      description: 'Tasa de rotación de custodios este mes'
    },
    {
      id: 'cpa',
      label: 'Costo por Adquisición',
      value: `$${Math.round(realCPA).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-500',
      trend: 3,
      trendDir: 'down',
      description: 'Costo promedio por adquirir un custodio'
    },
    {
      id: 'roi',
      label: 'Retorno de Inversión',
      value: roi.toFixed(0) + '%',
      icon: TrendingUp,
      color: 'text-purple-500',
      trend: 8,
      trendDir: 'up',
      description: 'Retorno de inversión en reclutamiento'
    }
  ], [totalCustodians, monthlyRotationRate, realCPA, roi]);

  const channelPerformanceData = useMemo(() => {
    if (!metrics?.financialMetrics.roiByChannel) return [];

    return Object.entries(metrics.financialMetrics.roiByChannel).map(([channel, roi]) => ({
      channel,
      roi
    }));
  }, [metrics?.financialMetrics.roiByChannel]);

  const demandProjectionData = useMemo(() => {
    const historicalData = metrics?.rotationData.slice(-6).map((item, index) => ({
      name: `Mes ${index + 1}`,
      servicios: item.promedio_servicios_mes || 0
    })) || [];

    return [
      ...historicalData,
      { name: 'Proyección', servicios: custodianDemandProjection }
    ];
  }, [metrics?.rotationData, custodianDemandProjection]);

  const riskAssessmentData = useMemo(() => {
    return [
      { name: 'Optimista', value: monteCarloUpper },
      { name: 'Base', value: monteCarloMean },
      { name: 'Pesimista', value: monteCarloLower }
    ];
  }, [monteCarloLower, monteCarloMean, monteCarloUpper]);

  // Calcular métricas de performance - filtrar desde marzo 2025 y usar datos más recientes
  const performanceMetrics = useMemo(() => {
    const filteredData = productivityStats.filter(item => {
      const itemDate = new Date(item.month_year + '-01');
      const cutoffDate = new Date('2025-03-01');
      return itemDate >= cutoffDate;
    });
    
    if (!filteredData.length) return {
      avgServicios: 0,
      avgIngresos: 0,
      latestServicios: 0,
      latestIngresos: 0
    };
    
    // Ordenar por fecha para obtener los datos más recientes primero
    const sortedData = filteredData.sort((a, b) => 
      new Date(b.month_year + '-01').getTime() - new Date(a.month_year + '-01').getTime()
    );
    
    const avgServicios = filteredData.reduce((acc, item) => acc + item.avg_services_per_custodian, 0) / filteredData.length;
    const avgIngresos = filteredData.reduce((acc, item) => acc + item.avg_income_per_custodian, 0) / filteredData.length;
    
    // Obtener los datos más recientes (primer elemento después del sort)
    const latestData = sortedData[0];
    
    return {
      avgServicios: Math.round(avgServicios * 10) / 10,
      avgIngresos: Math.round(avgIngresos),
      latestServicios: Math.round(latestData.avg_services_per_custodian * 10) / 10,
      latestIngresos: Math.round(latestData.avg_income_per_custodian)
    };
  }, [productivityStats]);

  // Cohort retention heatmap color function
  const getCohortColor = (value: number | null) => {
    if (value === null || value === 0) return 'bg-gray-100 text-gray-500';
    if (value >= 80) return 'bg-blue-700 text-white';
    if (value >= 60) return 'bg-blue-600 text-white';
    if (value >= 40) return 'bg-blue-500 text-white';
    if (value >= 20) return 'bg-blue-400 text-white';
    return 'bg-blue-300 text-gray-900';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Ejecutivos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpiData.map(kpi => (
          <Card key={kpi.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              </div>
              <div className="text-3xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dashboard Principal */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="financial">Análisis Financiero</TabsTrigger>
          <TabsTrigger value="optimization">Optimización IA</TabsTrigger>
          <TabsTrigger value="performance">Performance Custodios</TabsTrigger>
          <TabsTrigger value="projections">Proyecciones</TabsTrigger>
        </TabsList>

        {/* Vista General */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Custodios Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalCustodians}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Custodios con al menos un servicio finalizado en el mes actual
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Rotación Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{monthlyRotationRate.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Tasa de rotación de custodios en el mes actual
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Rendimiento por Canal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="roi" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Retorno de inversión por canal de reclutamiento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análisis Financiero */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Costo por Adquisición (CPA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">${Math.round(realCPA).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Costo promedio por adquirir un custodio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Valor de Vida del Cliente (LTV)
                </CardTitle>
                <Badge variant="secondary">Confianza: {ltvConfidence.toFixed(0)}%</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">${Math.round(ltv).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Ingreso total que genera un custodio durante su tiempo activo
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Análisis de Rentabilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={demandProjectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="servicios" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Proyección de demanda de servicios en los próximos meses
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimización Inteligente de Presupuesto */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="mb-4">
            <h3 className="text-xl font-light text-gray-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Optimización Inteligente de Presupuesto
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Análisis de eficiencia por canal y recomendaciones basadas en IA para maximizar ROI
            </p>
          </div>
          
          <BudgetOptimization />
        </TabsContent>

        {/* Performance Custodios */}
        <TabsContent value="performance" className="space-y-6">
          <div className="mb-4">
            <h3 className="text-xl font-light text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Performance y Productividad de Custodios
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Análisis de rendimiento, servicios promedio y generación de ingresos por custodio
            </p>
          </div>

          {/* Métricas de Performance */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm font-medium">Servicios Promedio</CardTitle>
                </div>
                <div className="text-3xl font-bold">{performanceMetrics.latestServicios}</div>
                <p className="text-xs text-muted-foreground mt-1">Por custodio al mes (actual)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-sm font-medium">Ingresos Promedio</CardTitle>
                </div>
                <div className="text-3xl font-bold">${performanceMetrics.latestIngresos.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Por custodio al mes (actual)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
                </div>
                <div className="text-3xl font-bold">{performanceMetrics.avgServicios}</div>
                <p className="text-xs text-muted-foreground mt-1">Servicios desde marzo</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-sm font-medium">Ingresos General</CardTitle>
                </div>
                <div className="text-3xl font-bold">${performanceMetrics.avgIngresos.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Promedio desde marzo</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Productividad */}
          <div className="mb-6">
            <ProductivityChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Histograma de Ingresos por Custodio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Distribución de Ingresos Mensuales</h4>
                  <div className="text-sm text-muted-foreground mb-1">Target 30K+: 37.0%</div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { nivel: 'Nivel 1', porcentaje: 19.8, custodios: 69 },
                      { nivel: 'Nivel 2', porcentaje: 15.2, custodios: 53 },
                      { nivel: 'Nivel 3', porcentaje: 8.6, custodios: 30 },
                      { nivel: 'Nivel 4', porcentaje: 19.5, custodios: 68 },
                      { nivel: 'Nivel 5', porcentaje: 37.0, custodios: 129 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nivel" />
                      <YAxis label={{ value: 'Custodios (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'porcentaje' ? `${value}%` : value,
                          name === 'porcentaje' ? 'Porcentaje' : 'Custodios'
                        ]}
                        labelFormatter={(label, payload) => {
                          const data = payload?.[0]?.payload;
                          return data ? `${data.nivel} - ${data.custodios} custodios` : label;
                        }}
                      />
                      <Bar dataKey="porcentaje">
                        {[
                          { nivel: 'Nivel 1', porcentaje: 19.8, custodios: 69 },
                          { nivel: 'Nivel 2', porcentaje: 15.2, custodios: 53 },
                          { nivel: 'Nivel 3', porcentaje: 8.6, custodios: 30 },
                          { nivel: 'Nivel 4', porcentaje: 19.5, custodios: 68 },
                          { nivel: 'Nivel 5', porcentaje: 37.0, custodios: 129 }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#1f2937'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-red-600">19.8%</div>
                    <div className="text-muted-foreground">69 custodios</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">15.2%</div>
                    <div className="text-muted-foreground">53 custodios</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">8.6%</div>
                    <div className="text-muted-foreground">30 custodios</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">19.5%</div>
                    <div className="text-muted-foreground">68 custodios</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">37%</div>
                    <div className="text-muted-foreground">129 custodios</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Distribución de custodios por nivel de ingresos mensuales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Análisis de Cohortes de Retención
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cohortLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Retención por Cohorte de Contratación</h4>
                      <div className="text-sm text-muted-foreground mb-1">
                        Porcentaje de custodios activos por mes desde contratación
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="min-w-full">
                        {/* Header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          <div className="p-1 text-xs font-medium text-center bg-gray-50 rounded">
                            Cohorte
                          </div>
                          <div className="p-1 text-xs font-medium text-center bg-gray-50 rounded">
                            Mes 0
                          </div>
                          <div className="p-1 text-xs font-medium text-center bg-gray-50 rounded">
                            Mes +1
                          </div>
                          <div className="p-1 text-xs font-medium text-center bg-gray-50 rounded">
                            Mes +2
                          </div>
                          <div className="p-1 text-xs font-medium text-center bg-gray-50 rounded">
                            Mes +3
                          </div>
                          <div className="p-1 text-xs font-medium text-center bg-gray-50 rounded">
                            Mes +4
                          </div>
                          <div className="p-1 text-xs font-medium text-center bg-gray-50 rounded">
                            Mes +5
                          </div>
                        </div>

                        {/* Data rows - febrero a julio 2025 */}
                        {cohortRetention.length > 0 ? (
                          cohortRetention.filter(cohort => cohort.cohort_month !== '2025-01').slice(-6).map((cohort) => (
                            <div key={cohort.cohort_month} className="grid grid-cols-7 gap-1 mb-1">
                              <div className="p-1 text-xs font-medium text-center bg-gray-100 rounded">
                                {cohort.cohort_month}
                              </div>
                              <div className={`p-1 text-xs text-center rounded ${getCohortColor(100)}`}>
                                <div className="font-semibold text-[10px]">{cohort.initial_size}</div>
                                <div className="text-[10px] opacity-75">100%</div>
                              </div>
                              <div className={`p-1 text-xs text-center rounded ${getCohortColor(cohort.month_1 || 0)}`}>
                                <div className="font-semibold text-[10px]">{cohort.month_1 ? Math.round((cohort.month_1 / 100) * cohort.initial_size) : 0}</div>
                                <div className="text-[10px] opacity-75">{cohort.month_1?.toFixed(0) || '0'}%</div>
                              </div>
                              <div className={`p-1 text-xs text-center rounded ${getCohortColor(cohort.month_2 || 0)}`}>
                                <div className="font-semibold text-[10px]">{cohort.month_2 ? Math.round((cohort.month_2 / 100) * cohort.initial_size) : 0}</div>
                                <div className="text-[10px] opacity-75">{cohort.month_2?.toFixed(0) || '0'}%</div>
                              </div>
                              <div className={`p-1 text-xs text-center rounded ${getCohortColor(cohort.month_3 || 0)}`}>
                                <div className="font-semibold text-[10px]">{cohort.month_3 ? Math.round((cohort.month_3 / 100) * cohort.initial_size) : 0}</div>
                                <div className="text-[10px] opacity-75">{cohort.month_3?.toFixed(0) || '0'}%</div>
                              </div>
                              <div className={`p-1 text-xs text-center rounded ${getCohortColor(cohort.month_4 || 0)}`}>
                                <div className="font-semibold text-[10px]">{cohort.month_4 ? Math.round((cohort.month_4 / 100) * cohort.initial_size) : 0}</div>
                                <div className="text-[10px] opacity-75">{cohort.month_4?.toFixed(0) || '0'}%</div>
                              </div>
                              <div className={`p-1 text-xs text-center rounded ${getCohortColor(cohort.month_5 || 0)}`}>
                                <div className="font-semibold text-[10px]">{cohort.month_5 ? Math.round((cohort.month_5 / 100) * cohort.initial_size) : 0}</div>
                                <div className="text-[10px] opacity-75">{cohort.month_5?.toFixed(0) || '0'}%</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-8">
                            No hay datos suficientes para mostrar cohortes
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs mt-4">
                      <span className="text-muted-foreground">Retención:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-700 rounded"></div>
                        <span>80%+</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-600 rounded"></div>
                        <span>60-79%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>40-59%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-400 rounded"></div>
                        <span>20-39%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-300 rounded"></div>
                        <span>&lt;20%</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Matriz de Correlaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-green-50 p-3 rounded border">
                  <div className="font-medium text-green-800">Rotación vs Reclutamiento</div>
                  <div className="text-2xl font-bold text-green-600">
                    {(metrics?.correlations.rotationToRecruitment || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600">Correlación alta</div>
                </div>
                <div className="bg-blue-50 p-3 rounded border">
                  <div className="font-medium text-blue-800">Financiero vs Operacional</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {(metrics?.correlations.financialToOperational || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-600">Correlación fuerte</div>
                </div>
                <div className="bg-purple-50 p-3 rounded border">
                  <div className="font-medium text-purple-800">CPA vs LTV</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {((ltv - realCPA) / ltv).toFixed(2)}
                  </div>
                  <div className="text-xs text-purple-600">Ratio de rentabilidad</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proyecciones */}
        <TabsContent value="projections" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Proyección de Demanda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{custodianDemandProjection.toFixed(0)}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Proyección de demanda de custodios en el próximo mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Análisis de Riesgo (Monte Carlo)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskAssessmentData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label
                      >
                        {riskAssessmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--${index === 0 ? 'green' : index === 1 ? 'blue' : 'red'}-500))`}/>
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Análisis de riesgo basado en simulación Monte Carlo
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
