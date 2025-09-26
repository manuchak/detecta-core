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
    id_servicio: string;
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
  const [copyingStates, setCopyingStates] = React.useState<{
    client: boolean;
    custodian: boolean;
  }>({ client: false, custodian: false });
  
  // Obtener datos del vehículo del custodio
  const { vehicleData, loading: vehicleLoading, formatVehicleInfo } = useCustodioVehicleData(
    data.servicio.custodio_nombre
  );

  const copyToClipboard = async (text: string, type: 'client' | 'custodian') => {
    // Set loading state
    setCopyingStates(prev => ({ ...prev, [type]: true }));
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      toast.success('Mensaje copiado al portapapeles correctamente', {
        description: type === 'client' ? 'Mensaje para cliente listo para enviar' : 'Mensaje para custodio listo para enviar',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Error al copiar al portapapeles', {
        description: 'Por favor, intenta seleccionar y copiar manualmente',
        duration: 4000,
      });
    } finally {
      // Reset loading state after a brief delay
      setTimeout(() => {
        setCopyingStates(prev => ({ ...prev, [type]: false }));
      }, 1000);
    }
  };

  const generateGoogleMapsLink = (address: string): string => {
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.google.com/?q=${encodedAddress}`;
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
ID Servicio: ${data.servicio.id_servicio}
Cliente: ${data.servicio.cliente_nombre}
Punto de inicio: ${data.servicio.origen}
Destino: ${data.servicio.destino}
Fecha: ${format(new Date(data.servicio.fecha_programada), 'PPP', { locale: es })}
Hora programada: ${data.servicio.hora_ventana_inicio}
Tipo de servicio: ${data.servicio.tipo_servicio}

👤 CUSTODIO ASIGNADO (DATOS PARA ACCESO AL CEDIS):
Nombre: ${data.servicio.custodio_nombre}
Vehículo: ${formatVehicleInfo()}

🛡️ PERSONAL DE SEGURIDAD ASIGNADO:
Nombre: ${data.armado.nombre}

✅ INFORMACIÓN IMPORTANTE:
- Su servicio ha sido confirmado exitosamente
- Los datos del custodio y vehículo son necesarios para el acceso al CEDIS
- El personal de seguridad acompañará al custodio durante todo el servicio
- Conserve estos datos para consultas futuras

Para cualquier duda o emergencia, contacte a nuestro centro de operaciones.`;

    return message;
  };

  const generateCustodianMessage = () => {
    const message = `🛡️ ASIGNACIÓN DE SERVICIO - ${format(new Date(data.servicio.fecha_programada), 'PPP', { locale: es })}

🆔 ID SERVICIO: ${data.servicio.id_servicio}
👤 CUSTODIO: ${data.servicio.custodio_nombre}
🎯 CLIENTE: ${data.servicio.cliente_nombre} | ${data.servicio.tipo_servicio}

📍 PUNTO DE INICIO: ${data.servicio.origen}
🔗 Ver ubicación: ${generateGoogleMapsLink(data.servicio.origen)}
🕒 Hora programada: ${data.servicio.hora_ventana_inicio}

🎯 DESTINO: ${data.servicio.destino}
🔗 Ver ubicación: ${generateGoogleMapsLink(data.servicio.destino)}

🛡️ PERSONAL DE SEGURIDAD ASIGNADO:
Nombre: ${data.armado.nombre}
${data.armado.tipo_asignacion === 'interno' ? `📍 Encuentro: ${data.encuentro.punto_encuentro} a las ${data.encuentro.hora_encuentro}` : ''}

🚗 VEHÍCULO ASIGNADO:
${formatVehicleInfo()}

📱 COORDINACIÓN:
Para cualquier inconveniente o emergencia, contacta inmediatamente al centro de operaciones.

✅ IMPORTANTE:
- Confirma tu asistencia respondiendo este mensaje
- Llega 15 minutos antes de la hora programada
- Mantén comunicación constante con operaciones durante el servicio
- Asegúrate de que tu vehículo esté en condiciones óptimas`;

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
                  <span className="text-muted-foreground">ID Servicio:</span>
                  <span className="ml-2 font-medium font-mono text-blue-600">{data.servicio.id_servicio}</span>
                </div>
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
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Punto de inicio:</span>
                    <span className="font-medium">{data.servicio.origen}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(generateGoogleMapsLink(data.servicio.origen), '_blank')}
                    >
                      Ver en Maps
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Destino:</span>
                    <span className="font-medium">{data.servicio.destino}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(generateGoogleMapsLink(data.servicio.destino), '_blank')}
                    >
                      Ver en Maps
                    </Button>
                  </div>
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
                    <span className="text-muted-foreground">Clasificación (interna):</span>
                    <Badge variant={data.armado.tipo_asignacion === 'interno' ? 'success' : 'secondary'} className="ml-2">
                      {data.armado.tipo_asignacion === 'interno' ? 'Personal Interno' : 'Proveedor Externo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meeting Details - Solo para coordinación interna */}
          {data.armado.tipo_asignacion === 'interno' && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-800">Coordinación Interna</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Punto de encuentro:</span>
                    <span className="ml-2 font-medium">{data.encuentro.punto_encuentro}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hora de encuentro:</span>
                    <span className="ml-2 font-medium">{data.encuentro.hora_encuentro}</span>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-700">
                  <Info className="h-3 w-3 inline mr-1" />
                  Esta información es exclusivamente para coordinación interna. No se incluye en comunicaciones al cliente.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Notification Template */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Mensaje para el Cliente</span>
                <Button
                  onClick={() => copyToClipboard(generateClientMessage(), 'client')}
                  variant="outline"
                  size="sm"
                  disabled={copyingStates.client}
                  className={copyingStates.client ? 'bg-green-50 border-green-200' : ''}
                >
                  {copyingStates.client ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                      Copiando...
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar mensaje
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                {generateClientMessage()}
              </div>
            </CardContent>
          </Card>

          {/* Custodian Notification Template */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Mensaje para el Custodio</span>
                </div>
                <Button
                  onClick={() => copyToClipboard(generateCustodianMessage(), 'custodian')}
                  variant="outline"
                  size="sm"
                  disabled={copyingStates.custodian}
                  className={copyingStates.custodian ? 'bg-green-50 border-green-200' : ''}
                >
                  {copyingStates.custodian ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                      Copiando...
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar mensaje
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-blue-100/50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap border border-blue-200">
                {generateCustodianMessage()}
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