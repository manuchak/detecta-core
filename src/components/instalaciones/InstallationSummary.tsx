// @ts-nocheck
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Calendar, 
  Car, 
  MapPin, 
  User, 
  Package, 
  Cpu, 
  CreditCard, 
  HardDrive,
  Download,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEnhancedKitsInstalacion } from '@/hooks/useEnhancedKitsInstalacion';

interface InstallationSummaryProps {
  programacionId: string;
  formData: any;
  kitConfiguration: any;
  onComplete: () => void;
}

export const InstallationSummary = ({ 
  programacionId,
  formData,
  kitConfiguration,
  onComplete
}: InstallationSummaryProps) => {
  const [kitDetails, setKitDetails] = useState<any>(null);
  const { kitAsignado } = useEnhancedKitsInstalacion();

  useEffect(() => {
    // Simulate loading kit details
    if (kitAsignado && Array.isArray(kitAsignado)) {
      const assignedKit = kitAsignado.find(kit => kit.programacion_id === programacionId);
      setKitDetails(assignedKit);
    }
  }, [kitAsignado, programacionId]);

  const generateInstallationReport = () => {
    // This would generate a PDF or printable report
    console.log('Generating installation report for:', programacionId);
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              ¡Instalación Programada Exitosamente!
            </h3>
            <p className="text-green-600">
              El kit ha sido asignado y la instalación está lista para ejecutarse
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Installation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información de la Instalación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Fecha Programada</p>
              <p className="font-semibold">
                {formData.fecha_programada ? 
                  format(new Date(formData.fecha_programada), "PPP", { locale: es }) : 
                  'No especificada'
                }
              </p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-semibold">{formData.contacto_cliente}</p>
              <p className="text-sm">{formData.telefono_contacto}</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-muted-foreground">Dirección</p>
              <p className="font-semibold">{formData.direccion_instalacion}</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-muted-foreground">Tiempo Estimado</p>
              <p className="font-semibold">{formData.tiempo_estimado} minutos</p>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Información del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Vehículo</p>
              <p className="font-semibold">
                {formData.vehiculo_marca} {formData.vehiculo_modelo} {formData.vehiculo_año}
              </p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-muted-foreground">Combustible</p>
              <p className="font-semibold capitalize">{formData.tipo_combustible}</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Instalación</p>
              <Badge variant="outline" className="font-semibold">
                {formData.tipo_instalacion.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-muted-foreground">Sensores Requeridos</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.sensores_requeridos.map((sensor: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {sensor.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kit Assignment Details */}
      {kitDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Kit Asignado - {kitDetails.numero_serie_kit}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* GPS Device */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-700">GPS Device</h4>
                  </div>
                  <p className="text-sm font-medium">{kitDetails.gps_producto?.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {kitDetails.gps_producto?.marca} {kitDetails.gps_producto?.modelo}
                  </p>
                </CardContent>
              </Card>

              {/* SIM Card */}
              {kitDetails.sim_producto && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-orange-700">SIM Card</h4>
                    </div>
                    <p className="text-sm font-medium">{kitDetails.sim_producto.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {kitDetails.sim_producto.marca}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* MicroSD */}
              {kitDetails.microsd_producto && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-700">MicroSD</h4>
                    </div>
                    <p className="text-sm font-medium">{kitDetails.microsd_producto.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {kitDetails.microsd_producto.marca}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Kit Status */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Estado del Kit</p>
                <Badge 
                  variant={kitDetails.estado_kit === 'asignado' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {kitDetails.estado_kit}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Score de Recomendación</p>
                <p className="font-semibold text-lg">{kitDetails.score_recomendacion}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      {formData.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{formData.observaciones}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={generateInstallationReport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar Reporte
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.print()}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>

        <Button 
          onClick={onComplete}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Finalizar
        </Button>
      </div>
    </div>
  );
};