
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Star, Phone, Mail, User, Settings } from 'lucide-react';
import { useInstaladores } from '@/hooks/useInstaladores';
import { RegistroInstaladorDialog } from './components/RegistroInstaladorDialog';

const InstallerManagement = () => {
  const { instaladores, isLoading } = useInstaladores();
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  const instaladoresFiltrados = instaladores?.filter(instalador => {
    if (filtroEstado !== 'todos' && instalador.estado_afiliacion !== filtroEstado) {
      return false;
    }
    if (busqueda && !instalador.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'suspendido': return 'bg-red-100 text-red-800';
      case 'inactivo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const instaladoresPorEstado = {
    activos: instaladoresFiltrados.filter(i => i.estado_afiliacion === 'activo'),
    pendientes: instaladoresFiltrados.filter(i => i.estado_afiliacion === 'pendiente'),
    suspendidos: instaladoresFiltrados.filter(i => i.estado_afiliacion === 'suspendido'),
    inactivos: instaladoresFiltrados.filter(i => i.estado_afiliacion === 'inactivo')
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando instaladores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Instaladores</h1>
          <p className="text-gray-600 mt-1">Administra la red de instaladores afiliados</p>
        </div>
        <RegistroInstaladorDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Instalador
          </Button>
        </RegistroInstaladorDialog>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="suspendido">Suspendidos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600">
              {instaladoresFiltrados.length} instaladores
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instaladoresPorEstado.activos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instaladoresPorEstado.pendientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Suspendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instaladoresPorEstado.suspendidos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inactivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instaladoresPorEstado.inactivos.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de instaladores */}
      <Tabs defaultValue="activos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activos">
            Activos ({instaladoresPorEstado.activos.length})
          </TabsTrigger>
          <TabsTrigger value="pendientes">
            Pendientes ({instaladoresPorEstado.pendientes.length})
          </TabsTrigger>
          <TabsTrigger value="suspendidos">
            Suspendidos ({instaladoresPorEstado.suspendidos.length})
          </TabsTrigger>
          <TabsTrigger value="inactivos">
            Inactivos ({instaladoresPorEstado.inactivos.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(instaladoresPorEstado).map(([estado, instaladores]) => (
          <TabsContent key={estado} value={estado} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {instaladores.map((instalador) => (
                <InstallerCard key={instalador.id} instalador={instalador} getEstadoColor={getEstadoColor} />
              ))}
            </div>
            {instaladores.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <User className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 text-center">No hay instaladores {estado}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const InstallerCard: React.FC<{ instalador: any, getEstadoColor: (estado: string) => string }> = ({ 
  instalador, 
  getEstadoColor 
}) => {
  const { updateEstadoAfiliacion } = useInstaladores();

  const handleEstadoChange = (nuevoEstado: string) => {
    updateEstadoAfiliacion.mutate({
      id: instalador.id,
      estado: nuevoEstado
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{instalador.nombre_completo}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="text-sm">{instalador.calificacion_promedio.toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-500">
                ({instalador.servicios_completados} servicios)
              </span>
            </div>
          </div>
          <Badge className={getEstadoColor(instalador.estado_afiliacion)}>
            {instalador.estado_afiliacion}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-gray-500" />
          <span>{instalador.telefono}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-gray-500" />
          <span>{instalador.email}</span>
        </div>

        {instalador.especialidades.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-700">Especialidades:</p>
            <div className="flex flex-wrap gap-1">
              {instalador.especialidades.map((esp: string) => (
                <Badge key={esp} variant="secondary" className="text-xs">
                  {esp.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {instalador.certificaciones.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-700">Certificaciones:</p>
            <div className="flex flex-wrap gap-1">
              {instalador.certificaciones.map((cert: string) => (
                <Badge key={cert} variant="outline" className="text-xs">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs">
          {instalador.vehiculo_propio && (
            <Badge className="bg-blue-100 text-blue-800">Vehículo propio</Badge>
          )}
          {instalador.documentacion_completa && (
            <Badge className="bg-green-100 text-green-800">Docs completas</Badge>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {instalador.estado_afiliacion === 'pendiente' && (
            <Button
              size="sm"
              onClick={() => handleEstadoChange('activo')}
              className="flex-1"
            >
              Activar
            </Button>
          )}
          {instalador.estado_afiliacion === 'activo' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEstadoChange('suspendido')}
              className="flex-1"
            >
              Suspender
            </Button>
          )}
          <Button size="sm" variant="outline">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstallerManagement;
