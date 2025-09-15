import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVapiAnalytics } from "@/hooks/useVapiAnalytics";
import { 
  Bot, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  DollarSign,
  Phone,
  RefreshCw
} from "lucide-react";

export const VapiAnalyticsDashboard = () => {
  const { analytics, recentCalls, loading, error, refreshAnalytics } = useVapiAnalytics();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Analytics VAPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={refreshAnalytics} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const formatDuration = (minutes: number) => {
    return `${Math.round(minutes)}min`;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)} USD`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics VAPI</h2>
          <p className="text-muted-foreground">
            Métricas de entrevistas automatizadas con IA
          </p>
        </div>
        <Button onClick={refreshAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entrevistas</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalInterviews}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completedInterviews} completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Finalización</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.completedInterviews}/{analytics.totalInterviews} llamadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(analytics.averageDuration)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por entrevista completada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Promedio</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.averageScore.toFixed(1)}/10
            </div>
            <p className="text-xs text-muted-foreground">
              Evaluación de IA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Decision Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Decisiones</CardTitle>
            <CardDescription>
              Resultados automáticos de las entrevistas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Aprobados</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  {analytics.autoDecisionStats.approved}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({((analytics.autoDecisionStats.approved / analytics.totalInterviews) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Segunda Entrevista</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
                  {analytics.autoDecisionStats.secondInterview}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({((analytics.autoDecisionStats.secondInterview / analytics.totalInterviews) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Rechazados</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-red-50 text-red-700">
                  {analytics.autoDecisionStats.rejected}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({((analytics.autoDecisionStats.rejected / analytics.totalInterviews) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Métricas de Calidad</CardTitle>
            <CardDescription>
              Evaluaciones detalladas por IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Confianza Promedio</span>
              <Badge variant="outline">
                {analytics.qualityMetrics.averageConfidenceScore.toFixed(1)}/10
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Comunicación Promedio</span>
              <Badge variant="outline">
                {analytics.qualityMetrics.averageCommunicationScore.toFixed(1)}/10
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Red Flags Detectados</span>
              <Badge variant="destructive">
                {analytics.qualityMetrics.redFlagsDetected}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Costo Total</span>
              <Badge variant="outline">
                {formatCurrency(analytics.costAnalysis.totalCost)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Entrevistas Recientes</CardTitle>
          <CardDescription>
            Últimas 10 entrevistas realizadas con VAPI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentCalls.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay entrevistas recientes
            </p>
          ) : (
            <div className="space-y-2">
              {recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          call.auto_decision === 'aprobar' ? 'default' :
                          call.auto_decision === 'segunda_entrevista' ? 'secondary' :
                          call.auto_decision === 'rechazar' ? 'destructive' : 'outline'
                        }
                        className="text-xs"
                      >
                        {call.auto_decision === 'aprobar' ? 'Aprobado' :
                         call.auto_decision === 'segunda_entrevista' ? 'Segunda Entrevista' :
                         call.auto_decision === 'rechazar' ? 'Rechazado' : 'Procesando'}
                      </Badge>
                      <span className="text-sm font-medium">Lead: {call.lead_id}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(call.created_at).toLocaleString('es-ES')}
                      {call.duration_seconds && (
                        <span className="ml-2">
                          • Duración: {formatDuration(call.duration_seconds / 60)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {call.analysis_score && (
                      <div className="text-sm font-semibold">
                        {call.analysis_score.toFixed(1)}/10
                      </div>
                    )}
                    <Badge 
                      variant="outline" 
                      className={
                        call.call_status === 'completed' ? 'text-green-600' :
                        call.call_status === 'in-progress' ? 'text-blue-600' :
                        'text-gray-600'
                      }
                    >
                      {call.call_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};