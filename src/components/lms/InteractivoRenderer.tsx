import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FlashcardsViewer } from "./interactivo/FlashcardsViewer";
import { InteractiveVideoPlayer } from "./interactivo/InteractiveVideoPlayer";
import { sanitizeUserInput } from "@/utils/sanitization";
import type { 
  InteractivoContent, 
  FlashcardsData, 
  VideoInteractivoData,
  EmbedExternoData
} from "@/types/lms";

interface InteractivoRendererProps {
  content: InteractivoContent;
  onComplete?: () => void;
}

export function InteractivoRenderer({ content, onComplete }: InteractivoRendererProps) {
  const tipo = content?.tipo;

  if (!tipo) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Tipo de contenido interactivo no especificado.
        </AlertDescription>
      </Alert>
    );
  }

  switch (tipo) {
    case 'embed_externo': {
      const embedData = content.data as EmbedExternoData;
      // Sanitizar el HTML pero permitir iframes de fuentes conocidas
      const sanitizedHtml = sanitizeUserInput(embedData.html || '');
      
      return (
        <div className="space-y-4">
          <div 
            className="w-full rounded-lg overflow-hidden bg-muted/30 border"
            style={{ 
              minHeight: embedData.altura || 500,
              maxWidth: embedData.ancho || '100%'
            }}
          >
            <div 
              className="w-full [&>iframe]:w-full [&>iframe]:border-0"
              style={{ minHeight: embedData.altura || 500 }}
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          </div>
          {onComplete && (
            <div className="flex justify-center pt-4">
              <Button onClick={onComplete} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Marcar como completado
              </Button>
            </div>
          )}
        </div>
      );
    }

    case 'flashcards':
      return (
        <FlashcardsViewer 
          data={content.data as FlashcardsData} 
          onComplete={onComplete} 
        />
      );

    case 'video_interactivo':
      return (
        <InteractiveVideoPlayer 
          data={content.data as VideoInteractivoData} 
          onComplete={onComplete} 
        />
      );

    case 'timeline':
    case 'dragdrop':
    case 'hotspots':
    case 'accordion':
    case 'tabs':
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            El tipo de contenido "{tipo}" estará disponible próximamente.
          </AlertDescription>
        </Alert>
      );

    default:
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tipo de contenido interactivo no soportado: {tipo}
          </AlertDescription>
        </Alert>
      );
  }
}
