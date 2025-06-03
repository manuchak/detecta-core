
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Bot, Clock, Phone } from "lucide-react";

interface CallHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  callLogs: any[];
}

export const CallHistoryDialog = ({ open, onOpenChange, lead, callLogs }: CallHistoryDialogProps) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-MX');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'queued': { color: 'bg-yellow-100 text-yellow-800', label: 'En cola' },
      'ringing': { color: 'bg-blue-100 text-blue-800', label: 'Sonando' },
      'in-progress': { color: 'bg-green-100 text-green-800', label: 'En progreso' },
      'ended': { color: 'bg-gray-100 text-gray-800', label: 'Finalizada' },
      'failed': { color: 'bg-red-100 text-red-800', label: 'Fallida' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.queued;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const toggleAudio = (callId: string, audioUrl: string) => {
    if (playingAudio === callId) {
      setPlayingAudio(null);
      // Pause audio logic here
    } else {
      setPlayingAudio(callId);
      // Play audio logic here
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Historial de Llamadas - {lead?.lead_nombre}
          </DialogTitle>
        </DialogHeader>

        {callLogs.length === 0 ? (
          <div className="text-center py-10">
            <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No hay llamadas registradas para este candidato</p>
          </div>
        ) : (
          <div className="space-y-4">
            {callLogs.map((call) => (
              <Card key={call.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Llamada VAPI
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(call.call_status)}
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(call.duration_seconds)}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {formatDate(call.started_at)} - {call.phone_number}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="summary">
                    <TabsList>
                      <TabsTrigger value="summary">Resumen</TabsTrigger>
                      <TabsTrigger value="transcript">Transcripción</TabsTrigger>
                      <TabsTrigger value="analysis">Análisis</TabsTrigger>
                      {call.recording_url && (
                        <TabsTrigger value="audio">Audio</TabsTrigger>
                      )}
                    </TabsList>
                    
                    <TabsContent value="summary" className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Inicio:</strong> {formatDate(call.started_at)}
                        </div>
                        <div>
                          <strong>Fin:</strong> {formatDate(call.ended_at)}
                        </div>
                        <div>
                          <strong>Duración:</strong> {formatDuration(call.duration_seconds)}
                        </div>
                        <div>
                          <strong>Costo:</strong> ${call.cost_usd || 'N/A'} USD
                        </div>
                      </div>
                      
                      {call.summary && (
                        <div>
                          <strong>Resumen:</strong>
                          <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                            {call.summary}
                          </p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="transcript">
                      {call.transcript ? (
                        <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {call.transcript}
                        </div>
                      ) : (
                        <p className="text-gray-500">No hay transcripción disponible</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="analysis">
                      {call.analysis ? (
                        <div className="space-y-3">
                          <pre className="p-3 bg-gray-50 rounded-lg text-sm overflow-x-auto">
                            {JSON.stringify(call.analysis, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-gray-500">No hay análisis disponible</p>
                      )}
                    </TabsContent>
                    
                    {call.recording_url && (
                      <TabsContent value="audio">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleAudio(call.id, call.recording_url)}
                            >
                              {playingAudio === call.id ? (
                                <Pause className="h-4 w-4 mr-2" />
                              ) : (
                                <Play className="h-4 w-4 mr-2" />
                              )}
                              {playingAudio === call.id ? 'Pausar' : 'Reproducir'}
                            </Button>
                            
                            <a
                              href={call.recording_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Descargar audio
                            </a>
                          </div>
                          
                          <audio
                            controls
                            className="w-full"
                            src={call.recording_url}
                          >
                            Tu navegador no soporta el elemento de audio.
                          </audio>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
