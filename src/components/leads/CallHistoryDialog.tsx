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
import { Play, Pause, Volume2, Download, Calendar, Clock, Phone } from "lucide-react";
import { VapiCallLog } from "@/types/vapiTypes";

interface CallHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  callLogs: VapiCallLog[];
}

export const CallHistoryDialog = ({ open, onOpenChange, lead, callLogs }: CallHistoryDialogProps) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ended':
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">En progreso</Badge>;
      case 'queued':
        return <Badge className="bg-yellow-100 text-yellow-800">En cola</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Fallida</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const toggleAudio = (callId: string, audioUrl: string) => {
    if (playingAudio === callId) {
      setPlayingAudio(null);
      // Aquí podrías pausar el audio real
    } else {
      setPlayingAudio(callId);
      // Aquí podrías reproducir el audio real
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

        <div className="space-y-4">
          {callLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay llamadas registradas para este candidato.</p>
            </div>
          ) : (
            callLogs.map((call) => (
              <Card key={call.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">
                        Llamada {call.vapi_call_id || call.id}
                      </CardTitle>
                      {getStatusBadge(call.call_status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(call.created_at)}
                    </div>
                  </div>
                  <CardDescription>
                    Número: {call.phone_number}
                    {call.duration_seconds && (
                      <span className="ml-4 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Duración: {formatDuration(call.duration_seconds)}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Audio Controls */}
                  {call.recording_url && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAudio(call.id, call.recording_url!)}
                      >
                        {playingAudio === call.id ? (
                          <Pause className="h-4 w-4 mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        {playingAudio === call.id ? 'Pausar' : 'Reproducir'}
                      </Button>
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Grabación disponible</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(call.recording_url!, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  )}

                  {/* Summary */}
                  {call.summary && (
                    <div>
                      <h4 className="font-medium mb-2">Resumen de la llamada</h4>
                      <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                        {call.summary}
                      </p>
                    </div>
                  )}

                  {/* Analysis */}
                  {call.analysis && (
                    <div>
                      <h4 className="font-medium mb-2">Análisis de respuestas</h4>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <pre className="text-sm text-green-800 whitespace-pre-wrap">
                          {JSON.stringify(call.analysis, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Transcript */}
                  {call.transcript && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Transcripción</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedTranscript(
                            expandedTranscript === call.id ? null : call.id
                          )}
                        >
                          {expandedTranscript === call.id ? 'Contraer' : 'Expandir'}
                        </Button>
                      </div>
                      <div className={`bg-gray-50 p-3 rounded-lg ${
                        expandedTranscript === call.id ? '' : 'max-h-32 overflow-hidden'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">
                          {call.transcript}
                        </p>
                        {expandedTranscript !== call.id && call.transcript.length > 200 && (
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Call Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {call.started_at && (
                      <div>
                        <span className="font-medium">Iniciada:</span>
                        <p className="text-muted-foreground">{formatDate(call.started_at)}</p>
                      </div>
                    )}
                    {call.ended_at && (
                      <div>
                        <span className="font-medium">Finalizada:</span>
                        <p className="text-muted-foreground">{formatDate(call.ended_at)}</p>
                      </div>
                    )}
                    {call.cost_usd && (
                      <div>
                        <span className="font-medium">Costo:</span>
                        <p className="text-muted-foreground">${call.cost_usd} USD</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
