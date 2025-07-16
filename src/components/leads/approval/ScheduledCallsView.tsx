import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Phone, User, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { es } from "date-fns/locale";

interface ScheduledCall {
  id: string;
  lead_id: string;
  scheduled_datetime: string;
  call_notes?: string;
  // Lead information from join
  lead_nombre?: string;
  lead_telefono?: string;
  lead_email?: string;
}

export const ScheduledCallsView = () => {
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchScheduledCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_call_logs')
        .select(`
          id,
          lead_id,
          scheduled_datetime,
          call_notes
        `)
        .not('scheduled_datetime', 'is', null)
        .gte('scheduled_datetime', new Date().toISOString())
        .is('call_outcome', null)
        .order('scheduled_datetime', { ascending: true });

      if (error) throw error;
      setScheduledCalls(data || []);
    } catch (error) {
      console.error('Error fetching scheduled calls:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las llamadas programadas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledCalls();
  }, []);

  const getPriorityBadge = (datetime: string) => {
    const date = new Date(datetime);
    
    if (isToday(date)) {
      return <Badge variant="destructive">Hoy</Badge>;
    } else if (isTomorrow(date)) {
      return <Badge variant="default">Mañana</Badge>;
    } else if (isThisWeek(date)) {
      return <Badge variant="secondary">Esta semana</Badge>;
    } else {
      return <Badge variant="outline">Próxima</Badge>;
    }
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: format(date, "EEE dd/MM", { locale: es }),
      time: format(date, "HH:mm")
    };
  };

  const markAsCompleted = async (callId: string) => {
    try {
      // Here we would typically open the CallLogDialog to record the actual call outcome
      toast({
        title: "Funcionalidad pendiente",
        description: "Aquí se abriría el diálogo para registrar el resultado de la llamada",
        variant: "default"
      });
    } catch (error) {
      console.error('Error marking call as completed:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Llamadas Programadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Llamadas Programadas
          </div>
          <Badge variant="outline" className="ml-auto">
            {scheduledCalls.length} pendientes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scheduledCalls.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay llamadas programadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledCalls.map((call) => {
              const { date, time } = formatDateTime(call.scheduled_datetime);
              
              return (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getPriorityBadge(call.scheduled_datetime)}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{date} • {time}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Lead ID: {call.lead_id}</p>
                        {call.call_notes && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {call.call_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => markAsCompleted(call.id)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Llamar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};