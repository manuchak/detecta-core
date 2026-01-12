import { VideoPlayer } from "./VideoPlayer";
import { DocumentViewer } from "./DocumentViewer";
import { EmbedRenderer } from "./EmbedRenderer";
import { TextoEnriquecidoViewer } from "./TextoEnriquecidoViewer";
import { QuizComponent } from "./QuizComponent";
import { InteractivoRenderer } from "./InteractivoRenderer";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { LMSContenido, VideoContent, DocumentoContent, EmbedContent, TextoEnriquecidoContent, InteractivoContent, RespuestaQuiz } from "@/types/lms";

interface ContentRendererProps {
  contenido: LMSContenido;
  inscripcionId?: string;
  progresoQuiz?: {
    quiz_intentos?: number;
    quiz_mejor_puntaje?: number;
    quiz_respuestas?: RespuestaQuiz[];
  };
  progresoVideo?: {
    video_posicion_seg?: number;
    video_porcentaje_visto?: number;
  };
  onComplete?: () => void;
  onVideoProgress?: (posicion: number, porcentaje: number) => void;
  initialVideoPosition?: number;
}

export function ContentRenderer({ 
  contenido, 
  inscripcionId,
  progresoQuiz,
  progresoVideo,
  onComplete,
  onVideoProgress,
  initialVideoPosition
}: ContentRendererProps) {
  const { tipo, contenido: data, duracion_min } = contenido;

  switch (tipo) {
    case 'video': {
      const videoData = data as VideoContent;
      const duracionSegundos = videoData.duracion_segundos || duracion_min * 60;
      
      // Para videos nativos: calcular posición máxima vista
      const initialMaxViewed = progresoVideo?.video_porcentaje_visto 
        ? (progresoVideo.video_porcentaje_visto / 100) * duracionSegundos 
        : 0;
      
      // Para embeds: usar video_posicion_seg como watchTime acumulado
      const initialWatchTime = progresoVideo?.video_posicion_seg || 0;
      
      return (
        <VideoPlayer 
          content={videoData}
          onComplete={onComplete}
          onProgress={onVideoProgress}
          initialPosition={initialVideoPosition}
          initialMaxViewed={initialMaxViewed}
          initialWatchTime={initialWatchTime}
          duracionMinutos={duracion_min}
        />
      );
    }

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
      return (
        <InteractivoRenderer 
          content={data as InteractivoContent}
          onComplete={onComplete}
        />
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
