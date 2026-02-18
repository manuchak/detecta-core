import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Package, AlertCircle, Maximize2 } from "lucide-react";
import type { ScormContent } from "@/types/lms";

interface SCORMViewerProps {
  content: ScormContent;
  onComplete?: () => void;
}

export function SCORMViewer({ content, onComplete }: SCORMViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleComplete = useCallback(() => {
    if (!completed) {
      setCompleted(true);
      onCompleteRef.current?.();
    }
  }, [completed]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // SCORM 2004 events
      if (data.type === 'SCORM_2004') {
        if (
          data.element === 'cmi.completion_status' && data.value === 'completed' ||
          data.element === 'cmi.success_status' && data.value === 'passed'
        ) {
          handleComplete();
        }
        if (data.element === 'cmi.score.raw' && data.value != null) {
          setScore(parseFloat(data.value));
        }
      }

      // SCORM 1.2 events
      if (data.type === 'SCORM_1.2' || data.type === 'LMSSetValue') {
        if (
          (data.element === 'cmi.core.lesson_status' && (data.value === 'completed' || data.value === 'passed')) ||
          (data.element === 'cmi.completion_status' && data.value === 'completed')
        ) {
          handleComplete();
        }
        if (data.element === 'cmi.core.score.raw' && data.value != null) {
          setScore(parseFloat(data.value));
        }
      }

      // Generic completion signals
      if (
        data.status === 'completed' ||
        data.completion === 'completed' ||
        data.scormCompleted === true ||
        data.event === 'SCORM_COMPLETED'
      ) {
        handleComplete();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleComplete]);

  const handleIframeError = () => setHasError(true);

  const toggleFullscreen = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (!isFullscreen) {
      iframe.requestFullscreen?.().catch(() => setIsFullscreen(false));
    }
    setIsFullscreen(!isFullscreen);
  };

  const height = content.height || 600;

  return (
    <div className="space-y-3">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Contenido SCORM</span>
          <Badge variant="outline" className="text-[10px]">{content.version}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {completed && (
            <Badge className="gap-1 bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3" />
              Completado{score !== null ? ` · ${score}pts` : ''}
            </Badge>
          )}
          <Button size="icon" variant="outline" className="h-7 w-7" onClick={toggleFullscreen} title="Pantalla completa">
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* SCORM iframe */}
      {hasError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se pudo cargar el contenido SCORM. Verifica que el paquete esté correctamente publicado.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-lg border overflow-hidden bg-background" style={{ height }}>
          <iframe
            ref={iframeRef}
            src={content.entry_point}
            width={content.width || '100%'}
            height="100%"
            allow="fullscreen; autoplay; microphone"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
            onError={handleIframeError}
            title="Contenido SCORM"
            className="w-full h-full border-0"
          />
        </div>
      )}

      {/* Manual completion fallback */}
      {!completed && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
          <p className="text-xs text-muted-foreground">
            El sistema detectará la finalización automáticamente. Si el contenido no reporta el estado, usa el botón.
          </p>
          <Button size="sm" variant="outline" onClick={handleComplete} className="shrink-0 ml-3">
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Marcar completado
          </Button>
        </div>
      )}
    </div>
  );
}
