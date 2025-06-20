
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, User, Phone, Mail, MapPin, Calendar, Settings, Shield, Clock } from 'lucide-react';
import { useAprobacionesWorkflow } from '@/hooks/useAprobacionesWorkflow';

interface DetalleServicioDialogProps {
  servicioId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export const DetalleServicioDialog = ({ 
  servicioId, 
  open, 
  onOpenChange, 
  children 
}: DetalleServicioDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { obtenerDetalleServicio } = useAprobacionesWorkflow();
  const { data: servicio, isLoading } = obtenerDetalleServicio(servicioId);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const getEstadoBadge = (estado: string) => {
    const estadoColors = {
      'pendiente_evaluacion': 'bg-yellow-100 text-yellow-800',
      'pendiente_analisis_riesgo': 'bg-orange-100 text-orange-800',
      'aprobado': 'bg-green-100 text-green-800',
      'rechazado_coordinador': 'bg-red-100 text-red-800',
      'rechazado_seguridad': 'bg-red-100 text-red-800',
      'requiere_aclaracion_cliente': 'bg-blue-100 text-blue-800'
    };
    
    return estadoColors[estado as keyof typeof estadoColors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Detalle del Servicio - {servicio?.numero_servicio}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 text-center">Cargando detalle del servicio...</div>
        ) : servicio ? (
          <div className="space-y-6">
            {/* Estado y información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Información General</span>
                  <Badge className={getEstadoBadge(servicio.estado_general)}>
                    {servicio.estado_general.replace('_', ' ').toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Cliente:</span>
                    <span>{servicio.nombre_cliente}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Teléfono:</span>
                    <span>{servicio.telefono_contacto}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Email:</span>
                    <span>{servicio.email_contacto}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Dirección:</span>
                    <span className="text-sm">{servicio.direccion_cliente}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Fecha Solicitud:</span>
                    <span>{new Date(servicio.fecha_solicitud).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Tipo Servicio:</span>
                    <span>{servicio.tipo_servicio}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información del vehículo */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Vehículo</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium">Cantidad:</span>
                  <p>{servicio.cantidad_vehiculos} vehículo(s)</p>
                </div>
                <div>
                  <span className="font-medium">Modelo:</span>
                  <p>{servicio.modelo_vehiculo || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>
                  <p>{servicio.tipo_vehiculo || 'No especificado'}</p>
                </div>
              </CardContent>
            </Card>

            {/* GPS Actual */}
            <Card>
              <CardHeader>
                <CardTitle>GPS Actual y Preferencias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Cuenta con GPS:</span>
                    <p>{servicio.cuenta_gps_instalado ? 'Sí' : 'No'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Botón de Pánico:</span>
                    <p>{servicio.cuenta_boton_panico ? 'Sí' : 'No'}</p>
                  </div>
                </div>
                {servicio.detalles_gps_actual && (
                  <div>
                    <span className="font-medium">Detalles GPS Actual:</span>
                    <p className="text-sm text-gray-600">{servicio.detalles_gps_actual}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contactos de Emergencia */}
            {servicio.contactos_emergencia_servicio && servicio.contactos_emergencia_servicio.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Contactos de Emergencia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {servicio.contactos_emergencia_servicio.map((contacto: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{contacto.nombre}</p>
                          <p className="text-sm text-gray-600">{contacto.telefono}</p>
                          {contacto.email && <p className="text-sm text-gray-600">{contacto.email}</p>}
                        </div>
                        <Badge variant="outline">{contacto.tipo_contacto}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Estados del workflow */}
            {(servicio.aprobacion_coordinador && servicio.aprobacion_coordinador.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Estado de Aprobación Coordinador
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {servicio.aprobacion_coordinador.map((aprobacion: any) => (
                    <div key={aprobacion.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getEstadoBadge(aprobacion.estado_aprobacion)}>
                          {aprobacion.estado_aprobacion.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(aprobacion.fecha_revision).toLocaleDateString()}
                        </span>
                      </div>
                      {aprobacion.observaciones && (
                        <p className="text-sm text-gray-600">{aprobacion.observaciones}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(servicio.analisis_riesgo_seguridad && servicio.analisis_riesgo_seguridad.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Análisis de Riesgo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {servicio.analisis_riesgo_seguridad.map((analisis: any) => (
                    <div key={analisis.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={analisis.calificacion_riesgo ? 
                          `bg-${analisis.calificacion_riesgo === 'bajo' ? 'green' : 
                             analisis.calificacion_riesgo === 'medio' ? 'yellow' : 'red'}-100 
                           text-${analisis.calificacion_riesgo === 'bajo' ? 'green' : 
                             analisis.calificacion_riesgo === 'medio' ? 'yellow' : 'red'}-800` :
                          'bg-gray-100 text-gray-800'}>
                          Riesgo: {analisis.calificacion_riesgo?.toUpperCase() || 'No calificado'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(analisis.fecha_analisis).toLocaleDateString()}
                        </span>
                      </div>
                      {analisis.recomendaciones && (
                        <div>
                          <span className="font-medium">Recomendaciones:</span>
                          <p className="text-sm text-gray-600">{analisis.recomendaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {servicio.observaciones && (
              <Card>
                <CardHeader>
                  <CardTitle>Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{servicio.observaciones}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No se pudo cargar el detalle del servicio
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
