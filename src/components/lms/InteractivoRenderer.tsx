import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FlashcardsViewer } from "./interactivo/FlashcardsViewer";
import { InteractiveVideoPlayer } from "./interactivo/InteractiveVideoPlayer";
import type { 
  InteractivoContent, 
  FlashcardsData, 
  VideoInteractivoData 
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
