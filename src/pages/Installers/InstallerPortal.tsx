
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Map, Timer, XCircle, Clock, MapPin, Phone, User, AlertTriangle, FileText, Edit } from "lucide-react";
import { useProgramacionInstalaciones } from "@/hooks/useProgramacionInstalaciones";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { ProcesoInstalacionDialog } from "@/components/instalacion/ProcesoInstalacionDialog";
import { useToast } from "@/hooks/use-toast";
import { FiltrosInteligentes } from "@/components/instalaciones/FiltrosInteligentes";
import { useAuth } from "@/contexts/AuthContext";
import { AsignarInstaladorDialog } from "@/components/instalaciones/AsignarInstaladorDialog";

export const InstallerPortal = () => {
  const { programaciones, isLoading, updateEstadoInstalacion, desasignarInstalador } = useProgramacionInstalaciones();
  const { user, userRole } = useAuth();
  const [instalacionSeleccionada, setInstalacionSeleccionada] = useState<string | null>(null);
  const [showProcesoDialog, setShowProcesoDialog] = useState(false);
  const [instalacionesFiltradas, setInstalacionesFiltradas] = useState<any[]>([]);
  const [showAsignarDialog, setShowAsignarDialog] = useState(false);
  const [instalacionParaAsignar, setInstalacionParaAsignar] = useState<any>(null);
  const { toast } = useToast();

  // Use filtered installations for calculations
  const instalacionesParaCalculo = instalacionesFiltradas.length > 0 ? instalacionesFiltradas : (programaciones || []);
  
  const instalacionesPendientes = instalacionesParaCalculo.filter(p => 
    p.estado === 'programada' || p.estado === 'confirmada'
  );

  const instalacionesEnProceso = instalacionesParaCalculo.filter(p => 
    p.estado === 'en_proceso'
  );

  const instalacionesCompletadas = instalacionesParaCalculo.filter(p => 
    p.estado === 'completada'
  );

  const instalacionesCanceladas = instalacionesParaCalculo.filter(p => 
    p.estado === 'cancelada'
  );

  const tiempoPromedio = instalacionesParaCalculo.length > 0 
    ? Math.round(instalacionesParaCalculo.reduce((acc, p) => acc + (p.tiempo_estimado || 60), 0) / instalacionesParaCalculo.length / 60 * 10) / 10
    : 0;

  const dispositivosInstalados = instalacionesCompletadas.length;

  const handleConfirmarInstalacion = (instalacionId: string) => {
    updateEstadoInstalacion.mutate({ 
      id: instalacionId, 
      estado: 'confirmada',
      observaciones: 'Servicio confirmado por el instalador'
    });
  };

  const handleIniciarInstalacion = (instalacionId: string) => {
    setInstalacionSeleccionada(instalacionId);
    setShowProcesoDialog(true);
    updateEstadoInstalacion.mutate({ 
      id: instalacionId, 
      estado: 'en_proceso',
      observaciones: 'Instalación iniciada por el técnico'
    });
  };

  const handleContinuarInstalacion = (instalacionId: string) => {
    setInstalacionSeleccionada(instalacionId);
    setShowProcesoDialog(true);
  };

  const handleInstalacionCompleta = () => {
    if (instalacionSeleccionada) {
      updateEstadoInstalacion.mutate({ 
        id: instalacionSeleccionada, 
        estado: 'completada',
        observaciones: 'Instalación completada exitosamente con documentación completa'
      });
      toast({
        title: "Instalación completada",
        description: "La instalación ha sido marcada como completada exitosamente.",
      });
      setShowProcesoDialog(false);
      setInstalacionSeleccionada(null);
    }
  };

  const handleDesasignarme = async (instalacionId: string) => {
    try {
      await desasignarInstalador.mutateAsync(instalacionId);
      toast({
        title: "Desasignación exitosa",
        description: "Te has desasignado de esta instalación correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo desasignar la instalación. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const config = {
      'programada': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      'confirmada': { color: 'bg-blue-100 text-blue-800', label: 'Confirmada' },
      'en_proceso': { color: 'bg-orange-100 text-orange-800', label: 'En Proceso' },
      'completada': { color: 'bg-green-100 text-green-800', label: 'Completado' },
      'cancelada': { color: 'bg-red-100 text-red-800', label: 'Cancelado' }
    };

    const item = config[estado as keyof typeof config] || { color: 'bg-gray-100 text-gray-800', label: estado };
    return <Badge className={item.color}>{item.label}</Badge>;
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return 'text-red-600 font-semibold';
      case 'alta': return 'text-orange-600 font-medium';
      case 'normal': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleCerrarProceso = () => {
    setShowProcesoDialog(false);
    setInstalacionSeleccionada(null);
  };

  const handleAsignarInstalador = (instalacion: any) => {
    setInstalacionParaAsignar(instalacion);
    setShowAsignarDialog(true);
  };

  const renderAccionButton = (instalacion: any) => {
    // Verificar si el usuario es coordinador o administrador
    const isCoordinator = userRole === 'coordinador_operaciones' || userRole === 'admin' || userRole === 'owner';
    
    if (instalacion.estado === 'programada') {
      return (
        <div className="flex gap-1">
          {/* Si no tiene instalador asignado y el usuario es coordinador */}
          {!instalacion.instalador && isCoordinator ? (
            <Button 
              size="sm" 
              variant="default"
              onClick={() => handleAsignarInstalador(instalacion)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Asignar
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleConfirmarInstalacion(instalacion.id)}
              disabled={updateEstadoInstalacion.isPending}
            >
              Confirmar
            </Button>
          )}
          
          {/* Botón de editar para coordinadores */}
          {isCoordinator && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleAsignarInstalador(instalacion)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleDesasignarme(instalacion.id)}
            disabled={desasignarInstalador.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      );
    } else if (instalacion.estado === 'confirmada') {
      return (
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleIniciarInstalacion(instalacion.id)}
            disabled={updateEstadoInstalacion.isPending}
          >
            Iniciar
          </Button>
          {isCoordinator && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleAsignarInstalador(instalacion)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleDesasignarme(instalacion.id)}
            disabled={desasignarInstalador.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      );
    } else if (instalacion.estado === 'en_proceso') {
      return (
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="default"
            onClick={() => handleContinuarInstalacion(instalacion.id)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="h-4 w-4 mr-1" />
            Continuar
          </Button>
        </div>
      );
    } else if (instalacion.estado === 'completada') {
      return (
        <div className="flex items-center text-green-600 text-sm">
          <CheckCircle className="h-4 w-4 mr-1" /> 
          Finalizado
        </div>
      );
    } else if (instalacion.estado === 'cancelada') {
      return (
        <div className="flex items-center text-red-600 text-sm">
          <XCircle className="h-4 w-4 mr-1" /> 
          Cancelado
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portal de Instalador</h1>
          <p className="text-muted-foreground">
            Gestiona tus instalaciones GPS asignadas.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instalaciones programadas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{instalacionesPendientes.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En proceso</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{instalacionesEnProceso.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas esta semana</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{instalacionesCompletadas.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo promedio</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tiempoPromedio}h</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sistema de filtros inteligentes */}
        {programaciones && programaciones.length > 0 && (
          <FiltrosInteligentes
            instalaciones={programaciones}
            onFiltrosChange={setInstalacionesFiltradas}
            userRole={userRole || 'instalador'}
            userId={user?.id || ''}
          />
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Instalaciones asignadas</CardTitle>
            <CardDescription>
              Gestiona tus instalaciones GPS programadas desde el sistema de servicios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programaciones && programaciones.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Dirección</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="hidden lg:table-cell">Tiempo Est.</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead>Instalador</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[160px]">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(instalacionesFiltradas.length > 0 ? instalacionesFiltradas : programaciones).map((instalacion) => (
                    <TableRow key={instalacion.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{instalacion.contacto_cliente}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            {instalacion.telefono_contacto}
                          </div>
                          {instalacion.prioridad && instalacion.prioridad !== 'normal' && (
                            <div className={`text-xs font-medium ${getPrioridadColor(instalacion.prioridad)}`}>
                              {instalacion.prioridad.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-start gap-1 text-sm">
                          <MapPin className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 text-xs leading-tight">
                            {instalacion.direccion_instalacion}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(instalacion.fecha_programada), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(instalacion.fecha_programada), 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {instalacion.tiempo_estimado || 60}min
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {instalacion.tipo_instalacion?.replace('_', ' ').toUpperCase() || 'GPS'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {instalacion.instalador ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div className="text-sm">
                              <p className="font-medium">{instalacion.instalador.nombre_completo}</p>
                              <p className="text-xs text-gray-500">{instalacion.instalador.telefono}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-orange-600">
                            <User className="h-4 w-4" />
                            <span className="text-sm">Sin asignar</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(instalacion.estado)}
                      </TableCell>
                      <TableCell>
                        {renderAccionButton(instalacion)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay instalaciones programadas
                </h3>
                <p className="text-gray-600">
                  Las instalaciones aparecerán aquí cuando sean asignadas desde el sistema de servicios.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {instalacionSeleccionada && (
        <ProcesoInstalacionDialog
          open={showProcesoDialog}
          onOpenChange={setShowProcesoDialog}
          programacionId={instalacionSeleccionada}
          onCerrar={handleCerrarProceso}
          onInstalacionCompleta={handleInstalacionCompleta}
        />
      )}

      {instalacionParaAsignar && (
        <AsignarInstaladorDialog
          open={showAsignarDialog}
          onOpenChange={setShowAsignarDialog}
          instalacion={instalacionParaAsignar}
        />
      )}
    </>
  );
};

export default InstallerPortal;
