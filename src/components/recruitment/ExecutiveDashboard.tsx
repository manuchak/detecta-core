import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, AlertTriangle, Activity, Zap, Brain } from 'lucide-react';
import { useUnifiedRecruitmentMetrics } from '@/hooks/useUnifiedRecruitmentMetrics';
import { BudgetOptimization } from './BudgetOptimization';

export const ExecutiveDashboard = () => {
  const { metrics, loading } = useUnifiedRecruitmentMetrics();

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
    return ((ltv - realCPA) / realCPA) * 100;
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
      value: `$${realCPA.toLocaleString()}`,
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
          <TabsTrigger value="correlations">Correlaciones</TabsTrigger>
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
                <div className="text-4xl font-bold">${realCPA.toLocaleString()}</div>
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
                <div className="text-4xl font-bold">${ltv.toLocaleString()}</div>
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

        {/* Correlaciones */}
        <TabsContent value="correlations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Análisis de Correlaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Análisis de correlaciones entre diferentes métricas
              </p>
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
