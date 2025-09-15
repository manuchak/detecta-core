import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Play,
  FileText,
  Phone
} from "lucide-react";
import { useState } from "react";

interface VapiResultsViewerProps {
  vapiCallData: {
    id: string;
    call_status: string;
    duration_seconds: number | null;
    transcript: string | null;
    summary: string | null;
    analysis_score: number | null;
    auto_decision: string | null;
    recommendation: string | null;
    structured_data: any;
    recording_url: string | null;
    red_flags: string[];
    created_at: string;
    ended_at: string | null;
  };
}

export const VapiResultsViewer = ({ vapiCallData }: VapiResultsViewerProps) => {
  const [showTranscript, setShowTranscript] = useState(false);

  if (!vapiCallData) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No hay datos de entrevista VAPI disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDecisionBadge = (decision: string | null) => {
    switch (decision) {
      case 'aprobar':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobado</Badge>;
      case 'segunda_entrevista':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Segunda Entrevista</Badge>;
      case 'rechazar':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">Procesando</Badge>;
    }
  };

  const candidateInfo = vapiCallData.structured_data?.candidato_info || {};
  const evaluation = vapiCallData.structured_data?.evaluacion || {};
  const decisionInfo = vapiCallData.structured_data?.decision_recomendada || {};

  return (
    <div className="space-y-6">
      {/* Header with main results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle>Entrevista Automática VAPI</CardTitle>
            </div>
            {getDecisionBadge(vapiCallData.auto_decision)}
          </div>
          <CardDescription>
            Realizada el {new Date(vapiCallData.created_at).toLocaleString('es-ES')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {vapiCallData.analysis_score?.toFixed(1) || 'N/A'}/10
              </div>
              <p className="text-sm text-muted-foreground">Score de Evaluación</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Clock className="h-5 w-5" />
                {vapiCallData.duration_seconds ? formatDuration(vapiCallData.duration_seconds) : 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">Duración</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {vapiCallData.red_flags?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Red Flags</p>
            </div>

            <div className="text-center">
              <Badge 
                variant={vapiCallData.call_status === 'completed' ? 'default' : 'secondary'}
                className="text-sm px-3 py-1"
              >
                {vapiCallData.call_status === 'completed' ? 'Completada' : 
                 vapiCallData.call_status === 'in-progress' ? 'En Progreso' : 
                 vapiCallData.call_status}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Estado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Information */}
      {Object.keys(candidateInfo).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Información del Candidato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidateInfo.experiencia_custodia && (
                <div>
                  <span className="font-medium">Experiencia en Custodia:</span>
                  <p className="text-muted-foreground">{candidateInfo.experiencia_custodia}</p>
                </div>
              )}
              
              {typeof candidateInfo.experiencia_ninos === 'boolean' && (
                <div>
                  <span className="font-medium">Experiencia con Niños:</span>
                  <p className="text-muted-foreground">
                    {candidateInfo.experiencia_ninos ? 'Sí' : 'No'}
                  </p>
                </div>
              )}

              {candidateInfo.disponibilidad_horaria && (
                <div>
                  <span className="font-medium">Disponibilidad:</span>
                  <p className="text-muted-foreground">{candidateInfo.disponibilidad_horaria}</p>
                </div>
              )}

              {typeof candidateInfo.referencias_verificables === 'boolean' && (
                <div>
                  <span className="font-medium">Referencias Verificables:</span>
                  <p className="text-muted-foreground">
                    {candidateInfo.referencias_verificables ? 'Sí' : 'No'}
                  </p>
                </div>
              )}

              {typeof candidateInfo.vehiculo_propio === 'boolean' && (
                <div>
                  <span className="font-medium">Vehículo Propio:</span>
                  <p className="text-muted-foreground">
                    {candidateInfo.vehiculo_propio ? 'Sí' : 'No'}
                  </p>
                </div>
              )}

              {candidateInfo.zona_preferida && (
                <div>
                  <span className="font-medium">Zona Preferida:</span>
                  <p className="text-muted-foreground">{candidateInfo.zona_preferida}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Scores */}
      {Object.keys(evaluation).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluación Detallada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluation.confianza_score && (
                <div className="flex justify-between items-center">
                  <span>Nivel de Confianza</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${(evaluation.confianza_score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold">{evaluation.confianza_score}/10</span>
                  </div>
                </div>
              )}

              {evaluation.comunicacion_score && (
                <div className="flex justify-between items-center">
                  <span>Comunicación</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${(evaluation.comunicacion_score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold">{evaluation.comunicacion_score}/10</span>
                  </div>
                </div>
              )}

              {evaluation.responsabilidad_score && (
                <div className="flex justify-between items-center">
                  <span>Responsabilidad</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${(evaluation.responsabilidad_score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold">{evaluation.responsabilidad_score}/10</span>
                  </div>
                </div>
              )}

              {evaluation.aptitud_general && (
                <div className="flex justify-between items-center">
                  <span>Aptitud General</span>
                  <Badge variant={
                    evaluation.aptitud_general === 'excelente' ? 'default' :
                    evaluation.aptitud_general === 'buena' ? 'secondary' :
                    evaluation.aptitud_general === 'regular' ? 'secondary' : 'destructive'
                  }>
                    {evaluation.aptitud_general.charAt(0).toUpperCase() + evaluation.aptitud_general.slice(1)}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Red Flags */}
      {vapiCallData.red_flags && vapiCallData.red_flags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Señales de Alerta Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vapiCallData.red_flags.map((flag, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-800">{flag}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision & Recommendation */}
      {(decisionInfo.razon || vapiCallData.recommendation) && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendación y Justificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {decisionInfo.razon && (
                <div>
                  <span className="font-medium">Justificación de la Decisión:</span>
                  <p className="text-muted-foreground mt-1">{decisionInfo.razon}</p>
                </div>
              )}
              
              {vapiCallData.recommendation && (
                <div>
                  <span className="font-medium">Recomendación del AI:</span>
                  <p className="text-muted-foreground mt-1">{vapiCallData.recommendation}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary and Transcript */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vapiCallData.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resumen de la Entrevista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {vapiCallData.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {vapiCallData.recording_url && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Grabación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.open(vapiCallData.recording_url!, '_blank')}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Reproducir Grabación
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transcript */}
      {vapiCallData.transcript && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Transcripción Completa</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
              >
                {showTranscript ? 'Ocultar' : 'Mostrar'} Transcripción
              </Button>
            </div>
          </CardHeader>
          {showTranscript && (
            <CardContent>
              <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {vapiCallData.transcript}
                </pre>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};