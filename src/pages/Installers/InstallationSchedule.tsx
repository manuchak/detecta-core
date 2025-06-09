
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Plus, Filter } from 'lucide-react';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useInstaladores } from '@/hooks/useInstaladores';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgramarInstalacionDialog } from './components/ProgramarInstalacionDialog';
import { AsignarInstaladorDialog } from './components/AsignarInstaladorDialog';
import { InstallationCard } from './components/InstallationCard';

const InstallationSchedule = () => {
  const { programaciones, isLoading } = useProgramacionInstalaciones();
  const { instaladoresActivos } = useInstaladores();
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todas');

  const programacionesFiltradas = programaciones?.filter(prog => {
    if (filtroEstado !== 'todas' && prog.estado !== filtroEstado) return false;
    if (filtroPrioridad !== 'todas' && prog.prioridad !== filtroPrioridad) return false;
    return true;
  }) || [];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'programada': return 'bg-blue-100 text-blue-800';
      case 'confirmada': return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso': return 'bg-orange-100 text-orange-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      case 'reprogramada': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return 'bg-red-100 text-red-800 border-red-300';
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'baja': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const programacionesPorEstado = {
    programadas: programacionesFiltradas.filter(p => p.estado === 'programada'),
    confirmadas: programacionesFiltradas.filter(p => p.estado === 'confirmada'),
    en_proceso: programacionesFiltradas.filter(p => p.estado === 'en_proceso'),
    completadas: programacionesFiltradas.filter(p => p.estado === 'completada')
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando programación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros y acciones */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programación de Instalaciones</h1>
          <p className="text-gray-600 mt-1">Gestiona las instalaciones de GPS programadas</p>
        </div>
        <div className="flex gap-2">
          <ProgramarInstalacionDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Instalación
            </Button>
          </ProgramarInstalacionDialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos los estados</SelectItem>
                <SelectItem value="programada">Programada</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las prioridades</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto text-sm text-gray-600">
              {programacionesFiltradas.length} instalaciones encontradas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs por estado */}
      <Tabs defaultValue="programadas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="programadas" className="relative">
            Programadas
            {programacionesPorEstado.programadas.length > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {programacionesPorEstado.programadas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmadas" className="relative">
            Confirmadas
            {programacionesPorEstado.confirmadas.length > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {programacionesPorEstado.confirmadas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="en_proceso" className="relative">
            En Proceso
            {programacionesPorEstado.en_proceso.length > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {programacionesPorEstado.en_proceso.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completadas" className="relative">
            Completadas
            {programacionesPorEstado.completadas.length > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {programacionesPorEstado.completadas.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programadas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programacionesPorEstado.programadas.map((programacion) => (
              <InstallationCard 
                key={programacion.id} 
                programacion={programacion}
                getEstadoColor={getEstadoColor}
                getPrioridadColor={getPrioridadColor}
              />
            ))}
          </div>
          {programacionesPorEstado.programadas.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-center">No hay instalaciones programadas</p>
                <p className="text-gray-400 text-sm text-center mt-1">
                  Las nuevas programaciones aparecerán aquí
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="confirmadas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programacionesPorEstado.confirmadas.map((programacion) => (
              <InstallationCard 
                key={programacion.id} 
                programacion={programacion}
                getEstadoColor={getEstadoColor}
                getPrioridadColor={getPrioridadColor}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="en_proceso" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programacionesPorEstado.en_proceso.map((programacion) => (
              <InstallationCard 
                key={programacion.id} 
                programacion={programacion}
                getEstadoColor={getEstadoColor}
                getPrioridadColor={getPrioridadColor}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completadas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programacionesPorEstado.completadas.map((programacion) => (
              <InstallationCard 
                key={programacion.id} 
                programacion={programacion}
                getEstadoColor={getEstadoColor}
                getPrioridadColor={getPrioridadColor}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstallationSchedule;
