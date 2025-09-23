import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin, Clock, User, Shield, Car, Phone, Copy, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useCustodioVehicleData } from '@/hooks/useCustodioVehicleData';

interface AssignmentConfirmationData {
  servicio: {
    cliente_nombre: string;
    origen: string;
    destino: string;
    fecha_programada: string;
    hora_ventana_inicio: string;
    custodio_nombre: string;
    tipo_servicio: string;
  };
  armado: {
    nombre: string;
    tipo_asignacion: 'interno' | 'proveedor';
  };
  encuentro: {
    punto_encuentro: string;
    hora_encuentro: string;
  };
}

interface AssignmentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onCreateNew: () => void;
  data: AssignmentConfirmationData;
}

export function AssignmentConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  onCreateNew,
  data
}: AssignmentConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  
  // Obtener datos del vehículo del custodio
  const { vehicleData, loading: vehicleLoading, formatVehicleInfo } = useCustodioVehicleData(
    data.servicio.custodio_nombre
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      toast.success('Asignación confirmada y registrada exitosamente');
      // El onConfirm ya debe cerrar el modal y limpiar el formulario
    } catch (error) {
      console.error('Error confirming assignment:', error);
      toast.error('Error al confirmar la asignación');
    } finally {
      setIsConfirming(false);
    }
  };

  const generateClientMessage = () => {
    const message = `🛡️ CONFIRMACIÓN DE SERVICIO DE CUSTODIA

📋 DETALLES DEL SERVICIO:
Cliente: ${data.servicio.cliente_nombre}
Ruta: ${data.servicio.origen} → ${data.servicio.destino}
Fecha: ${format(new Date(data.servicio.fecha_programada), 'PPP', { locale: es })}
Hora del servicio: ${data.servicio.hora_ventana_inicio}
Tipo de servicio: ${data.servicio.tipo_servicio}

👤 CUSTODIO ASIGNADO (DATOS PARA ACCESO AL CEDIS):
Nombre: ${data.servicio.custodio_nombre}
Vehículo: ${formatVehicleInfo()}

🛡️ ARMADO ASIGNADO:
Nombre: ${data.armado.nombre}
Tipo: ${data.armado.tipo_asignacion === 'interno' ? 'Armado Interno' : 'Proveedor Externo'}

✅ INFORMACIÓN IMPORTANTE:
- Su servicio ha sido confirmado exitosamente
- Los datos del custodio y vehículo son necesarios para el acceso al CEDIS
- El armado acompañará al custodio durante todo el servicio
- Conserve estos datos para consultas futuras

Para cualquier duda o emergencia, contacte a nuestro centro de operaciones.`;

    return message;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Asignación Completada Exitosamente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Summary */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Resumen del Servicio</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="ml-2 font-medium">{data.servicio.cliente_nombre}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="ml-2 font-medium">{data.servicio.tipo_servicio}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="ml-2 font-medium">
                    {format(new Date(data.servicio.fecha_programada), 'PPP', { locale: es })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hora:</span>
                  <span className="ml-2 font-medium">{data.servicio.hora_ventana_inicio}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{data.servicio.origen}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{data.servicio.destino}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custodian Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Custodio Asignado</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="ml-2 font-medium">{data.servicio.custodio_nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>Vehículo:</strong> 
                      {vehicleLoading ? (
                        <span className="ml-1 text-muted-foreground">Cargando...</span>
                      ) : (
                        <span className="ml-1">{formatVehicleInfo()}</span>
                      )}
                      {vehicleData?.fuente === 'servicios_custodia' && (
                        <span className="ml-1 text-xs text-amber-600">(datos históricos)</span>
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Armed Guard Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Armado Asignado</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="ml-2 font-medium">{data.armado.nombre}</span>
                  </div>
                  <div>
                    <Badge variant={data.armado.tipo_asignacion === 'interno' ? 'success' : 'secondary'}>
                      {data.armado.tipo_asignacion === 'interno' ? 'Armado Interno' : 'Proveedor Externo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meeting Details - Solo para operaciones internas */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-amber-800">Coordinación Interna</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Punto de encuentro (interno):</span>
                  <span className="ml-2 font-medium">{data.encuentro.punto_encuentro}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hora de encuentro (interno):</span>
                  <span className="ml-2 font-medium">{data.encuentro.hora_encuentro}</span>
                </div>
              </div>
              <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-700">
                <Info className="h-3 w-3 inline mr-1" />
                Esta información es solo para coordinación interna. No se incluye en el mensaje al cliente.
              </div>
            </CardContent>
          </Card>

          {/* Client Notification Template */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Mensaje para el Cliente</span>
                <Button
                  onClick={() => copyToClipboard(generateClientMessage())}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                {generateClientMessage()}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button onClick={onClose} variant="outline" disabled={isConfirming}>
            Cerrar
          </Button>
          <Button onClick={onCreateNew} variant="outline" disabled={isConfirming}>
            Crear Nuevo Servicio
          </Button>
          <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700" disabled={isConfirming}>
            {isConfirming ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {isConfirming ? 'Guardando...' : 'Confirmar y Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}