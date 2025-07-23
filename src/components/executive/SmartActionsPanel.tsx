import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useExecutiveDashboardKPIs } from '@/hooks/useExecutiveDashboardKPIs';

export function SmartActionsPanel() {
  const { kpis } = useExecutiveDashboardKPIs();

  const alerts = [
    {
      id: 1,
      type: 'warning',
      icon: AlertTriangle,
      title: 'CPA por encima del objetivo',
      description: `CPA actual: $${kpis.cpa.toLocaleString()} vs objetivo: $4,500`,
      priority: 'high',
      action: 'Optimizar canales de adquisición'
    },
    {
      id: 2,
      type: 'success',
      icon: TrendingUp,
      title: 'ROI MKT superando expectativas',
      description: `ROI actual: ${kpis.roiMkt}% vs objetivo: 15%`,
      priority: 'low',
      action: 'Incrementar presupuesto en canales rentables'
    },
    {
      id: 3,
      type: 'info',
      icon: Users,
      title: 'Engagement por debajo del target',
      description: `Promedio: ${kpis.engagement} servicios/mes vs objetivo: 10`,
      priority: 'medium',
      action: 'Implementar programa de incentivos'
    }
  ];

  const recommendations = [
    {
      title: 'Optimización de Presupuesto',
      description: 'Redistribuir 20% del presupuesto de canales con bajo ROI hacia canales de alto rendimiento',
      impact: 'Potencial aumento del 15% en ROI general',
      timeframe: '2 semanas'
    },
    {
      title: 'Programa de Retención',
      description: 'Implementar sistema de alertas tempranas para custodios en riesgo de rotación',
      impact: 'Reducción proyectada del 25% en rotación',
      timeframe: '1 mes'
    },
    {
      title: 'Automatización de Onboarding',
      description: 'Digitalizar proceso de incorporación para reducir tiempo y mejorar experiencia',
      impact: 'Reducción del tiempo de onboarding a 3 días',
      timeframe: '6 semanas'
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'success': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'info': return <Users className="h-4 w-4 text-blue-600" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Alertas Inteligentes */}
      <Card className="p-6 shadow-apple">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Alertas Inteligentes</h3>
            <Badge variant="outline" className="text-xs">
              {alerts.length} activas
            </Badge>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="border border-border/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                      <Badge className={`text-xs ${getPriorityColor(alert.priority)}`}>
                        {alert.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  {alert.action}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recomendaciones */}
      <Card className="p-6 shadow-apple">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Recomendaciones</h3>
            <Badge variant="outline" className="text-xs">
              IA-Powered
            </Badge>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-border/50 rounded-lg p-4 space-y-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">{rec.title}</h4>
                  <p className="text-xs text-muted-foreground">{rec.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Impacto: </span>
                    <span className="font-medium text-green-600">{rec.impact}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tiempo: </span>
                    <span className="font-medium">{rec.timeframe}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="flex-1 text-xs">
                    Implementar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs">
                    Ver detalles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}