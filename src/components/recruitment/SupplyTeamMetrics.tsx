import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, TrendingUp, Phone, CheckCircle, Target } from 'lucide-react';
import { useSupplyMetrics } from '@/hooks/useSupplyMetrics';

export const SupplyTeamMetrics = () => {
  const { metrics, loading, error } = useSupplyMetrics();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error cargando métricas del equipo de supply: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales del equipo de Supply */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                Hoy
              </Badge>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-sm">Leads Generados</h3>
              <div className="text-2xl font-bold">{metrics.leadsToday}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.leadsThisMonth} este mes
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                %
              </Badge>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-sm">Ratio de Contacto</h3>
              <div className="text-2xl font-bold">{metrics.contactRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.funnelMetrics.contacted} contactados
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                %
              </Badge>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-sm">Tasa de Conversión</h3>
              <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.candidatesApproved} aprobados
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                hrs
              </Badge>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-sm">Tiempo Promedio</h3>
              <div className="text-2xl font-bold">{metrics.avgTimeToContact.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Para primer contacto
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel de Adquisición */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funnel de Adquisición de Custodios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { stage: 'Leads', count: metrics.funnelMetrics.leads, color: 'bg-blue-500' },
              { stage: 'Contactados', count: metrics.funnelMetrics.contacted, color: 'bg-green-500' },
              { stage: 'Entrevistados', count: metrics.funnelMetrics.interviewed, color: 'bg-purple-500' },
              { stage: 'Aprobados', count: metrics.funnelMetrics.approved, color: 'bg-orange-500' },
              { stage: 'Onboarded', count: metrics.funnelMetrics.onboarded, color: 'bg-red-500' },
            ].map((stage, index) => {
              const percentage = metrics.funnelMetrics.leads > 0 
                ? (stage.count / metrics.funnelMetrics.leads) * 100 
                : 0;
              
              return (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stage.count}</span>
                      <span className="text-muted-foreground">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance por Analista */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance por Analista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.analystPerformance.map((analyst, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{analyst.name}</h4>
                  <Badge variant="outline">
                    {analyst.leadsManaged} leads
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Contacto</span>
                      <span className="font-medium">{analyst.contactRate}%</span>
                    </div>
                    <Progress value={analyst.contactRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Conversión</span>
                      <span className="font-medium">{analyst.conversionRate}%</span>
                    </div>
                    <Progress value={analyst.conversionRate} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estado del Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.activeCandidates}
            </div>
            <div className="text-sm text-muted-foreground">
              Candidatos Activos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {metrics.candidatesInProcess}
            </div>
            <div className="text-sm text-muted-foreground">
              En Proceso
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.candidatesApproved}
            </div>
            <div className="text-sm text-muted-foreground">
              Aprobados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {metrics.candidatesRejected}
            </div>
            <div className="text-sm text-muted-foreground">
              Rechazados
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};