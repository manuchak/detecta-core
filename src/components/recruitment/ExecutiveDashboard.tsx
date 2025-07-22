import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Users, Target, Zap } from 'lucide-react';
import { useUnifiedRecruitmentMetrics } from '@/hooks/useUnifiedRecruitmentMetrics';
import { RecruitmentMathEngine } from '@/lib/RecruitmentMathEngine';

interface ExecutiveKPI {
  title: string;
  value: string;
  trend: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
  icon: React.ReactNode;
}

export const ExecutiveDashboard = () => {
  const { metrics, loading } = useUnifiedRecruitmentMetrics();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calcular KPIs ejecutivos con correlaciones reales
  const executiveKPIs: ExecutiveKPI[] = [
    {
      title: 'Eficiencia de Adquisición',
      value: `$${metrics.financialMetrics.realCPA.toFixed(0)}`,
      trend: metrics.financialMetrics.realCPA < 3500 ? 15 : -8,
      status: metrics.financialMetrics.realCPA < 3500 ? 'excellent' : 
              metrics.financialMetrics.realCPA < 4500 ? 'good' : 'warning',
      description: `CPA real vs objetivo $3,500`,
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      title: 'Custodios Activos',
      value: metrics.activeCustodians.total.toString(),
      trend: metrics.activeCustodians.growthRate || 5,
      status: metrics.activeCustodians.total > 100 ? 'excellent' : 
              metrics.activeCustodians.total > 80 ? 'good' : 'warning',
      description: 'Con servicios finalizados este mes',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Retención Operacional',
      value: `${(100 - metrics.rotationMetrics.monthlyRate).toFixed(1)}%`,
      trend: metrics.rotationMetrics.monthlyRate < 10 ? 12 : -6,
      status: metrics.rotationMetrics.monthlyRate < 10 ? 'excellent' :
              metrics.rotationMetrics.monthlyRate < 15 ? 'good' : 'critical',
      description: `Rotación: ${metrics.rotationMetrics.monthlyRate.toFixed(1)}%`,
      icon: <Target className="h-5 w-5" />
    },
    {
      title: 'ROI Proyectado',
      value: `${(metrics.financialMetrics.realCPA > 0 ? (15000 / metrics.financialMetrics.realCPA - 1) * 100 : 0).toFixed(0)}%`,
      trend: 18,
      status: (15000 / metrics.financialMetrics.realCPA - 1) * 100 > 300 ? 'excellent' :
              (15000 / metrics.financialMetrics.realCPA - 1) * 100 > 200 ? 'good' : 'warning',
      description: 'Basado en LTV promedio $15,000',
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      title: 'Utilización Presupuestal',
      value: `${metrics.financialMetrics.monthlyBudgetUtilization.toFixed(0)}%`,
      trend: 3,
      status: metrics.financialMetrics.monthlyBudgetUtilization > 85 ? 'excellent' :
              metrics.financialMetrics.monthlyBudgetUtilization > 70 ? 'good' : 'warning',
      description: 'Del presupuesto mensual asignado',
      icon: <Zap className="h-5 w-5" />
    },
    {
      title: 'Precisión Predictiva',
      value: `${(metrics.projections.custodianDemand.confidence * 100).toFixed(0)}%`,
      trend: 8,
      status: metrics.projections.custodianDemand.confidence > 0.8 ? 'excellent' :
              metrics.projections.custodianDemand.confidence > 0.6 ? 'good' : 'warning',
      description: 'Confianza en proyecciones de demanda',
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];

  const getStatusColor = (status: ExecutiveKPI['status']) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
    }
  };

  const getStatusTextColor = (status: ExecutiveKPI['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs Ejecutivos Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {executiveKPIs.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${getStatusColor(kpi.status)}/10`}>
                  <div className={getStatusTextColor(kpi.status)}>
                    {kpi.icon}
                  </div>
                </div>
                <div className="flex items-center text-xs">
                  {kpi.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={kpi.trend > 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(kpi.trend)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium text-sm">{kpi.title}</h3>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Análisis de Correlaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Correlaciones Estratégicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Rotación → Reclutamiento</span>
                  <span className="font-medium">
                    {(metrics.correlations.rotationToRecruitment * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={Math.abs(metrics.correlations.rotationToRecruitment) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.correlations.rotationToRecruitment > 0.7 ? 
                    'Correlación muy fuerte - predictibilidad alta' :
                    'Correlación moderada - requiere análisis adicional'
                  }
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Financiero → Operacional</span>
                  <span className="font-medium">
                    {(metrics.correlations.financialToOperational * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={metrics.correlations.financialToOperational * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alineación entre inversión y resultados operacionales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Simulación Monte Carlo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {metrics.projections.monteCarloResults.meanCustodios.toFixed(0)}
              </div>
              <p className="text-sm text-muted-foreground">Custodios esperados</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rango de confianza 95%</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Entre {metrics.projections.monteCarloResults.confidence95.lower.toFixed(0)} y{' '}
                {metrics.projections.monteCarloResults.confidence95.upper.toFixed(0)} custodios
              </div>
              
              <div className="flex justify-between text-sm mt-3">
                <span>Probabilidad de éxito</span>
                <span className="font-medium">
                  {(metrics.projections.monteCarloResults.successProbability * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={metrics.projections.monteCarloResults.successProbability * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimización de Presupuesto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Optimización Inteligente de Presupuesto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.projections.budgetOptimization.slice(0, 6).map((allocation, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">Canal {allocation.channelId}</h4>
                  <Badge variant="outline" className="text-xs">
                    {allocation.expectedCustodios.toFixed(1)} custodios
                  </Badge>
                </div>
                <div className="text-lg font-bold">
                  ${allocation.allocation.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  CPA estimado: ${(allocation.allocation / allocation.expectedCustodios).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribución por Zonas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribución Operacional por Zonas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics.activeCustodians.byZone)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([zone, count]) => (
              <div key={zone} className="text-center p-3 border rounded-lg">
                <div className="text-xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {zone || 'Sin zona'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {((count / metrics.activeCustodians.total) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};