
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertCircle, Eye, Calendar, User, Phone, Mail } from 'lucide-react';
import { useAprobacionesWorkflow } from '@/hooks/useAprobacionesWorkflow';
import type { AprobacionCoordinador } from '@/types/serviciosMonitoreoCompleto';

export const PanelAprobacionCoordinador = () => {
  const { serviciosPendientesCoordinador, loadingCoordinador, crearAprobacionCoordinador } = useAprobacionesWorkflow();
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AprobacionCoordinador>>({});
  const [viendoDetalle, setViendoDetalle] = useState<string | null>(null);

  const handleAprobacion = async (estado: 'aprobado' | 'rechazado' | 'requiere_aclaracion') => {
    if (!servicioSeleccionado) return;

    await crearAprobacionCoordinador.mutateAsync({
      ...formData,
      servicio_id: servicioSeleccionado,
      estado_aprobacion: estado
    });

    setServicioSeleccionado(null);
    setFormData({});
  };

  const criteriosValidacion = [
    { key: 'modelo_vehiculo_compatible', label: 'Modelo de vehículo compatible con instalación GPS' },
    { key: 'cobertura_celular_verificada', label: 'Cobertura celular verificada en zonas de operación' },
    { key: 'requiere_instalacion_fisica', label: 'Requiere instalación física en taller especializado' },
    { key: 'acceso_instalacion_disponible', label: 'Cliente tiene acceso disponible para instalación' },
    { key: 'restricciones_tecnicas_sla', label: 'No hay restricciones técnicas que afecten SLA' },
    { key: 'contactos_emergencia_validados', label: 'Contactos de emergencia validados y confirmados' }
  ];

  if (loadingCoordinador) {
    return <div className="p-6">Cargando servicios pendientes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Panel de Aprobación - Coordinador de Operaciones</h2>
        <Badge variant="outline" className="text-blue-600">
          {serviciosPendientesCoordinador?.length || 0} servicios pendientes
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de servicios pendientes */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios Pendientes de Aprobación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviciosPendientesCoordinador?.map((servicio) => (
              <div
                key={servicio.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  servicioSeleccionado === servicio.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{servicio.numero_servicio}</span>
                    <Badge variant="outline">{servicio.tipo_servicio}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViendoDetalle(servicio.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setServicioSeleccionado(servicio.id)}
                    >
                      Evaluar
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{servicio.nombre_cliente}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(servicio.fecha_solicitud).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{servicio.telefono_contacto}</span>
                  </div>
                </div>
              </div>
            ))}

            {(!serviciosPendientesCoordinador || serviciosPendientesCoordinador.length === 0) && (
              <p className="text-gray-500 text-center py-8">No hay servicios pendientes de aprobación</p>
            )}
          </CardContent>
        </Card>

        {/* Formulario de evaluación */}
        {servicioSeleccionado && (
          <Card>
            <CardHeader>
              <CardTitle>Evaluación del Coordinador de Operaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Criterios de Validación Técnica</h4>
                {criteriosValidacion.map((criterio) => (
                  <div key={criterio.key} className="flex items-start space-x-3">
                    <Checkbox
                      checked={formData[criterio.key as keyof AprobacionCoordinador] as boolean || false}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, [criterio.key]: checked }))
                      }
                    />
                    <label className="text-sm font-medium leading-5">
                      {criterio.label}
                    </label>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Elementos a aclarar con el cliente (opcional)
                </label>
                <Textarea
                  placeholder="Describir cualquier punto que requiera aclaración con el cliente..."
                  value={formData.elementos_aclarar_cliente || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    elementos_aclarar_cliente: e.target.value 
                  }))}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Observaciones generales
                </label>
                <Textarea
                  placeholder="Observaciones adicionales sobre el servicio..."
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    observaciones: e.target.value 
                  }))}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button
                  onClick={() => handleAprobacion('aprobado')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={crearAprobacionCoordinador.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
                <Button
                  onClick={() => handleAprobacion('requiere_aclaracion')}
                  variant="outline"
                  className="flex-1"
                  disabled={crearAprobacionCoordinador.isPending}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Requiere Aclaración
                </Button>
                <Button
                  onClick={() => handleAprobacion('rechazado')}
                  variant="destructive"
                  className="flex-1"
                  disabled={crearAprobacionCoordinador.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
