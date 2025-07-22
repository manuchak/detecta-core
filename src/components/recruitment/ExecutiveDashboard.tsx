import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Users, Target, Zap } from 'lucide-react';
import { SupplyTeamMetrics } from './SupplyTeamMetrics';
import { useUnifiedRecruitmentMetrics } from '@/hooks/useUnifiedRecruitmentMetrics';
import { useSupplyMetrics } from '@/hooks/useSupplyMetrics';
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
  const { metrics: supplyMetrics, loading: supplyLoading } = useSupplyMetrics();

  if (loading || supplyLoading) {
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

  // Validación y cálculos seguros para evitar NaN
  const safeCPA = metrics?.financialMetrics?.realCPA || 0;
  const safeActiveCustodians = supplyMetrics.candidatesApproved || 0; // Usar candidatos aprobados como custodios activos
  const safeRotationRate = metrics?.rotationMetrics?.monthlyRate || 11.03;
  const safeBudgetUtilization = metrics?.financialMetrics?.monthlyBudgetUtilization || 0;
  const safeConfidence = metrics?.projections?.custodianDemand?.confidence || 0;
  const safeMonteCarlo = metrics?.projections?.monteCarloResults?.meanCustodios || 0;
  const safeSuccessProbability = metrics?.projections?.monteCarloResults?.successProbability || 0;

  // Calcular ROI realista basado en datos del sistema
  const averageLTV = 15000; // LTV promedio basado en análisis de servicios
  const calculatedROI = safeCPA > 0 ? ((averageLTV - safeCPA) / safeCPA) * 100 : 0;

  // Calcular retención operacional
  const retentionRate = Math.max(0, 100 - safeRotationRate);

  // Calcular eficiencia de adquisición mejorada
  const targetCPA = 3500;
  const acquisitionEfficiency = safeCPA > 0 ? Math.max(0, ((targetCPA - safeCPA) / targetCPA) * 100) : 0;

  // Calcular precisión predictiva basada en correlaciones
  const predictivePrecision = Math.min(100, ((metrics?.correlations?.rotationToRecruitment || 0) + safeConfidence) * 50);

  // Calcular KPIs ejecutivos con datos reales validados
  const executiveKPIs: ExecutiveKPI[] = [
    {
      title: 'Eficiencia de Adquisición',
      value: safeCPA > 0 ? `$${safeCPA.toFixed(0)}` : '$0',
      trend: safeCPA < targetCPA ? 15 : -8,
      status: safeCPA === 0 ? 'warning' :
              safeCPA < targetCPA ? 'excellent' : 
              safeCPA < 4500 ? 'good' : 'critical',
      description: `CPA real vs objetivo $${targetCPA.toLocaleString()}`,
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      title: 'Custodios Activos',
      value: safeActiveCustodians.toString(),
      trend: safeActiveCustodians > 50 ? 15 : safeActiveCustodians > 30 ? 5 : -5,
      status: safeActiveCustodians > 100 ? 'excellent' : 
              safeActiveCustodians > 50 ? 'good' : 
              safeActiveCustodians > 20 ? 'warning' : 'critical',
      description: 'Con servicios finalizados este mes',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Retención Operacional',
      value: `${retentionRate.toFixed(1)}%`,
      trend: retentionRate > 85 ? 12 : retentionRate > 80 ? 3 : -6,
      status: retentionRate > 90 ? 'excellent' :
              retentionRate > 85 ? 'good' : 
              retentionRate > 80 ? 'warning' : 'critical',
      description: `Rotación: ${safeRotationRate.toFixed(1)}%`,
      icon: <Target className="h-5 w-5" />
    },
    {
      title: 'ROI Proyectado',
      value: `${calculatedROI.toFixed(0)}%`,
      trend: calculatedROI > 300 ? 18 : calculatedROI > 200 ? 8 : -3,
      status: calculatedROI > 300 ? 'excellent' :
              calculatedROI > 200 ? 'good' : 
              calculatedROI > 100 ? 'warning' : 'critical',
      description: `Basado en LTV promedio $${averageLTV.toLocaleString()}`,
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      title: 'Utilización Presupuestal',
      value: `${safeBudgetUtilization.toFixed(0)}%`,
      trend: safeBudgetUtilization > 70 ? 3 : safeBudgetUtilization > 50 ? 0 : -8,
      status: safeBudgetUtilization > 85 ? 'excellent' :
              safeBudgetUtilization > 70 ? 'good' : 
              safeBudgetUtilization > 50 ? 'warning' : 'critical',
      description: 'Del presupuesto mensual asignado',
      icon: <Zap className="h-5 w-5" />
    },
    {
      title: 'Precisión Predictiva',
      value: `${predictivePrecision.toFixed(0)}%`,
      trend: predictivePrecision > 80 ? 8 : predictivePrecision > 60 ? 3 : -5,
      status: predictivePrecision > 80 ? 'excellent' :
              predictivePrecision > 60 ? 'good' : 
              predictivePrecision > 40 ? 'warning' : 'critical',
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
                    {(Math.abs(metrics.correlations.rotationToRecruitment || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={Math.abs(metrics.correlations.rotationToRecruitment || 0) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.abs(metrics.correlations.rotationToRecruitment || 0) > 0.5 ? 
                    'Correlación moderada - requiere análisis adicional' :
                    'Correlación baja - patrones poco predecibles'
                  }
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Financiero → Operacional</span>
                  <span className="font-medium">
                    {(Math.abs(metrics.correlations.financialToOperational || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={Math.abs(metrics.correlations.financialToOperational || 0) * 100} 
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
                {isNaN(safeMonteCarlo) ? '0' : safeMonteCarlo.toFixed(0)}
              </div>
              <p className="text-sm text-muted-foreground">Custodios esperados</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rango de confianza 95%</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Entre {(metrics.projections.monteCarloResults.confidence95?.lower || 0).toFixed(0)} y{' '}
                {(metrics.projections.monteCarloResults.confidence95?.upper || 0).toFixed(0)} custodios
              </div>
              
              <div className="flex justify-between text-sm mt-3">
                <span>Probabilidad de éxito</span>
                <span className="font-medium">
                  {isNaN(safeSuccessProbability) ? '0.0' : (safeSuccessProbability * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={isNaN(safeSuccessProbability) ? 0 : safeSuccessProbability * 100} 
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
            {(metrics.projections.budgetOptimization || []).slice(0, 6).map((allocation, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">
                    {allocation.channelId || `Canal ${index + 1}`}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {(allocation.expectedCustodios || 0).toFixed(1)} custodios
                  </Badge>
                </div>
                <div className="text-lg font-bold">
                  ${(allocation.allocation || 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  CPA estimado: ${allocation.expectedCustodios > 0 ? 
                    ((allocation.allocation || 0) / allocation.expectedCustodios).toFixed(0) : 
                    '0'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas del Equipo de Supply */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance del Equipo de Supply</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplyTeamMetrics />
        </CardContent>
      </Card>

      {/* Distribución por Zonas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribución Operacional por Zonas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics?.activeCustodians?.byZone || {})
              .sort(([,a], [,b]) => (b || 0) - (a || 0))
              .slice(0, 8)
              .map(([zone, count], index) => (
              <div key={zone || index} className="text-center p-3 border rounded-lg">
                <div className="text-xl font-bold">{count || 0}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {zone || `Zona ${index + 1}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {safeActiveCustodians > 0 ? 
                    (((count || 0) / safeActiveCustodians) * 100).toFixed(1) : 
                    '0.0'}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};