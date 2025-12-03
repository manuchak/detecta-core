import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileSignature, 
  Plus, 
  CheckCircle, 
  Clock, 
  Eye,
  Loader2,
  Send
} from 'lucide-react';
import { 
  useContratosCandidato,
  usePlantillasContrato,
  useContratosProgress,
  CONTRATO_LABELS,
  CONTRATOS_REQUERIDOS,
  TipoContrato,
  EstadoContrato
} from '@/hooks/useContratosCandidato';
import { ContractGenerateDialog } from './ContractGenerateDialog';
import { ContractSignDialog } from './ContractSignDialog';
import { ContractPreviewDialog } from './ContractPreviewDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  candidatoId: string;
  candidatoNombre: string;
}

const ESTADO_CONFIG: Record<EstadoContrato, { color: string; icon: React.ElementType; label: string }> = {
  pendiente: { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'Pendiente' },
  enviado: { color: 'bg-blue-500/20 text-blue-700', icon: Send, label: 'Enviado' },
  visto: { color: 'bg-amber-500/20 text-amber-700', icon: Eye, label: 'Visto' },
  firmado: { color: 'bg-green-500/20 text-green-700', icon: CheckCircle, label: 'Firmado' },
  rechazado: { color: 'bg-destructive/20 text-destructive', icon: Clock, label: 'Rechazado' },
  vencido: { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'Vencido' }
};

export function ContractsTab({ candidatoId, candidatoNombre }: Props) {
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoContrato | null>(null);
  const [signContrato, setSignContrato] = useState<any>(null);
  const [previewContrato, setPreviewContrato] = useState<any>(null);

  const { data: contratos, isLoading } = useContratosCandidato(candidatoId);
  const { data: plantillas } = usePlantillasContrato();
  const { firmados, totalRequeridos, porcentaje, contratosFaltantes } = useContratosProgress(candidatoId);

  const getContratoPorTipo = (tipo: TipoContrato) => {
    return contratos?.find(c => c.tipo_contrato === tipo && c.estado !== 'rechazado' && c.estado !== 'vencido');
  };

  const handleGenerar = (tipo: TipoContrato) => {
    setSelectedTipo(tipo);
    setGenerateDialogOpen(true);
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
            <span className="text-sm font-medium">Contratos Firmados</span>
            <span className="text-sm text-muted-foreground">{firmados}/{totalRequeridos}</span>
          </div>
          <Progress value={porcentaje} className="h-2" />
          {contratosFaltantes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Faltan: {contratosFaltantes.map(t => CONTRATO_LABELS[t]).join(', ')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contracts Grid */}
      <div className="space-y-4">
        {CONTRATOS_REQUERIDOS.map((tipo) => {
          const contrato = getContratoPorTipo(tipo);
          const plantilla = plantillas?.find(p => p.tipo_contrato === tipo);
          const estadoConfig = contrato ? ESTADO_CONFIG[contrato.estado] : null;
          const IconComponent = estadoConfig?.icon || FileSignature;

          return (
            <Card key={tipo} className={contrato?.firmado ? 'border-l-4 border-l-green-500' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    {CONTRATO_LABELS[tipo]}
                  </span>
                  {estadoConfig && (
                    <Badge className={estadoConfig.color}>
                      <IconComponent className="h-3 w-3 mr-1" />
                      {estadoConfig.label}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contrato ? (
                  <div className="space-y-3">
                    {contrato.fecha_envio && (
                      <p className="text-xs text-muted-foreground">
                        Enviado: {format(new Date(contrato.fecha_envio), "d MMM yyyy HH:mm", { locale: es })}
                      </p>
                    )}

                    {contrato.firmado && contrato.firma_timestamp && (
                      <p className="text-xs text-green-600">
                        Firmado: {format(new Date(contrato.firma_timestamp), "d MMM yyyy HH:mm", { locale: es })}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setPreviewContrato(contrato)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Contrato
                      </Button>

                      {!contrato.firmado && contrato.estado !== 'rechazado' && (
                        <Button 
                          size="sm"
                          onClick={() => setSignContrato(contrato)}
                        >
                          <FileSignature className="h-3 w-3 mr-1" />
                          Firmar
                        </Button>
                      )}
                    </div>
                  </div>
                ) : plantilla ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleGenerar(tipo)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generar Contrato
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No hay plantilla disponible
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generate Dialog */}
      {selectedTipo && (
        <ContractGenerateDialog
          open={generateDialogOpen}
          onOpenChange={setGenerateDialogOpen}
          candidatoId={candidatoId}
          candidatoNombre={candidatoNombre}
          tipoContrato={selectedTipo}
          onSuccess={() => setGenerateDialogOpen(false)}
        />
      )}

      {/* Sign Dialog */}
      {signContrato && (
        <ContractSignDialog
          contrato={signContrato}
          candidatoId={candidatoId}
          onClose={() => setSignContrato(null)}
          onSuccess={() => setSignContrato(null)}
        />
      )}

      {/* Preview Dialog */}
      {previewContrato && (
        <ContractPreviewDialog
          contrato={previewContrato}
          onClose={() => setPreviewContrato(null)}
        />
      )}
    </div>
  );
}
