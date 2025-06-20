
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Shield, Eye } from 'lucide-react';
import { DetalleServicioDialog } from '@/components/servicios/DetalleServicioDialog';

// Using a generic type since ServicioMonitoreo is not exported
interface ServicioMonitoreo {
  id: string;
  numero_servicio: string;
  estado_general: string;
  tipo_servicio: string;
  nombre_cliente: string;
  empresa?: string;
  direccion_cliente: string;
  cantidad_vehiculos?: number; // Made optional to match database schema
  prioridad: string;
  fecha_solicitud: string;
  fecha_limite_respuesta?: string;
}

interface ServiciosTableProps {
  servicios: ServicioMonitoreo[];
  isLoading: boolean;
  onProgramarInstalacion: (servicioId: string) => void;
}

export const ServiciosTable = ({ 
  servicios, 
  isLoading,
  onProgramarInstalacion 
}: ServiciosTableProps) => {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string | null>(null);

  const getEstadoBadge = (estado: string) => {
    const config = {
      'pendiente_evaluacion': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente Evaluación' },
      'pendiente_analisis_riesgo': { color: 'bg-orange-100 text-orange-800', label: 'Pendiente Análisis' },
      'en_evaluacion_riesgo': { color: 'bg-blue-100 text-blue-800', label: 'En Evaluación' },
      'evaluacion_completada': { color: 'bg-green-100 text-green-800', label: 'Evaluación Completada' },
      'pendiente_aprobacion': { color: 'bg-purple-100 text-purple-800', label: 'Pendiente Aprobación' },
      'aprobado': { color: 'bg-green-100 text-green-800', label: 'Aprobado' },
      'programacion_instalacion': { color: 'bg-blue-100 text-blue-800', label: 'Programando Instalación' },
      'instalacion_programada': { color: 'bg-indigo-100 text-indigo-800', label: 'Instalación Programada' },
      'instalacion_completada': { color: 'bg-green-100 text-green-800', label: 'Instalación Completada' },
      'servicio_activo': { color: 'bg-green-100 text-green-800', label: 'Servicio Activo' },
      'rechazado': { color: 'bg-red-100 text-red-800', label: 'Rechazado' },
      'cancelado': { color: 'bg-gray-100 text-gray-800', label: 'Cancelado' },
      'suspendido': { color: 'bg-red-100 text-red-800', label: 'Suspendido' }
    };

    const item = config[estado as keyof typeof config] || { color: 'bg-gray-100 text-gray-800', label: estado };
    return <Badge className={item.color}>{item.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {servicios.map((servicio) => (
          <Card key={servicio.id} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-lg text-gray-900">
                      {servicio.numero_servicio}
                    </span>
                    {getEstadoBadge(servicio.estado_general)}
                    <Badge variant="outline" className="text-blue-600">
                      {servicio.tipo_servicio}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{servicio.nombre_cliente}</p>
                      <p className="text-sm text-gray-600">{servicio.empresa || 'Sin empresa'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{servicio.direccion_cliente}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Vehículos: {servicio.cantidad_vehiculos || 1}</p>
                      <p>Prioridad: <span className="capitalize">{servicio.prioridad}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Solicitud: {new Date(servicio.fecha_solicitud).toLocaleDateString('es-ES')}</span>
                    {servicio.fecha_limite_respuesta && (
                      <span>Límite: {new Date(servicio.fecha_limite_respuesta).toLocaleDateString('es-ES')}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <DetalleServicioDialog servicioId={servicio.id}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </Button>
                  </DetalleServicioDialog>
                  
                  {(servicio.estado_general === 'aprobado' || 
                    servicio.estado_general === 'programacion_instalacion') && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onProgramarInstalacion(servicio.id)}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Programar GPS
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {servicios.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay servicios registrados
            </h3>
            <p className="text-gray-600">
              Los servicios aparecerán aquí una vez que sean creados
            </p>
          </div>
        )}
      </div>
    </>
  );
};
