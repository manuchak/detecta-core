
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Phone, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ProgramacionInstalacion } from '@/types/instaladores';
import { AsignarInstaladorDialog } from './AsignarInstaladorDialog';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';

interface InstallationCardProps {
  programacion: ProgramacionInstalacion;
  getEstadoColor: (estado: string) => string;
  getPrioridadColor: (prioridad: string) => string;
}

export const InstallationCard: React.FC<InstallationCardProps> = ({
  programacion,
  getEstadoColor,
  getPrioridadColor
}) => {
  const { updateEstadoInstalacion } = useProgramacionInstalaciones();

  const handleEstadoChange = (nuevoEstado: string) => {
    updateEstadoInstalacion.mutate({
      id: programacion.id,
      estado: nuevoEstado
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm font-medium">
              {programacion.servicio?.numero_servicio || `Instalación ${programacion.id.slice(0, 8)}`}
            </CardTitle>
            <p className="text-xs text-gray-600 mt-1">
              {programacion.servicio?.nombre_cliente}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={getPrioridadColor(programacion.prioridad)}>
              {programacion.prioridad}
            </Badge>
            <Badge className={getEstadoColor(programacion.estado)}>
              {programacion.estado.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Información del tipo de instalación */}
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{programacion.tipo_instalacion.replace('_', ' ')}</span>
        </div>

        {/* Fecha programada */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{format(new Date(programacion.fecha_programada), 'PPP', { locale: es })}</span>
        </div>

        {/* Hora programada */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-gray-500" />
          <span>{format(new Date(programacion.fecha_programada), 'p', { locale: es })}</span>
          <span className="text-gray-400">
            (~{programacion.tiempo_estimado} min)
          </span>
        </div>

        {/* Dirección */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
          <span className="flex-1">{programacion.direccion_instalacion}</span>
        </div>

        {/* Contacto */}
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-gray-500" />
          <span>{programacion.contacto_cliente}</span>
          <span className="text-gray-400">({programacion.telefono_contacto})</span>
        </div>

        {/* Instalador asignado */}
        {programacion.instalador ? (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-green-500" />
            <span className="font-medium">{programacion.instalador.nombre_completo}</span>
            <Badge variant="outline" className="text-xs">
              ⭐ {programacion.instalador.calificacion_promedio.toFixed(1)}
            </Badge>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <User className="h-4 w-4" />
            <span>Sin instalador asignado</span>
          </div>
        )}

        {/* Observaciones */}
        {programacion.observaciones_cliente && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <strong>Observaciones:</strong> {programacion.observaciones_cliente}
          </div>
        )}

        {/* Alertas especiales */}
        <div className="flex gap-1">
          {programacion.requiere_vehiculo_elevado && (
            <Badge variant="secondary" className="text-xs">
              Vehículo elevado
            </Badge>
          )}
          {programacion.acceso_restringido && (
            <Badge variant="secondary" className="text-xs">
              Acceso restringido
            </Badge>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 mt-4">
          {!programacion.instalador_id && programacion.estado === 'programada' && (
            <AsignarInstaladorDialog programacion={programacion}>
              <Button size="sm" variant="outline" className="flex-1">
                Asignar Instalador
              </Button>
            </AsignarInstaladorDialog>
          )}
          
          {programacion.estado === 'confirmada' && (
            <Button 
              size="sm" 
              onClick={() => handleEstadoChange('en_proceso')}
              className="flex-1"
            >
              Iniciar
            </Button>
          )}
          
          {programacion.estado === 'en_proceso' && (
            <Button 
              size="sm" 
              onClick={() => handleEstadoChange('completada')}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Completar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
