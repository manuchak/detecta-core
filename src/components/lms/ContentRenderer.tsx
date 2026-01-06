import { VideoPlayer } from "./VideoPlayer";
import { DocumentViewer } from "./DocumentViewer";
import { EmbedRenderer } from "./EmbedRenderer";
import { TextoEnriquecidoViewer } from "./TextoEnriquecidoViewer";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { LMSContenido, VideoContent, DocumentoContent, EmbedContent, TextoEnriquecidoContent } from "@/types/lms";

interface ContentRendererProps {
  contenido: LMSContenido;
  onComplete?: () => void;
  onVideoProgress?: (posicion: number, porcentaje: number) => void;
  initialVideoPosition?: number;
}

export function ContentRenderer({ 
  contenido, 
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
      // Quiz se implementará en Fase 3
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            El componente de evaluación se está desarrollando.
          </AlertDescription>
        </Alert>
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
