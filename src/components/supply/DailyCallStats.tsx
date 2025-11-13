import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Phone, CheckCircle, XCircle, Clock, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CallStats {
  totalCallsToday: number;
  successfulCalls: number;
  noAnswerCalls: number;
  rescheduleRequested: number;
  otherOutcomes: number;
  pendingLeads: number;
  activeExecutives: number;
}

export const DailyCallStats = () => {
  const [stats, setStats] = useState<CallStats>({
    totalCallsToday: 0,
    successfulCalls: 0,
    noAnswerCalls: 0,
    rescheduleRequested: 0,
    otherOutcomes: 0,
    pendingLeads: 0,
    activeExecutives: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchCallStats();
    
    // Actualizar cada 2 minutos
    const interval = setInterval(() => {
      fetchCallStats();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const fetchCallStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Obtener llamadas del día
      const { data: callsData, error: callsError } = await supabase
        .from('manual_call_logs')
        .select('call_outcome, created_by')
        .gte('created_at', todayISO);

      if (callsError) throw callsError;

      // Obtener leads pendientes (sin analista asignado)
      const { count: pendingCount, error: pendingError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .is('asignado_a', null);

      if (pendingError) throw pendingError;

      // Calcular estadísticas
      const totalCalls = callsData?.length || 0;
      const successful = callsData?.filter(c => c.call_outcome === 'successful').length || 0;
      const noAnswer = callsData?.filter(c => c.call_outcome === 'no_answer').length || 0;
      const reschedule = callsData?.filter(c => c.call_outcome === 'reschedule_requested').length || 0;
      const other = totalCalls - successful - noAnswer - reschedule;
      
      // Contar ejecutivos únicos activos hoy
      const uniqueExecutives = new Set(callsData?.map(c => c.created_by) || []).size;

      setStats({
        totalCallsToday: totalCalls,
        successfulCalls: successful,
        noAnswerCalls: noAnswer,
        rescheduleRequested: reschedule,
        otherOutcomes: other,
        pendingLeads: pendingCount || 0,
        activeExecutives: uniqueExecutives
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching call stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Métricas de Llamadas - Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Cargando métricas...
          </div>
        </CardContent>
      </Card>
    );
  }

  const successRate = stats.totalCallsToday > 0 
    ? ((stats.successfulCalls / stats.totalCallsToday) * 100).toFixed(1)
    : '0';

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Métricas de Llamadas - {format(new Date(), "d 'de' MMMM", { locale: es })}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Actualizado {format(lastUpdate, 'HH:mm')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total de llamadas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              Total Llamadas
            </div>
            <div className="text-3xl font-bold text-foreground">
              {stats.totalCallsToday}
            </div>
          </div>

          {/* Llamadas exitosas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              Exitosas
            </div>
            <div className="text-3xl font-bold text-success">
              {stats.successfulCalls}
            </div>
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {successRate}% tasa éxito
            </Badge>
          </div>

          {/* No contestó */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4" />
              No Contestó
            </div>
            <div className="text-3xl font-bold text-warning">
              {stats.noAnswerCalls}
            </div>
          </div>

          {/* Reprogramadas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Reprogramadas
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.rescheduleRequested}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            {/* Leads pendientes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Leads Pendientes
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats.pendingLeads}
              </div>
              <p className="text-xs text-muted-foreground">
                Sin analista asignado
              </p>
            </div>

            {/* Ejecutivos activos */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Ejecutivos Activos
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats.activeExecutives}
              </div>
              <p className="text-xs text-muted-foreground">
                Realizando llamadas hoy
              </p>
            </div>
          </div>
        </div>

        {/* Otros resultados */}
        {stats.otherOutcomes > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Otros resultados</span>
              <Badge variant="secondary">{stats.otherOutcomes}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
