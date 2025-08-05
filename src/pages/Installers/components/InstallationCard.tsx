
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Phone, Settings, Wrench, Zap, CheckCircle, XCircle, Play, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ProgramacionInstalacion } from '@/types/instaladores';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { AsignarInstaladorDialog } from './AsignarInstaladorDialog';
import { EditInstallationDialog } from './EditInstallationDialog';

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
  const [showAsignarDialog, setShowAsignarDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { updateEstadoInstalacion } = useProgramacionInstalaciones();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateEstadoInstalacion.mutateAsync({
        id: programacion.id,
        estado: newStatus,
        observaciones: programacion.observaciones_cliente
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusActions = () => {
    const actions = [];
    
    if (programacion.estado === 'programada') {
      actions.push(
        <Button
          key="confirm"
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange('confirmada')}
          className="text-green-700 border-green-200 hover:bg-green-50 flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3" />
          Confirmar
        </Button>
      );
    }
    
    if (['programada', 'confirmada'].includes(programacion.estado)) {
      actions.push(
        <Button
          key="start"
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange('en_proceso')}
          className="text-blue-700 border-blue-200 hover:bg-blue-50 flex items-center gap-1"
        >
          <Play className="h-3 w-3" />
          Iniciar
        </Button>
      );
    }
    
    if (programacion.estado === 'en_proceso') {
      actions.push(
        <Button
          key="complete"
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange('completada')}
          className="text-green-700 border-green-200 hover:bg-green-50 flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3" />
          Completar
        </Button>
      );
    }
    
    if (!['completada', 'cancelada'].includes(programacion.estado)) {
      actions.push(
        <Button
          key="cancel"
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange('cancelada')}
          className="text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1"
        >
          <XCircle className="h-3 w-3" />
          Cancelar
        </Button>
      );
    }
    
    return actions;
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20"
            style={{ borderLeftColor: programacion.estado === 'completada' ? '#22c55e' : 
                                      programacion.estado === 'en_proceso' ? '#f59e0b' :
                                      programacion.estado === 'confirmada' ? '#3b82f6' :
                                      programacion.estado === 'cancelada' ? '#ef4444' : '#6b7280' }}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {programacion.servicio?.numero_servicio || 'Sin número'}
              </CardTitle>
              <CardDescription>
                {programacion.servicio?.nombre_cliente || 'Cliente no especificado'}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1">
              <Badge className={getEstadoColor(programacion.estado)}>
                {programacion.estado}
              </Badge>
              <Badge variant="outline" className={getPrioridadColor(programacion.prioridad)}>
                {programacion.prioridad}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(programacion.fecha_programada), 'PPP', { locale: es })}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(programacion.fecha_programada), 'HH:mm')} 
                ({programacion.tiempo_estimado} min)
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="truncate" title={programacion.direccion_instalacion}>
                {programacion.direccion_instalacion}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{programacion.contacto_cliente} - {programacion.telefono_contacto}</span>
            </div>

            {programacion.instalador ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{programacion.instalador.nombre_completo}</span>
                <Badge variant="outline" className="text-xs">
                  ⭐ {programacion.instalador.calificacion_promedio}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <User className="h-4 w-4" />
                <span>Sin asignar</span>
              </div>
            )}

            {/* Información adicional */}
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Zap className="h-4 w-4" />
              <span className="capitalize">{programacion.tipo_instalacion.replace('_', ' ')}</span>
            </div>

            {(programacion.herramientas_especiales?.length > 0 || 
              programacion.requiere_vehiculo_elevado || 
              programacion.acceso_restringido) && (
              <div className="flex items-start gap-2 text-sm text-amber-600">
                <Wrench className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {programacion.herramientas_especiales?.length > 0 && (
                    <div>Herramientas: {programacion.herramientas_especiales.join(', ')}</div>
                  )}
                  {programacion.requiere_vehiculo_elevado && (
                    <div>Requiere vehículo elevado</div>
                  )}
                  {programacion.acceso_restringido && (
                    <div>Acceso restringido</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-3 border-t bg-gray-50/50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">
            {getStatusActions()}
            
            {!programacion.instalador_id && programacion.estado === 'programada' && (
              <Button 
                size="sm" 
                onClick={() => setShowAsignarDialog(true)}
                className="bg-primary hover:bg-primary/90 text-white flex items-center gap-1"
              >
                <User className="h-3 w-3" />
                Asignar Instalador
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {programacion.observaciones_cliente && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                <strong>Observaciones:</strong> {programacion.observaciones_cliente}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AsignarInstaladorDialog
        open={showAsignarDialog}
        onOpenChange={setShowAsignarDialog}
        programacion={programacion}
      />

      <EditInstallationDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        programacion={programacion}
      />
    </>
  );
};
