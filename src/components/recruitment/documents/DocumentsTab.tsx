import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Trash2,
  Scan,
  Loader2
} from 'lucide-react';
import { 
  useDocumentosCandidato, 
  useUploadDocumento, 
  useProcesarOCR,
  useValidarDocumento,
  useDeleteDocumento,
  useDocumentosProgress,
  DOCUMENTO_LABELS,
  DOCUMENTOS_REQUERIDOS,
  TipoDocumento,
  EstadoValidacion
} from '@/hooks/useDocumentosCandidato';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import { DocumentPreviewDialog } from './DocumentPreviewDialog';

interface Props {
  candidatoId: string;
  candidatoNombre: string;
}

const ESTADO_CONFIG: Record<EstadoValidacion, { color: string; icon: React.ElementType; label: string }> = {
  pendiente: { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'Pendiente' },
  procesando: { color: 'bg-blue-500/20 text-blue-700', icon: Loader2, label: 'Procesando OCR' },
  valido: { color: 'bg-green-500/20 text-green-700', icon: CheckCircle, label: 'Válido' },
  invalido: { color: 'bg-destructive/20 text-destructive', icon: XCircle, label: 'Inválido' },
  requiere_revision: { color: 'bg-amber-500/20 text-amber-700', icon: AlertCircle, label: 'Requiere Revisión' }
};

export function DocumentsTab({ candidatoId, candidatoNombre }: Props) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoDocumento | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const { data: documentos, isLoading } = useDocumentosCandidato(candidatoId);
  const { completados, totalRequeridos, porcentaje, documentosFaltantes } = useDocumentosProgress(candidatoId);
  const procesarOCR = useProcesarOCR();
  const validarDocumento = useValidarDocumento();
  const deleteDocumento = useDeleteDocumento();

  const getDocumentoPorTipo = (tipo: TipoDocumento) => {
    return documentos?.find(d => d.tipo_documento === tipo && d.estado_validacion !== 'invalido');
  };

  const handleUpload = (tipo: TipoDocumento) => {
    setSelectedTipo(tipo);
    setUploadDialogOpen(true);
  };

  const handleProcesarOCR = async (documentoId: string, imagenUrl: string) => {
    await procesarOCR.mutateAsync({ documentoId, imagenUrl });
  };

  const handleValidar = async (documentoId: string, estado: 'valido' | 'invalido' | 'requiere_revision') => {
    await validarDocumento.mutateAsync({ documentoId, candidatoId, estado });
  };

  const handleDelete = async (documentoId: string, archivoUrl: string) => {
    if (confirm('¿Estás seguro de eliminar este documento?')) {
      await deleteDocumento.mutateAsync({ documentoId, candidatoId, archivoUrl });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Documentos Validados</span>
            <span className="text-sm text-muted-foreground">{completados}/{totalRequeridos}</span>
          </div>
          <Progress value={porcentaje} className="h-2" />
          {documentosFaltantes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Faltan: {documentosFaltantes.map(t => DOCUMENTO_LABELS[t]).join(', ')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENTOS_REQUERIDOS.map((tipo) => {
          const documento = getDocumentoPorTipo(tipo);
          const estadoConfig = documento ? ESTADO_CONFIG[documento.estado_validacion] : null;
          const IconComponent = estadoConfig?.icon || FileText;

          return (
            <Card key={tipo} className={documento ? 'border-l-4 border-l-primary/50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {DOCUMENTO_LABELS[tipo]}
                  </span>
                  {estadoConfig && (
                    <Badge className={estadoConfig.color}>
                      <IconComponent className={`h-3 w-3 mr-1 ${documento?.estado_validacion === 'procesando' ? 'animate-spin' : ''}`} />
                      {estadoConfig.label}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documento ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="truncate">{documento.archivo_nombre}</span>
                    </div>

                    {documento.ocr_procesado && documento.ocr_confianza && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Confianza OCR: </span>
                        <span className={documento.ocr_confianza >= 80 ? 'text-green-600' : documento.ocr_confianza >= 50 ? 'text-amber-600' : 'text-destructive'}>
                          {documento.ocr_confianza}%
                        </span>
                      </div>
                    )}

                    {documento.nombre_extraido && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Nombre extraído: </span>
                        <span>{documento.nombre_extraido}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setPreviewDoc(documento)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>

                      {!documento.ocr_procesado && documento.estado_validacion === 'pendiente' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleProcesarOCR(documento.id, documento.archivo_url)}
                          disabled={procesarOCR.isPending}
                        >
                          <Scan className="h-3 w-3 mr-1" />
                          Procesar OCR
                        </Button>
                      )}

                      {(documento.estado_validacion === 'pendiente' || documento.estado_validacion === 'requiere_revision') && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600"
                            onClick={() => handleValidar(documento.id, 'valido')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprobar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleValidar(documento.id, 'invalido')}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Rechazar
                          </Button>
                        </>
                      )}

                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(documento.id, documento.archivo_url)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleUpload(tipo)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Documento
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload Dialog */}
      {selectedTipo && (
        <DocumentUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          candidatoId={candidatoId}
          candidatoNombre={candidatoNombre}
          tipoDocumento={selectedTipo}
          onSuccess={() => setUploadDialogOpen(false)}
        />
      )}

      {/* Preview Dialog */}
      {previewDoc && (
        <DocumentPreviewDialog
          documento={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
