import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, Calendar, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FormularioServicioCompleto } from '@/components/servicios/FormularioServicioCompleto';
import { ProgramarInstalacionDialog } from '@/pages/Installers/components/ProgramarInstalacionDialog';
import { AnalisisRiesgoDialog } from './AnalisisRiesgoDialog';
import { DetalleServicioDialog } from '@/components/servicios/DetalleServicioDialog';
import { useServiciosMonitoreo } from '@/hooks/useServiciosMonitoreo';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ServicioMonitoreo } from '@/types/serviciosMonitoreo';

interface ServiciosTableProps {
  servicios: ServicioMonitoreo[];
  isLoading: boolean;
  onAnalisisRiesgo: (servicioId: string) => void;
  onProgramarInstalacion: (servicioId: string) => void;
}

export const ServiciosTable = ({ servicios, isLoading, onAnalisisRiesgo, onProgramarInstalacion }: ServiciosTableProps) => {
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [showProgramarInstalacion, setShowProgramarInstalacion] = useState(false);
  const [showAnalisisRiesgo, setShowAnalisisRiesgo] = useState(false);
  const [selectedServicioId, setSelectedServicioId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const getEstadoBadge = (estado: string) => {
    const estadoConfig = {
      pendiente_evaluacion: { variant: 'destructive' as const, label: 'Requiere Evaluación', urgent: true },
      pendiente_analisis_riesgo: { variant: 'destructive' as const, label: 'Requiere Análisis', urgent: true },
      en_evaluacion_riesgo: { variant: 'secondary' as const, label: 'En Evaluación', urgent: false },
      evaluacion_completada: { variant: 'outline' as const, label: 'Evaluación Completada', urgent: false },
      pendiente_aprobacion: { variant: 'secondary' as const, label: 'Pendiente Aprobación', urgent: false },
      aprobado: { variant: 'default' as const, label: 'Aprobado', urgent: false },
      rechazado: { variant: 'destructive' as const, label: 'Rechazado', urgent: false },
      pendiente_instalacion: { variant: 'secondary' as const, label: 'Pendiente Instalación', urgent: false },
      instalacion_programada: { variant: 'outline' as const, label: 'Instalación Programada', urgent: false },
      instalacion_completada: { variant: 'default' as const, label: 'Instalación Completada', urgent: false },
      integracion_sistema: { variant: 'secondary' as const, label: 'Integración Sistema', urgent: false },
      servicio_activo: { variant: 'default' as const, label: 'Servicio Activo', urgent: false },
      suspendido: { variant: 'destructive' as const, label: 'Suspendido', urgent: false },
      cancelado: { variant: 'destructive' as const, label: 'Cancelado', urgent: false }
    };

    const config = estadoConfig[estado as keyof typeof estadoConfig] || estadoConfig.pendiente_evaluacion;
    return (
      <div className="flex items-center gap-2">
        <Badge variant={config.variant}>{config.label}</Badge>
        {config.urgent && <AlertTriangle className="h-4 w-4 text-red-500" />}
      </div>
    );
  };

  const getPrioridadBadge = (prioridad: string) => {
    const prioridadConfig = {
      baja: { variant: 'outline' as const, label: 'Baja' },
      media: { variant: 'secondary' as const, label: 'Media' },
      alta: { variant: 'default' as const, label: 'Alta' },
      critica: { variant: 'destructive' as const, label: 'Crítica' }
    };

    const config = prioridadConfig[prioridad as keyof typeof prioridadConfig] || prioridadConfig.media;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleDeleteServicio = async (servicioId: string) => {
    setDeletingId(servicioId);
    try {
      const { error } = await supabase
        .from('servicios_monitoreo')
        .delete()
        .eq('id', servicioId);

      if (error) throw error;

      toast({
        title: "Servicio eliminado",
        description: "El servicio ha sido eliminado exitosamente.",
      });

      // Refresh the services list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleProgramarInstalacion = (servicioId: string) => {
    setSelectedServicioId(servicioId);
    setShowProgramarInstalacion(true);
  };

  const handleAnalisisRiesgo = (servicioId: string) => {
    setSelectedServicioId(servicioId);
    setShowAnalisisRiesgo(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Servicios de Monitoreo GPS</CardTitle>
            <Button onClick={() => setShowNewServiceForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!servicios || servicios.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay servicios registrados
              </h3>
              <p className="text-gray-600 mb-4">
                Comience creando su primer servicio de monitoreo GPS
              </p>
              <Button onClick={() => setShowNewServiceForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Servicio
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicios.map((servicio) => (
                  <TableRow key={servicio.id}>
                    <TableCell className="font-mono text-sm">
                      {servicio.numero_servicio}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{servicio.nombre_cliente}</p>
                        {servicio.empresa && (
                          <p className="text-sm text-gray-600">{servicio.empresa}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {servicio.tipo_servicio}
                    </TableCell>
                    <TableCell>
                      {getPrioridadBadge(servicio.prioridad)}
                    </TableCell>
                    <TableCell>
                      {getEstadoBadge(servicio.estado_general)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(servicio.fecha_solicitud), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <DetalleServicioDialog servicioId={servicio.id}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DetalleServicioDialog>
                        
                        {(servicio.estado_general === 'pendiente_evaluacion' || 
                          servicio.estado_general === 'en_evaluacion_riesgo') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAnalisisRiesgo(servicio.id)}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {(servicio.estado_general === 'aprobado' || 
                          servicio.estado_general === 'pendiente_instalacion') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleProgramarInstalacion(servicio.id)}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={deletingId === servicio.id}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el servicio 
                                <strong> {servicio.numero_servicio}</strong> de <strong>{servicio.nombre_cliente}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteServicio(servicio.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FormularioServicioCompleto
        open={showNewServiceForm}
        onOpenChange={setShowNewServiceForm}
      />

      <ProgramarInstalacionDialog
        open={showProgramarInstalacion}
        onOpenChange={setShowProgramarInstalacion}
        servicioId={selectedServicioId}
      />

      <AnalisisRiesgoDialog
        open={showAnalisisRiesgo}
        onOpenChange={setShowAnalisisRiesgo}
        servicioId={selectedServicioId}
      />
    </div>
  );
};
