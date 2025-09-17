// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle, Users, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFormatters } from '@/hooks/useFormatters';

interface CandidateAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'pipeline' | 'performance' | 'trend';
  title: string;
  description: string;
  value: number;
  threshold: number;
  actionRequired: string[];
  priority: number;
}

interface PipelineMetrics {
  totalCandidates: number;
  newLeadsWeek: number;
  conversionRate: number;
  pipelineHealth: number;
  criticalThresholds: {
    minNewLeadsWeek: number;
    minConversionRate: number;
    minPipelineHealth: number;
  };
}

export const SmartAlertsPanel = () => {
  const [alerts, setAlerts] = useState<CandidateAlert[]>([]);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { formatDate } = useFormatters();

  const fetchCandidateData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos de candidatos de los últimos 30 días
      const { data: candidatos, error } = await supabase
        .from('candidatos_custodios')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Calcular métricas
      const totalCandidates = candidatos?.length || 0;
      const newLeadsWeek = candidatos?.filter(c => 
        c.estado_proceso === 'lead' && new Date(c.created_at || '') >= oneWeekAgo
      ).length || 0;
      
      const activeStates = ['entrevista', 'documentacion', 'activo'];
      const leadsTotal = candidatos?.filter(c => c.estado_proceso === 'lead').length || 0;
      const convertedTotal = candidatos?.filter(c => activeStates.includes(c.estado_proceso || '')).length || 0;
      
      const conversionRate = leadsTotal > 0 ? (convertedTotal / leadsTotal) * 100 : 0;
      
      // Health score basado en actividad reciente y conversión
      const recentActivity = candidatos?.filter(c => 
        new Date(c.updated_at || c.created_at || '') >= oneWeekAgo
      ).length || 0;
      
      const pipelineHealth = Math.min(100, (recentActivity / Math.max(1, totalCandidates)) * 100 + conversionRate);

      const calculatedMetrics: PipelineMetrics = {
        totalCandidates,
        newLeadsWeek,
        conversionRate,
        pipelineHealth,
        criticalThresholds: {
          minNewLeadsWeek: 5,
          minConversionRate: 20,
          minPipelineHealth: 60
        }
      };

      setMetrics(calculatedMetrics);
      generateAlerts(calculatedMetrics, candidatos || []);
      
    } catch (error) {
      console.error('Error fetching candidate data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de candidatos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (metrics: PipelineMetrics, candidatos: any[]) => {
    const generatedAlerts: CandidateAlert[] = [];

    // Alerta crítica: Pipeline bajo
    if (metrics.newLeadsWeek < metrics.criticalThresholds.minNewLeadsWeek) {
      generatedAlerts.push({
        id: 'pipeline-low',
        type: 'critical',
        category: 'pipeline',
        title: 'Pipeline de Candidatos Bajo',
        description: `Solo ${metrics.newLeadsWeek} candidatos nuevos en los últimos 7 días. Riesgo de escasez futura.`,
        value: metrics.newLeadsWeek,
        threshold: metrics.criticalThresholds.minNewLeadsWeek,
        actionRequired: [
          'Incrementar inversión en canales de reclutamiento',
          'Activar campañas de referidos',
          'Revisar estrategia de marketing digital'
        ],
        priority: 9
      });
    }

    // Alerta de conversión baja
    if (metrics.conversionRate < metrics.criticalThresholds.minConversionRate) {
      generatedAlerts.push({
        id: 'conversion-low',
        type: 'warning',
        category: 'performance',
        title: 'Tasa de Conversión Baja',
        description: `Tasa de conversión actual: ${metrics.conversionRate.toFixed(1)}%. Por debajo del mínimo requerido.`,
        value: metrics.conversionRate,
        threshold: metrics.criticalThresholds.minConversionRate,
        actionRequired: [
          'Revisar proceso de calificación de leads',
          'Mejorar scripts de entrevistas',
          'Capacitar al equipo de reclutamiento'
        ],
        priority: 7
      });
    }

    // Alerta de salud del pipeline
    if (metrics.pipelineHealth < metrics.criticalThresholds.minPipelineHealth) {
      generatedAlerts.push({
        id: 'pipeline-health',
        type: 'warning',
        category: 'trend',
        title: 'Salud del Pipeline Comprometida',
        description: `Índice de salud: ${metrics.pipelineHealth.toFixed(1)}%. Actividad insuficiente en el pipeline.`,
        value: metrics.pipelineHealth,
        threshold: metrics.criticalThresholds.minPipelineHealth,
        actionRequired: [
          'Aumentar seguimiento a candidatos existentes',
          'Acelerar procesos de documentación',
          'Implementar recordatorios automáticos'
        ],
        priority: 6
      });
    }

    // Candidatos estancados en entrevista
    const candidatosEntrevista = candidatos.filter(c => c.estado_proceso === 'entrevista');
    const candidatosEstancados = candidatosEntrevista.filter(c => {
      const daysSinceUpdate = (Date.now() - new Date(c.updated_at || c.created_at || '').getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 5;
    });

    if (candidatosEstancados.length > 0) {
      generatedAlerts.push({
        id: 'stalled-interviews',
        type: 'warning',
        category: 'pipeline',
        title: 'Candidatos Estancados en Entrevista',
        description: `${candidatosEstancados.length} candidatos llevan más de 5 días en proceso de entrevista.`,
        value: candidatosEstancados.length,
        threshold: 0,
        actionRequired: [
          'Contactar candidatos pendientes',
          'Agendar entrevistas faltantes',
          'Revisar disponibilidad del equipo'
        ],
        priority: 5
      });
    }

    // Alerta positiva: Pipeline saludable
    if (metrics.newLeadsWeek >= metrics.criticalThresholds.minNewLeadsWeek * 1.5) {
      generatedAlerts.push({
        id: 'pipeline-strong',
        type: 'info',
        category: 'trend',
        title: 'Pipeline Robusto',
        description: `Excelente flujo: ${metrics.newLeadsWeek} nuevos candidatos esta semana. Mantener momentum.`,
        value: metrics.newLeadsWeek,
        threshold: metrics.criticalThresholds.minNewLeadsWeek,
        actionRequired: [
          'Mantener inversión actual en canales efectivos',
          'Documentar mejores prácticas',
          'Preparar escalamiento de capacidad'
        ],
        priority: 2
      });
    }

    setAlerts(generatedAlerts.sort((a, b) => b.priority - a.priority));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning': return <Clock className="w-4 h-4 text-warning" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-success" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'critical': return <Badge variant="destructive">Crítica</Badge>;
      case 'warning': return <Badge variant="secondary">Preventiva</Badge>;
      case 'info': return <Badge variant="default">Informativa</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pipeline': return <Users className="w-4 h-4" />;
      case 'performance': return <TrendingDown className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    fetchCandidateData();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchCandidateData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Analizando pipeline de candidatos...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas del Pipeline */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Candidatos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalCandidates}</div>
              <p className="text-xs text-muted-foreground">Últimos 30 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Leads Nuevos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.newLeadsWeek}</div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Conversión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Lead a Activo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Salud Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pipelineHealth.toFixed(0)}%</div>
              <Badge variant={metrics.pipelineHealth >= 70 ? 'default' : metrics.pipelineHealth >= 50 ? 'secondary' : 'destructive'}>
                {metrics.pipelineHealth >= 70 ? 'Excelente' : metrics.pipelineHealth >= 50 ? 'Buena' : 'Crítica'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sistema de Alertas */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Sistema de Alertas</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{alerts.length} Alertas Activas</Badge>
            <Button size="sm" variant="outline" onClick={fetchCandidateData}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center gap-1">
                    {getAlertIcon(alert.type)}
                    {getCategoryIcon(alert.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{alert.title}</h3>
                      {getAlertBadge(alert.type)}
                      <Badge variant="outline" className="text-xs">
                        Prioridad {alert.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                    
                    {alert.actionRequired && alert.actionRequired.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Acciones recomendadas:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {alert.actionRequired.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {alert.value}
                    {alert.category === 'performance' && '%'}
                  </div>
                  {alert.threshold > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Meta: {alert.threshold}{alert.category === 'performance' && '%'}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {alerts.length === 0 && (
            <Card className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pipeline Operando Normalmente</h3>
              <p className="text-muted-foreground">Todas las métricas están dentro de los rangos esperados</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};