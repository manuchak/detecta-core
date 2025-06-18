
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Phone, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ProgramacionInstalacion } from '@/types/instaladores';
import { AsignarInstaladorDialog } from './AsignarInstaladorDialog';

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

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
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
          </div>

          <div className="flex gap-2 pt-2">
            {!programacion.instalador_id && programacion.estado === 'programada' && (
              <Button 
                size="sm" 
                onClick={() => setShowAsignarDialog(true)}
                className="flex-1"
              >
                Asignar Instalador
              </Button>
            )}
            
            <Button variant="outline" size="sm">
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
    </>
  );
};
