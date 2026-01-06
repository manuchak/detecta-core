import { VideoPlayer } from "./VideoPlayer";
import { DocumentViewer } from "./DocumentViewer";
import { EmbedRenderer } from "./EmbedRenderer";
import { TextoEnriquecidoViewer } from "./TextoEnriquecidoViewer";
import { QuizComponent } from "./QuizComponent";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { LMSContenido, VideoContent, DocumentoContent, EmbedContent, TextoEnriquecidoContent, RespuestaQuiz } from "@/types/lms";

interface ContentRendererProps {
  contenido: LMSContenido;
  inscripcionId?: string;
  progresoQuiz?: {
    quiz_intentos?: number;
    quiz_mejor_puntaje?: number;
    quiz_respuestas?: RespuestaQuiz[];
  };
  onComplete?: () => void;
  onVideoProgress?: (posicion: number, porcentaje: number) => void;
  initialVideoPosition?: number;
}

export function ContentRenderer({ 
  contenido, 
  inscripcionId,
  progresoQuiz,
  onComplete,
  onVideoProgress,
  initialVideoPosition
}: ContentRendererProps) {
  const { tipo, contenido: data } = contenido;

  switch (tipo) {
    case 'video':
      return (
        <VideoPlayer 
          content={data as VideoContent}
          onComplete={onComplete}
          onProgress={onVideoProgress}
          initialPosition={initialVideoPosition}
        />
      );

    case 'documento':
      return (
        <DocumentViewer 
          content={data as DocumentoContent}
          onComplete={onComplete}
        />
      );

    case 'embed':
      return (
        <EmbedRenderer 
          content={data as EmbedContent}
          onComplete={onComplete}
        />
      );

    case 'texto_enriquecido':
      return (
        <TextoEnriquecidoViewer 
          content={data as TextoEnriquecidoContent}
          onComplete={onComplete}
        />
      );

    case 'quiz':
      if (!inscripcionId) {
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Debes estar inscrito para realizar esta evaluación.
            </AlertDescription>
          </Alert>
        );
      }
      return (
        <QuizComponent
          contenido={contenido}
          inscripcionId={inscripcionId}
          progresoActual={progresoQuiz}
          onComplete={onComplete}
        />
      );

    case 'interactivo':
      // Interactivos se implementarán en Fase 5
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            El contenido interactivo se está desarrollando.
          </AlertDescription>
        </Alert>
      );

    default:
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tipo de contenido no soportado: {tipo}
          </AlertDescription>
        </Alert>
      );
  }
}
