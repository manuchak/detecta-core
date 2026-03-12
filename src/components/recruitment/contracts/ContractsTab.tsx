import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileSignature, 
  Plus, 
  CheckCircle, 
  Clock, 
  Eye,
  Loader2,
  Send,
  Trash2,
  Upload
} from 'lucide-react';
import { 
  useContratosCandidato,
  usePlantillasContrato,
  useContratosProgress,
  useEliminarContrato,
  CONTRATO_LABELS,
  getContratosRequeridosParaCandidato,
  TipoContrato,
  EstadoContrato
} from '@/hooks/useContratosCandidato';
import { ContractGenerateDialog } from './ContractGenerateDialog';
import { ContractSignDialog } from './ContractSignDialog';
import { ContractPreviewDialog } from './ContractPreviewDialog';
import { ContractUploadDialog } from './ContractUploadDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  candidatoId: string;
  candidatoNombre: string;
  vehiculoPropio?: boolean;
  tieneVehiculo?: boolean;
}

const ESTADO_CONFIG: Record<EstadoContrato, { color: string; icon: React.ElementType; label: string }> = {
  pendiente: { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'Pendiente' },
  enviado: { color: 'bg-blue-500/20 text-blue-700', icon: Send, label: 'Enviado' },
  visto: { color: 'bg-amber-500/20 text-amber-700', icon: Eye, label: 'Visto' },
  firmado: { color: 'bg-green-500/20 text-green-700', icon: CheckCircle, label: 'Firmado' },
  rechazado: { color: 'bg-destructive/20 text-destructive', icon: Clock, label: 'Rechazado' },
  vencido: { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'Vencido' }
};

export function ContractsTab({ candidatoId, candidatoNombre, vehiculoPropio: initialVehiculoPropio = false, tieneVehiculo = true }: Props) {
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoContrato | null>(null);
  const [signContrato, setSignContrato] = useState<any>(null);
  const [previewContrato, setPreviewContrato] = useState<any>(null);
  const [deleteContrato, setDeleteContrato] = useState<{ id: string; tipo: TipoContrato } | null>(null);
  const [esNoPropietario, setEsNoPropietario] = useState(!initialVehiculoPropio);

  const vehiculoPropio = !esNoPropietario;

  const { data: contratos, isLoading } = useContratosCandidato(candidatoId);
  const { data: plantillas } = usePlantillasContrato();
  const { firmados, totalRequeridos, porcentaje, contratosFaltantes } = useContratosProgress(candidatoId, vehiculoPropio, tieneVehiculo);
  const eliminarContrato = useEliminarContrato();

  const contratosRequeridos = getContratosRequeridosParaCandidato(vehiculoPropio, tieneVehiculo);

  const getContratoPorTipo = (tipo: TipoContrato) => {
    return contratos?.find(c => c.tipo_contrato === tipo && c.estado !== 'rechazado' && c.estado !== 'vencido');
  };

  const handleGenerar = (tipo: TipoContrato) => {
    setSelectedTipo(tipo);
    setGenerateDialogOpen(true);
  };

  const handleUpload = (tipo: TipoContrato) => {
    setSelectedTipo(tipo);
    setUploadDialogOpen(true);
  };

  const handleEliminar = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deleteContrato) return;
    try {
      await eliminarContrato.mutateAsync({ contratoId: deleteContrato.id, candidatoId });
      setDeleteContrato(null);
    } catch {
      // error handled by mutation
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
        {contratosRequeridos.map((tipo) => {
          // For unified "Contrato Custodio" card: show checkbox for propietario/no-propietario
          const isContratoServicio = tipo === 'prestacion_servicios_propietario' || tipo === 'prestacion_servicios_no_propietario';
          const contrato = getContratoPorTipo(tipo);
          const plantilla = plantillas?.find(p => p.tipo_contrato === tipo);
          const estadoConfig = contrato ? ESTADO_CONFIG[contrato.estado] : null;
          const IconComponent = estadoConfig?.icon || FileSignature;
          const esFisico = (contrato as any)?.es_documento_fisico;

          return (
            <Card key={tipo} className={contrato?.firmado ? 'border-l-4 border-l-green-500' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    {isContratoServicio ? 'Contrato Custodio' : CONTRATO_LABELS[tipo]}
                  </span>
                  <div className="flex items-center gap-1">
                    {esFisico && (
                      <Badge variant="outline" className="text-xs">
                        📄 Documento físico
                      </Badge>
                    )}
                    {estadoConfig && (
                      <Badge className={estadoConfig.color}>
                        <IconComponent className="h-3 w-3 mr-1" />
                        {estadoConfig.label}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isContratoServicio && !contrato && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <Checkbox
                      id={`no-propietario-${tipo}`}
                      checked={esNoPropietario}
                      onCheckedChange={(checked) => setEsNoPropietario(!!checked)}
                    />
                    <label htmlFor={`no-propietario-${tipo}`} className="text-xs cursor-pointer">
                      El custodio NO es propietario del vehículo
                    </label>
                  </div>
                )}
                {contrato ? (
                  <div className="space-y-3">
                    {contrato.fecha_envio && (
                      <p className="text-xs text-muted-foreground">
                        {esFisico ? 'Subido' : 'Enviado'}: {format(new Date(contrato.fecha_envio), "d MMM yyyy HH:mm", { locale: es })}
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
                        <>
                          <Button 
                            size="sm"
                            onClick={() => setSignContrato(contrato)}
                          >
                            <FileSignature className="h-3 w-3 mr-1" />
                            Firmar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpload(tipo)}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Subir Firmado
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteContrato({ id: contrato.id, tipo: contrato.tipo_contrato as TipoContrato, firmado: contrato.firmado })}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {plantilla && (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleGenerar(tipo)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Generar Contrato
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className={plantilla ? '' : 'flex-1'}
                      onClick={() => handleUpload(tipo)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Firmado
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteContrato} onOpenChange={(open) => !open && setDeleteContrato(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el {deleteContrato ? CONTRATO_LABELS[deleteContrato.tipo] : ''} generado. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEliminar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Upload Dialog */}
      {selectedTipo && (
        <ContractUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          candidatoId={candidatoId}
          tipoContrato={selectedTipo}
          onSuccess={() => setUploadDialogOpen(false)}
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
