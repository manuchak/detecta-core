// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Phone, PhoneCall, PhoneMissed, Clock, Users, TrendingUp } from 'lucide-react';
import { useCallCenterMetrics } from '@/hooks/useCallCenterMetrics';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';

interface CallOutcome {
  outcome: string;
  count: number;
  percentage: number;
}

export const ContactabilityDashboard = () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  const { metrics, isLoading: metricsLoading } = useCallCenterMetrics({
    dateFrom: thirtyDaysAgo,
    dateTo: today,
    enabled: true
  });

  const { data: callOutcomes, isLoading: outcomesLoading } = useAuthenticatedQuery(
    ['call-outcomes', thirtyDaysAgo, today],
    async () => {
      const { data, error } = await supabase
        .from('manual_call_logs')
        .select('call_outcome')
        .gte('created_at', thirtyDaysAgo)
        .lte('created_at', today + 'T23:59:59');

      if (error) throw error;

      const outcomeMap = new Map<string, number>();
      const total = data?.length || 0;

      data?.forEach(call => {
        const outcome = call.call_outcome || 'unknown';
        outcomeMap.set(outcome, (outcomeMap.get(outcome) || 0) + 1);
      });

      const outcomes: CallOutcome[] = Array.from(outcomeMap.entries())
        .map(([outcome, count]) => ({
          outcome,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      return { outcomes, total };
    }
  );

  const { data: hourlyData } = useAuthenticatedQuery(
    ['hourly-success-rate', thirtyDaysAgo, today],
    async () => {
      const { data, error } = await supabase
        .from('manual_call_logs')
        .select('created_at, call_outcome')
        .gte('created_at', thirtyDaysAgo)
        .lte('created_at', today + 'T23:59:59');

      if (error) throw error;

      const hourlyStats = new Map<number, { total: number; successful: number }>();

      data?.forEach(call => {
        const hour = new Date(call.created_at).getHours();
        const stats = hourlyStats.get(hour) || { total: 0, successful: 0 };
        stats.total++;
        if (call.call_outcome === 'successful') {
          stats.successful++;
        }
        hourlyStats.set(hour, stats);
      });

      const hourlyArray = Array.from(hourlyStats.entries())
        .map(([hour, stats]) => ({
          hour,
          total: stats.total,
          successful: stats.successful,
          successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0
        }))
        .sort((a, b) => a.hour - b.hour);

      return hourlyArray;
    }
  );

  const isLoading = metricsLoading || outcomesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'successful': return 'bg-green-500';
      case 'no_answer': return 'bg-yellow-500';
      case 'busy': return 'bg-orange-500';
      case 'reschedule_requested': return 'bg-blue-500';
      case 'not_interested': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getOutcomeLabel = (outcome: string) => {
    const labels: Record<string, string> = {
      'successful': 'Exitosa',
      'no_answer': 'Sin respuesta',
      'busy': 'Ocupado',
      'reschedule_requested': 'Reagendar',
      'not_interested': 'No interesado',
      'wrong_number': 'Número incorrecto',
      'unknown': 'Sin clasificar'
    };
    return labels[outcome] || outcome;
  };

  const bestHour = hourlyData?.reduce((best, current) => 
    current.successRate > best.successRate ? current : best
  );

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <PhoneCall className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Contactabilidad</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-green-600">{metrics.contactabilidad}%</p>
              <Badge variant="secondary" className="text-xs">
                30 días
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Llamadas/Día</span>
            </div>
            <p className="text-2xl font-bold">{metrics.llamadasPromedioDia}</p>
            <p className="text-xs text-muted-foreground">Promedio diario</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Agentes Activos</span>
            </div>
            <p className="text-2xl font-bold">{metrics.agentesActivos}</p>
            <p className="text-xs text-muted-foreground">Último mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Mejor Horario</span>
            </div>
            <p className="text-2xl font-bold">
              {bestHour ? `${bestHour.hour}:00h` : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">
              {bestHour ? `${bestHour.successRate}% éxito` : 'Sin datos'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Call Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneMissed className="h-5 w-5" />
              Resultado de Llamadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {callOutcomes?.outcomes.map((outcome) => (
                <div key={outcome.outcome} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getOutcomeColor(outcome.outcome)}`} />
                    <span className="text-sm">{getOutcomeLabel(outcome.outcome)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{outcome.count}</span>
                    <Badge variant="outline" className="text-xs">
                      {outcome.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
              
              {callOutcomes?.total && (
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-sm font-bold">{callOutcomes.total} llamadas</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Success Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tasa de Éxito por Hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hourlyData?.map((hour) => (
                <div key={hour.hour} className="flex items-center justify-between">
                  <span className="text-sm w-16">
                    {hour.hour.toString().padStart(2, '0')}:00h
                  </span>
                  <div className="flex-1 mx-3">
                    <Progress value={hour.successRate} max={100} />
                  </div>
                  <div className="text-right w-20">
                    <span className="text-sm font-medium">{hour.successRate}%</span>
                    <p className="text-xs text-muted-foreground">({hour.total})</p>
                  </div>
                </div>
              ))}
              
              {(!hourlyData || hourlyData.length === 0) && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay datos de horarios disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Quality Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🎯 Optimización</h4>
              <p className="text-sm text-muted-foreground">
                {bestHour 
                  ? `Las ${bestHour.hour}:00h tienen la mejor tasa de éxito (${bestHour.successRate}%)`
                  : 'Insuficientes datos para optimización horaria'
                }
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">📊 Performance</h4>
              <p className="text-sm text-muted-foreground">
                Contactabilidad del {metrics.contactabilidad}% con {metrics.contactosEfectivosDia} contactos efectivos/día
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">👥 Cobertura</h4>
              <p className="text-sm text-muted-foreground">
                {metrics.agentesActivos} agentes contactaron {metrics.leadsUnicosContactados} leads únicos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};