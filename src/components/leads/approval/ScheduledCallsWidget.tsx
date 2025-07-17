import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Phone, User, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCallScheduling, ScheduledCall } from "@/hooks/useCallScheduling";
import { toast } from 'sonner';

export const ScheduledCallsWidget = () => {
  const { 
    isLoading, 
    scheduledCalls, 
    getTodaysScheduledCalls, 
    markCallAsCompleted, 
    cancelScheduledCall 
  } = useCallScheduling();
  
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  useEffect(() => {
    getTodaysScheduledCalls();
  }, [getTodaysScheduledCalls]);

  const handleMarkCompleted = async (call: ScheduledCall) => {
    try {
      await markCallAsCompleted(call.id);
      toast.success('Llamada marcada como completada');
    } catch (error) {
      toast.error('Error al marcar la llamada como completada');
    }
  };

  const handleCancel = async (call: ScheduledCall) => {
    try {
      await cancelScheduledCall(call.id);
      toast.success('Llamada cancelada');
    } catch (error) {
      toast.error('Error al cancelar la llamada');
    }
  };

  const getCallTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'entrevista':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reprogramada':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'seguimiento':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCallTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'reprogramada':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Phone className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Llamadas Programadas - Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando llamadas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Llamadas Programadas - Hoy
          </div>
          <Badge variant="outline" className="ml-2">
            {scheduledCalls.length} llamadas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scheduledCalls.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No hay llamadas programadas para hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledCalls.map((call) => (
              <div
                key={call.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className={getCallTypeColor(call.tipo_llamada)}
                      >
                        {getCallTypeIcon(call.tipo_llamada)}
                        {call.tipo_llamada === 'entrevista' ? 'Entrevista' :
                         call.tipo_llamada === 'reprogramada' ? 'Reprogramada' :
                         'Seguimiento'}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(call.fecha_programada), 'HH:mm')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {/* @ts-ignore - La relación con leads traerá el nombre */}
                        {call.leads?.nombre || 'Candidato'}
                      </span>
                    </div>

                    {call.motivo_reprogramacion && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        {call.motivo_reprogramacion}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkCompleted(call)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Completar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancel(call)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};