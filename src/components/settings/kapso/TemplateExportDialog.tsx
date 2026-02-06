import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  X
} from 'lucide-react';
import { downloadJSON, downloadCSV, downloadMarkdown } from '@/utils/exportWhatsAppTemplates';
import { useToast } from '@/hooks/use-toast';

interface TemplateExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TemplateExportDialog = ({ open, onOpenChange }: TemplateExportDialogProps) => {
  const { toast } = useToast();

  const handleExport = (format: 'json' | 'csv' | 'md') => {
    try {
      switch (format) {
        case 'json':
          downloadJSON();
          break;
        case 'csv':
          downloadCSV();
          break;
        case 'md':
          downloadMarkdown();
          break;
      }
      toast({
        title: 'Archivo descargado',
        description: `detecta-whatsapp-templates.${format} se descargó correctamente`
      });
    } catch (error) {
      toast({
        title: 'Error al exportar',
        description: 'No se pudo generar el archivo',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Templates para Meta
          </DialogTitle>
          <DialogDescription>
            Descarga los 34 templates en el formato que prefieras para crearlos en Meta Business Suite.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* JSON Export */}
          <Card className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileJson className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">JSON Estructurado</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Formato técnico listo para la API de Meta. Incluye ejemplos de variables y estructura completa.
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExport('json')}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                JSON
              </Button>
            </div>
          </Card>

          {/* CSV Export */}
          <Card className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">CSV para Excel</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Abre en Excel o Google Sheets. Una fila por template con todas las variables.
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                CSV
              </Button>
            </div>
          </Card>

          {/* Markdown Export */}
          <Card className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Documentación Markdown</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Documento completo con todos los detalles. Útil como referencia al crear en Meta.
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExport('md')}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                MD
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> El archivo JSON incluye ejemplos de variables que puedes usar directamente al crear los templates en Meta Business Suite.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
