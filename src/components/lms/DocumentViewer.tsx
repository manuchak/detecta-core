import { FileText, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentoContent } from "@/types/lms";

interface DocumentViewerProps {
  content: DocumentoContent;
  onComplete?: () => void;
}

export function DocumentViewer({ content, onComplete }: DocumentViewerProps) {
  const isPdf = content.tipo === 'pdf';

  const handleOpenExternal = () => {
    window.open(content.url, '_blank');
    // Marcar como completado al abrir
    onComplete?.();
  };

  if (isPdf) {
    return (
      <div className="space-y-4">
        {/* Visor de PDF embebido */}
        <div className="aspect-[4/5] bg-muted rounded-lg overflow-hidden border">
          <iframe
            src={`${content.url}#view=FitH`}
            className="w-full h-full"
            title={content.nombre_archivo || 'Documento PDF'}
          />
        </div>

        {/* Acciones */}
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
          Tipo: {content.tipo.toUpperCase()}
          {content.paginas && ` · ${content.paginas} páginas`}
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
