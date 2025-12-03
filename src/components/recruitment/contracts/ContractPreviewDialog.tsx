import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSignature, CheckCircle, Calendar, Shield } from 'lucide-react';
import { ContratoCandidato, CONTRATO_LABELS } from '@/hooks/useContratosCandidato';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  contrato: ContratoCandidato;
  onClose: () => void;
}

export function ContractPreviewDialog({ contrato, onClose }: Props) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            {CONTRATO_LABELS[contrato.tipo_contrato]}
            {contrato.firmado && (
              <Badge className="bg-green-500/20 text-green-700 ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Firmado
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contenido del contrato */}
          <div className="md:col-span-2 border rounded-lg">
            <ScrollArea className="h-[60vh] p-4">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: contrato.contenido_html || '' }}
              />
              
              {/* Mostrar firma si existe */}
              {contrato.firmado && contrato.firma_data_url && (
                <div className="mt-8 border-t pt-4">
                  <p className="text-sm font-medium mb-2">Firma Electrónica:</p>
                  <img 
                    src={contrato.firma_data_url} 
                    alt="Firma" 
                    className="max-h-24 border rounded"
                  />
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Panel lateral con información */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant={contrato.firmado ? 'default' : 'secondary'}>
                    {contrato.estado}
                  </Badge>
                </div>
                
                {contrato.fecha_envio && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enviado:</span>
                    <span className="text-xs">
                      {format(new Date(contrato.fecha_envio), "d MMM yyyy", { locale: es })}
                    </span>
                  </div>
                )}

                {contrato.visto_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visto:</span>
                    <span className="text-xs">
                      {format(new Date(contrato.visto_at), "d MMM yyyy", { locale: es })}
                    </span>
                  </div>
                )}

                {contrato.firma_timestamp && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Firmado:</span>
                    <span className="text-xs">
                      {format(new Date(contrato.firma_timestamp), "d MMM yyyy HH:mm", { locale: es })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {contrato.firmado && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Verificación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {contrato.firma_hash && (
                    <div>
                      <span className="text-muted-foreground block">Hash SHA-256:</span>
                      <span className="font-mono break-all text-[10px]">
                        {contrato.firma_hash.substring(0, 32)}...
                      </span>
                    </div>
                  )}
                  
                  {contrato.firma_ip && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP:</span>
                      <span>{contrato.firma_ip}</span>
                    </div>
                  )}

                  <div className="pt-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 inline mr-1 text-green-600" />
                    Documento firmado electrónicamente
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
