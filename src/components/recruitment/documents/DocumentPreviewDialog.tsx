import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, User, CheckCircle, AlertCircle } from 'lucide-react';
import { DocumentoCandidato, DOCUMENTO_LABELS } from '@/hooks/useDocumentosCandidato';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  documento: DocumentoCandidato;
  onClose: () => void;
}

export function DocumentPreviewDialog({ documento, onClose }: Props) {
  const isImage = documento.archivo_tipo?.startsWith('image/');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {DOCUMENTO_LABELS[documento.tipo_documento]}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preview del documento */}
            <div className="border rounded-lg overflow-hidden">
              {isImage ? (
                <img 
                  src={documento.archivo_url} 
                  alt={documento.archivo_nombre}
                  className="w-full h-auto"
                />
              ) : (
                <div className="p-8 text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">{documento.archivo_nombre}</p>
                  <a 
                    href={documento.archivo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline mt-2 inline-block"
                  >
                    Abrir en nueva pestaña
                  </a>
                </div>
              )}
            </div>

            {/* Información del documento */}
            <div className="space-y-4">
              {/* Metadatos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Información del Archivo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="truncate ml-2">{documento.archivo_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{documento.archivo_tipo}</span>
                  </div>
                  {documento.archivo_tamaño && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tamaño:</span>
                      <span>{(documento.archivo_tamaño / 1024).toFixed(1)} KB</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subido:</span>
                    <span>{format(new Date(documento.created_at), "d MMM yyyy HH:mm", { locale: es })}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Resultados OCR */}
              {documento.ocr_procesado && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Resultados OCR
                      <Badge variant={documento.ocr_confianza && documento.ocr_confianza >= 80 ? 'default' : 'secondary'}>
                        {documento.ocr_confianza}% confianza
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documento.ocr_datos_extraidos ? (
                      <div className="space-y-2 text-sm">
                        {Object.entries(documento.ocr_datos_extraidos).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-right ml-2">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : documento.ocr_error ? (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {documento.ocr_error}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin datos extraídos</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Validación */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Estado de Validación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant={
                      documento.estado_validacion === 'valido' ? 'default' : 
                      documento.estado_validacion === 'invalido' ? 'destructive' : 
                      'secondary'
                    }>
                      {documento.estado_validacion}
                    </Badge>
                  </div>
                  
                  {documento.nombre_extraido && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre extraído:</span>
                      <span>{documento.nombre_extraido}</span>
                    </div>
                  )}

                  {documento.fecha_vencimiento && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Vigencia:</span>
                      <span className={documento.documento_vigente ? 'text-green-600' : 'text-destructive'}>
                        {documento.documento_vigente ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Vigente hasta {documento.fecha_vencimiento}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Vencido: {documento.fecha_vencimiento}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {documento.motivo_rechazo && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-xs">
                      <strong>Motivo de rechazo:</strong> {documento.motivo_rechazo}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
