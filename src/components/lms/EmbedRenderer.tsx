import { useState, useRef } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { EmbedContent } from "@/types/lms";

interface EmbedRendererProps {
  content: EmbedContent;
  onComplete?: () => void;
}

export function EmbedRenderer({ content, onComplete }: EmbedRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);

  const handleComplete = () => {
    setHasMarkedComplete(true);
    onComplete?.();
  };

  // Sanitizar el HTML para seguridad básica (en producción usar DOMPurify)
  const sanitizedHtml = content.html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '');

  // Verificar que contiene un iframe válido
  const hasIframe = /<iframe[^>]*>/i.test(sanitizedHtml);

  if (!hasIframe && !sanitizedHtml.trim()) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          El contenido embed está vacío o no es válido.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden bg-muted"
        style={{ 
          minHeight: content.altura || 400,
          maxWidth: content.ancho || '100%'
        }}
      >
        <div 
          className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
          style={{ minHeight: content.altura || 400 }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </div>

      {onComplete && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleComplete}
            disabled={hasMarkedComplete}
            variant={hasMarkedComplete ? "outline" : "default"}
            className={hasMarkedComplete ? "text-green-600 border-green-300 dark:text-green-400 dark:border-green-700" : ""}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {hasMarkedComplete ? "Completado" : "He terminado de ver"}
          </Button>
        </div>
      )}
    </div>
  );
}
