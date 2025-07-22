import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, TrendingUp, DollarSign, Users, Clock } from 'lucide-react';
import { useUnifiedRecruitmentMetrics } from '@/hooks/useUnifiedRecruitmentMetrics';
import { RecruitmentMathEngine } from '@/lib/RecruitmentMathEngine';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'rotation' | 'financial' | 'operational' | 'prediction';
  title: string;
  description: string;
  value: number;
  threshold: number;
  trend: 'up' | 'down' | 'stable';
  correlation: number;
  suggestedActions: string[];
  priority: number;
  createdAt: Date;
}

export const IntelligentAlerts = () => {
  const { metrics, loading } = useUnifiedRecruitmentMetrics();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && metrics) {
      generateIntelligentAlerts();
    }
  }, [metrics, loading]);

  const generateIntelligentAlerts = () => {
    const newAlerts: Alert[] = [];

    // 1. Alertas de Rotación Correlacionada
    if (metrics.rotationMetrics.monthlyRate > 15) {
      newAlerts.push({
        id: 'rotation-high',
        type: 'critical',
        category: 'rotation',
        title: 'Rotación Crítica Detectada',
        description: `La rotación mensual del ${metrics.rotationMetrics.monthlyRate.toFixed(1)}% supera el umbral crítico`,
        value: metrics.rotationMetrics.monthlyRate,
        threshold: 15,
        trend: metrics.rotationMetrics.predictedNext30Days > metrics.rotationMetrics.monthlyRate ? 'up' : 'down',
        correlation: metrics.correlations.rotationToRecruitment,
        suggestedActions: [
          'Aumentar presupuesto de reclutamiento en 25%',
          'Activar canales de emergencia',
          'Revisar incentivos de retención',
          'Análisis de causas raíz por zona'
        ],
        priority: 1,
        createdAt: new Date()
      });
    }

    // 2. Alertas Financieras Inteligentes
    if (metrics.financialMetrics.realCPA > 0) {
      const expectedCPA = 3500; // Benchmark interno
      const cpaDeviation = ((metrics.financialMetrics.realCPA - expectedCPA) / expectedCPA) * 100;
      
      if (cpaDeviation > 20) {
        newAlerts.push({
          id: 'cpa-high',
          type: 'warning',
          category: 'financial',
          title: 'CPA Fuera de Rango Óptimo',
          description: `CPA real de $${metrics.financialMetrics.realCPA.toFixed(0)} está ${cpaDeviation.toFixed(1)}% por encima del objetivo`,
          value: metrics.financialMetrics.realCPA,
          threshold: expectedCPA,
          trend: 'up',
          correlation: metrics.correlations.financialToOperational,
          suggestedActions: [
            'Optimizar canales de bajo rendimiento',
            'Revisar targeting de campañas',
            'Evaluar procesos de conversión',
            'Análisis de embudo de reclutamiento'
          ],
          priority: 2,
          createdAt: new Date()
        });
      }
    }

    // 3. Alertas Predictivas basadas en Correlaciones
    if (metrics.correlations.rotationToRecruitment > 0.7) {
      const predictedDemand = metrics.projections.custodianDemand.projection;
      const currentActive = metrics.activeCustodians.total;
      const demandGap = predictedDemand - currentActive;

      if (demandGap > 10) {
        newAlerts.push({
          id: 'demand-prediction',
          type: 'info',
          category: 'prediction',
          title: 'Déficit de Custodios Proyectado',
          description: `Se proyecta una necesidad de ${Math.round(demandGap)} custodios adicionales basado en correlaciones históricas`,
          value: demandGap,
          threshold: 10,
          trend: 'up',
          correlation: metrics.correlations.rotationToRecruitment,
          suggestedActions: [
            'Acelerar procesos de reclutamiento',
            'Activar campañas proactivas',
            'Preparar presupuesto adicional',
            `Enfocar en zonas: ${Object.keys(metrics.activeCustodians.byZone).slice(0, 3).join(', ')}`
          ],
          priority: 3,
          createdAt: new Date()
        });
      }
    }

    // 4. Alertas de Eficiencia Operacional
    if (metrics.financialMetrics.monthlyBudgetUtilization < 70) {
      newAlerts.push({
        id: 'budget-underutilization',
        type: 'warning',
        category: 'operational',
        title: 'Subutilización de Presupuesto',
        description: `Solo se está utilizando el ${metrics.financialMetrics.monthlyBudgetUtilization.toFixed(1)}% del presupuesto asignado`,
        value: metrics.financialMetrics.monthlyBudgetUtilization,
        threshold: 70,
        trend: 'down',
        correlation: 0.6,
        suggestedActions: [
          'Redistribuir presupuesto a canales eficientes',
          'Acelerar campañas planificadas',
          'Explorar nuevos canales de adquisición',
          'Revisar procesos de aprobación'
        ],
        priority: 4,
        createdAt: new Date()
      });
    }

    // 5. Alertas de Monte Carlo - Riesgo de Escenarios
    if (metrics.projections.monteCarloResults.successProbability < 0.8) {
      newAlerts.push({
        id: 'montecarlo-risk',
        type: 'critical',
        category: 'prediction',
        title: 'Alto Riesgo en Simulación de Escenarios',
        description: `La probabilidad de éxito es solo del ${(metrics.projections.monteCarloResults.successProbability * 100).toFixed(1)}%`,
        value: metrics.projections.monteCarloResults.successProbability * 100,
        threshold: 80,
        trend: 'down',
        correlation: 0.85,
        suggestedActions: [
          'Revisar estrategia de reclutamiento',
          'Diversificar canales de adquisición',
          'Ajustar expectativas de timeline',
          'Implementar plan de contingencia'
        ],
        priority: 1,
        createdAt: new Date()
      });
    }

    // Ordenar por prioridad y filtrar alertas descartadas
    const filteredAlerts = newAlerts
      .filter(alert => !dismissedAlerts.has(alert.id))
      .sort((a, b) => a.priority - b.priority);

    setAlerts(filteredAlerts);
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getAlertIcon = (category: Alert['category']) => {
    switch (category) {
      case 'rotation': return <Users className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'operational': return <Clock className="h-4 w-4" />;
      case 'prediction': return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Analizando métricas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Alertas Inteligentes</h3>
        <Badge variant="outline">
          {alerts.length} alertas activas
        </Badge>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              No hay alertas críticas en este momento. Todas las métricas están dentro de rangos normales.
            </div>
          </CardContent>
        </Card>
      ) : (
        alerts.map((alert) => (
          <Card key={alert.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getAlertIcon(alert.category)}
                  <CardTitle className="text-base">{alert.title}</CardTitle>
                  <Badge variant={getAlertColor(alert.type)}>
                    {alert.type}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {alert.description}
              </p>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Valor Actual: </span>
                  {alert.value.toFixed(1)}{alert.category === 'financial' ? '' : '%'}
                </div>
                <div>
                  <span className="font-medium">Umbral: </span>
                  {alert.threshold.toFixed(1)}{alert.category === 'financial' ? '' : '%'}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Tendencia: </span>
                  {alert.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : alert.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-blue-500" />
                  ) : (
                    <span className="text-gray-500">Estable</span>
                  )}
                </div>
              </div>

              {alert.correlation > 0.5 && (
                <div className="text-xs text-muted-foreground">
                  <strong>Correlación detectada:</strong> {(alert.correlation * 100).toFixed(0)}% de relación con otras métricas
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Acciones Sugeridas:</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {alert.suggestedActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Generada: {alert.createdAt.toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};