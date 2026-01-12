import { useState } from "react";
import { FileText, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DocumentoContent } from "@/types/lms";

interface DocumentViewerProps {
  content: DocumentoContent;
  onComplete?: () => void;
}

export function DocumentViewer({ content, onComplete }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const tipo = content?.tipo || 'documento';
  const isPdf = tipo === 'pdf';

  // Usar Google Docs Viewer como proxy para evitar bloqueos de X-Frame-Options
  const googleViewerUrl = isPdf 
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(content.url)}&embedded=true`
    : null;

  const handleOpenExternal = () => {
    window.open(content.url, '_blank');
    onComplete?.();
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Renderizado para PDFs
  if (isPdf) {
    return (
      <div className="space-y-4">
        {/* Indicador de carga */}
        {isLoading && !hasError && (
          <div className="aspect-[4/5] bg-muted rounded-lg flex items-center justify-center border">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Cargando documento...</p>
            </div>
          </div>
        )}

        {/* Error de carga */}
        {hasError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudo cargar el visor del documento. Usa los botones de abajo para ver o descargar.
            </AlertDescription>
          </Alert>
        )}

        {/* Visor de PDF con Google Docs Viewer */}
        {!hasError && googleViewerUrl && (
          <div 
            className={`aspect-[4/5] bg-muted rounded-lg overflow-hidden border ${isLoading ? 'hidden' : 'block'}`}
          >
            <iframe
              src={googleViewerUrl}
              className="w-full h-full"
              title={content.nombre_archivo || 'Documento PDF'}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="autoplay"
            />
          </div>
        )}

        {/* Acciones siempre visibles */}
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={handleOpenExternal}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir en nueva pestaña
          </Button>
          <Button variant="outline" asChild>
            <a href={content.url} download>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // Para otros tipos de documento (Word, PowerPoint, Excel)
  return (
    <div className="bg-muted/50 rounded-lg p-8 text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
        <FileText className="h-8 w-8 text-primary" />
      </div>
      
      <div>
        <h4 className="font-medium text-foreground">
          {content.nombre_archivo || 'Documento'}
        </h4>
        <p className="text-sm text-muted-foreground mt-1">
          Tipo: {tipo.toUpperCase()}
          {content?.paginas && ` · ${content.paginas} páginas`}
        </p>
      </div>

      <div className="flex justify-center gap-3">
        <Button onClick={handleOpenExternal}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir documento
        </Button>
        <Button variant="outline" asChild>
          <a href={content.url} download>
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </a>
        </Button>
      </div>
    </div>
  );
}
