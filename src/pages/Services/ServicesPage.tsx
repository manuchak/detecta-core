
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Shield, ClipboardCheck, Settings, Activity, Calendar, Wrench, UserCheck, AlertTriangle } from 'lucide-react';
import { useServiciosMonitoreo } from '@/hooks/useServiciosMonitoreo';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useAprobacionesWorkflow } from '@/hooks/useAprobacionesWorkflow';
import { ServicioForm } from './components/ServicioForm';
import { ServiciosTable } from './components/ServiciosTable';
import { AnalisisRiesgoDialog } from './components/AnalisisRiesgoDialog';
import { ProgramarInstalacionDialog } from '@/pages/Installers/components/ProgramarInstalacionDialog';
import { PanelAprobacionCoordinador } from '@/components/servicios/PanelAprobacionCoordinador';
import { PanelAnalisisRiesgo } from '@/components/servicios/PanelAnalisisRiesgo';
import { Badge } from '@/components/ui/badge';

export const ServicesPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedServicioId, setSelectedServicioId] = useState<string | null>(null);
  const [showAnalisisDialog, setShowAnalisisDialog] = useState(false);
  const [showProgramarInstalacion, setShowProgramarInstalacion] = useState(false);
  
  const { servicios, isLoading } = useServiciosMonitoreo();
  const { programaciones, isLoading: loadingProgramaciones } = useProgramacionInstalaciones();
  const { serviciosPendientesCoordinador, serviciosPendientesRiesgo } = useAprobacionesWorkflow();

  const estadosCount = servicios?.reduce((acc, servicio) => {
    acc[servicio.estado_general] = (acc[servicio.estado_general] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const instalacionesCount = programaciones?.reduce((acc, programacion) => {
    acc[programacion.estado] = (acc[programacion.estado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const handleAnalisisRiesgo = (servicioId: string) => {
    setSelectedServicioId(servicioId);
    setShowAnalisisDialog(true);
  };

  const handleProgramarInstalacion = (servicioId: string) => {
    setSelectedServicioId(servicioId);
    setShowProgramarInstalacion(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Servicios de Monitoreo
            </h1>
            <p className="text-gray-600 mt-2">
              Gestión integral de servicios de seguridad y monitoreo
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Servicio
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Requieren Evaluación
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {(estadosCount['pendiente_evaluacion'] || 0) + (estadosCount['pendiente_analisis_riesgo'] || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ClipboardCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Servicios Activos
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {estadosCount['servicio_activo'] || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Instalaciones Pendientes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(instalacionesCount['programada'] || 0) + 
                     (instalacionesCount['confirmada'] || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Servicios
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {servicios?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gestión de Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="servicios" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="servicios">
                  Todos los Servicios
                </TabsTrigger>
                <TabsTrigger value="coordinador" className="relative">
                  Evaluación Ops
                  {serviciosPendientesCoordinador && serviciosPendientesCoordinador.length > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white text-xs px-1 py-0">
                      {serviciosPendientesCoordinador.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="seguridad" className="relative">
                  Análisis Seguridad
                  {serviciosPendientesRiesgo && serviciosPendientesRiesgo.length > 0 && (
                    <Badge className="ml-2 bg-orange-500 text-white text-xs px-1 py-0">
                      {serviciosPendientesRiesgo.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="instalaciones">Instalaciones GPS</TabsTrigger>
                <TabsTrigger value="configuracion">Configuración</TabsTrigger>
              </TabsList>
              
              <TabsContent value="servicios" className="mt-6">
                <ServiciosTable 
                  servicios={servicios || []}
                  isLoading={isLoading}
                  onAnalisisRiesgo={handleAnalisisRiesgo}
                  onProgramarInstalacion={handleProgramarInstalacion}
                />
              </TabsContent>
              
              <TabsContent value="coordinador" className="mt-6">
                <PanelAprobacionCoordinador />
              </TabsContent>

              <TabsContent value="seguridad" className="mt-6">
                <PanelAnalisisRiesgo />
              </TabsContent>
              
              <TabsContent value="instalaciones" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Instalaciones GPS Programadas
                    </h3>
                    <Button 
                      onClick={() => setShowProgramarInstalacion(true)}
                      variant="outline"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Nueva Instalación
                    </Button>
                  </div>

                  {loadingProgramaciones ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : programaciones && programaciones.length > 0 ? (
                    <div className="grid gap-4">
                      {programaciones.slice(0, 5).map((programacion) => (
                        <Card key={programacion.id} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">
                                    {programacion.tipo_instalacion}
                                  </Badge>
                                  <Badge 
                                    className={
                                      programacion.estado === 'completada' 
                                        ? 'bg-green-100 text-green-800'
                                        : programacion.estado === 'en_proceso'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }
                                  >
                                    {programacion.estado}
                                  </Badge>
                                </div>
                                <p className="font-medium text-gray-900">
                                  {programacion.contacto_cliente}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {programacion.direccion_instalacion}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(programacion.fecha_programada).toLocaleDateString('es-ES')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">
                                  Instalador: {programacion.instalador?.nombre_completo || 'No asignado'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Tiempo est: {programacion.tiempo_estimado}min
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay instalaciones programadas
                      </h3>
                      <p className="text-gray-600">
                        Programa tu primera instalación GPS
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="configuracion" className="mt-6">
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Configuración de Monitoreo
                  </h3>
                  <p className="text-gray-600">
                    Configuración de parámetros de monitoreo y alertas
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialogs */}
        {showCreateForm && (
          <ServicioForm
            open={showCreateForm}
            onOpenChange={setShowCreateForm}
          />
        )}

        {showAnalisisDialog && selectedServicioId && (
          <AnalisisRiesgoDialog
            open={showAnalisisDialog}
            onOpenChange={setShowAnalisisDialog}
            servicioId={selectedServicioId}
          />
        )}

        {showProgramarInstalacion && (
          <ProgramarInstalacionDialog
            open={showProgramarInstalacion}
            onOpenChange={setShowProgramarInstalacion}
            servicioId={selectedServicioId}
          />
        )}
      </div>
    </div>
  );
};
