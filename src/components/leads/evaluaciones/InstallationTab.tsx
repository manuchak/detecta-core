import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProgramacionInstalacionesCandidato } from '@/hooks/useProgramacionInstalacionesCandidato';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Wrench, 
  Calendar, 
  MapPin, 
  User, 
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import { ScheduleInstallationDialog } from './ScheduleInstallationDialog';

interface InstallationTabProps {
  candidatoId: string;
  candidatoNombre?: string;
}

const estadoBadge = {
  pendiente: { variant: 'secondary' as const, label: 'Pendiente', icon: Clock },
  confirmada: { variant: 'default' as const, label: 'Confirmada', icon: CheckCircle2 },
  en_proceso: { variant: 'default' as const, label: 'En proceso', icon: Wrench },
  completada: { variant: 'default' as const, label: 'Completada', icon: CheckCircle2 },
  cancelada: { variant: 'destructive' as const, label: 'Cancelada', icon: AlertCircle }
};

export const InstallationTab = ({ candidatoId, candidatoNombre }: InstallationTabProps) => {
  const { instalaciones, isLoading, ultimaInstalacion, instalacionCompletada, updateEstado } = 
    useProgramacionInstalacionesCandidato(candidatoId);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado general */}
      <Card className={`border-2 ${
        instalacionCompletada 
          ? 'border-green-500/50 bg-green-50/50' 
          : 'border-border'
      }`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Estado de Instalación GPS
            </span>
            {instalacionCompletada ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completada
              </Badge>
            ) : (
              <Badge variant="secondary">Pendiente</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {instalacionCompletada ? (
            <p className="text-sm text-muted-foreground">
              La instalación del GPS ha sido completada exitosamente. 
              El estado de liberación se ha actualizado automáticamente.
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {ultimaInstalacion 
                  ? 'Hay una instalación programada o en proceso.'
                  : 'No hay instalaciones programadas para este candidato.'}
              </p>
              <Button onClick={() => setShowScheduleDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Programar Instalación
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de instalaciones */}
      {instalaciones && instalaciones.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Historial de Instalaciones</h3>
          
          {instalaciones.map((instalacion) => {
            const estado = estadoBadge[instalacion.estado] || estadoBadge.pendiente;
            const EstadoIcon = estado.icon;
            
            return (
              <Card key={instalacion.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={estado.variant}>
                          <EstadoIcon className="h-3 w-3 mr-1" />
                          {estado.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ID: {instalacion.id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(instalacion.fecha_programada), "PPP", { locale: es })}
                          </span>
                        </div>
                        
                        {instalacion.hora_inicio && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{instalacion.hora_inicio} - {instalacion.hora_fin}</span>
                          </div>
                        )}

                        {instalacion.direccion_instalacion && (
                          <div className="flex items-center gap-2 col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{instalacion.direccion_instalacion}</span>
                          </div>
                        )}

                        {instalacion.instalador && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{instalacion.instalador.nombre}</span>
                          </div>
                        )}

                        {instalacion.instalador?.telefono && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{instalacion.instalador.telefono}</span>
                          </div>
                        )}
                      </div>

                      {instalacion.notas && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {instalacion.notas}
                        </p>
                      )}
                    </div>

                    {/* Acciones según estado */}
                    {instalacion.estado !== 'completada' && instalacion.estado !== 'cancelada' && (
                      <div className="flex gap-2">
                        {instalacion.estado === 'pendiente' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateEstado.mutate({ 
                              instalacionId: instalacion.id, 
                              estado: 'confirmada' 
                            })}
                          >
                            Confirmar
                          </Button>
                        )}
                        {(instalacion.estado === 'confirmada' || instalacion.estado === 'en_proceso') && (
                          <Button 
                            size="sm"
                            onClick={() => updateEstado.mutate({ 
                              instalacionId: instalacion.id, 
                              estado: 'completada',
                              fecha_completada: new Date().toISOString()
                            })}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Marcar Completada
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {(!instalaciones || instalaciones.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">Sin instalaciones programadas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Programa la instalación del GPS para este candidato
            </p>
            <Button onClick={() => setShowScheduleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Programar Primera Instalación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de programación */}
      <ScheduleInstallationDialog
        open={showScheduleDialog}
        onClose={() => setShowScheduleDialog(false)}
        candidatoId={candidatoId}
        candidatoNombre={candidatoNombre}
      />
    </div>
  );
};
