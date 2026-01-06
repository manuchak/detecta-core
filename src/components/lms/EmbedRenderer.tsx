import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { EmbedContent } from "@/types/lms";

interface EmbedRendererProps {
  content: EmbedContent;
  onComplete?: () => void;
}

export function EmbedRenderer({ content, onComplete }: EmbedRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);

  useEffect(() => {
    // Marcar como completado después de 5 segundos de visualización
    if (!hasMarkedComplete) {
      const timer = setTimeout(() => {
        setHasMarkedComplete(true);
        onComplete?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [onComplete, hasMarkedComplete]);

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
  );
}
