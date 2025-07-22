import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Brain, TrendingUp, Target, Lightbulb, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedRecruitmentMetrics } from '@/hooks/useUnifiedRecruitmentMetrics';

interface AIInsight {
  id: string;
  category: 'strategic' | 'tactical' | 'operational' | 'predictive';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number;
  recommendations: string[];
  dataPoints: string[];
  projectedImpact: {
    financial: number;
    operational: number;
    timeline: string;
  };
  riskFactors: string[];
  timestamp: string;
  source: string;
  model: string;
}

interface AIAnalysisResult {
  insights: AIInsight[];
  summary: {
    overallHealth: 'excellent' | 'good' | 'concerning' | 'critical';
    topPriorities: string[];
    predictedTrends: {
      rotation: 'increasing' | 'stable' | 'decreasing';
      demand: 'increasing' | 'stable' | 'decreasing';
      efficiency: 'improving' | 'stable' | 'declining';
    };
  };
  metadata: {
    analysisType: string;
    processedAt: string;
    dataQuality: string;
    model: string;
  };
}

export const AIInsightsPanel = () => {
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const { toast } = useToast();
  const { metrics, loading: metricsLoading } = useUnifiedRecruitmentMetrics();

  const runAIAnalysis = async () => {
    if (!metrics || metricsLoading) {
      toast({
        title: "Datos no disponibles",
        description: "Esperando a que se carguen las métricas del sistema",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🤖 Iniciando análisis AI con datos:', metrics);

      const { data, error } = await supabase.functions.invoke('ai-recruitment-analysis', {
        body: {
          data: metrics,
          analysisType: 'comprehensive'
        }
      });

      if (error) throw error;

      console.log('✅ Análisis AI completado:', data);

      setAnalysisResult(data);
      setAiInsights(data.insights || []);
      setLastAnalysis(new Date());

      toast({
        title: "Análisis AI Completado",
        description: `Se generaron ${data.insights?.length || 0} insights inteligentes`,
      });

    } catch (error) {
      console.error('❌ Error en análisis AI:', error);
      toast({
        title: "Error en análisis AI",
        description: error.message || "No se pudo completar el análisis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-run analysis when metrics are ready
  useEffect(() => {
    if (metrics && !metricsLoading && !lastAnalysis) {
      runAIAnalysis();
    }
  }, [metrics, metricsLoading]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Target className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strategic': return '🎯';
      case 'tactical': return '⚡';
      case 'operational': return '🔧';
      case 'predictive': return '🔮';
      default: return '💡';
    }
  };

  const getHealthStatusColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'concerning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const groupedInsights = aiInsights.reduce((acc, insight) => {
    if (!acc[insight.category]) acc[insight.category] = [];
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, AIInsight[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Análisis AI de Reclutamiento</h2>
        </div>
        <Button 
          onClick={runAIAnalysis}
          disabled={loading || metricsLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analizando...' : 'Actualizar Análisis'}
        </Button>
      </div>

      {/* Status Summary */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Estado General del Sistema</span>
              <Badge variant="outline" className={getHealthStatusColor(analysisResult.summary.overallHealth)}>
                {analysisResult.summary.overallHealth.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Prioridades Principales</h4>
                <ul className="text-sm space-y-1">
                  {analysisResult.summary.topPriorities.map((priority, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{priority}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Tendencias Predichas</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Rotación:</span>
                    <Badge variant="outline">
                      {analysisResult.summary.predictedTrends.rotation}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Demanda:</span>
                    <Badge variant="outline">
                      {analysisResult.summary.predictedTrends.demand}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Eficiencia:</span>
                    <Badge variant="outline">
                      {analysisResult.summary.predictedTrends.efficiency}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Metadata del Análisis</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Modelo: {analysisResult.metadata.model}</div>
                  <div>Calidad: {analysisResult.metadata.dataQuality}</div>
                  <div>Procesado: {new Date(analysisResult.metadata.processedAt).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todos ({aiInsights.length})</TabsTrigger>
            <TabsTrigger value="strategic">Estratégicos</TabsTrigger>
            <TabsTrigger value="tactical">Tácticos</TabsTrigger>
            <TabsTrigger value="operational">Operacionales</TabsTrigger>
            <TabsTrigger value="predictive">Predictivos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {aiInsights
              .sort((a, b) => {
                const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              })
              .map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
          </TabsContent>

          {Object.entries(groupedInsights).map(([category, insights]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg">Generando insights con IA...</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-muted-foreground text-center">
                Analizando patrones de rotación, eficiencia financiera y demanda operacional
              </div>
              <Progress value={85} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && aiInsights.length === 0 && !metricsLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay análisis disponible</h3>
            <p className="text-muted-foreground mb-4">
              Ejecuta un análisis AI para obtener insights inteligentes sobre tus métricas de reclutamiento
            </p>
            <Button onClick={runAIAnalysis} disabled={metricsLoading}>
              Generar Análisis AI
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const InsightCard = ({ insight }: { insight: AIInsight }) => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Target className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strategic': return '🎯';
      case 'tactical': return '⚡';
      case 'operational': return '🔧';
      case 'predictive': return '🔮';
      default: return '💡';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getCategoryIcon(insight.category)}</span>
            <CardTitle className="text-base">{insight.title}</CardTitle>
            <Badge variant={getPriorityColor(insight.priority)}>
              {getPriorityIcon(insight.priority)}
              {insight.priority}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Confianza: {Math.round(insight.confidence * 100)}%
            </Badge>
            <Progress value={insight.confidence * 100} className="w-16 h-2" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {insight.description}
        </p>

        {/* Projected Impact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(insight.projectedImpact.financial)}
            </div>
            <div className="text-xs text-muted-foreground">Impacto Financiero</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {insight.projectedImpact.operational}%
            </div>
            <div className="text-xs text-muted-foreground">Mejora Operacional</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {insight.projectedImpact.timeline}
            </div>
            <div className="text-xs text-muted-foreground">Timeline</div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="text-sm font-medium mb-2">Recomendaciones:</h4>
          <ul className="space-y-1">
            {insight.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-500 mt-1">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Factors */}
        {insight.riskFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Factores de Riesgo:</h4>
            <ul className="space-y-1">
              {insight.riskFactors.map((risk, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 mt-1">⚠</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Data Points */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          <strong>Datos de soporte:</strong> {insight.dataPoints.join(' • ')}
        </div>
      </CardContent>
    </Card>
  );
};