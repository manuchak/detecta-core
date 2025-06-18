
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  User, 
  UserPlus, 
  Search, 
  Star, 
  Phone, 
  Mail, 
  MapPin,
  Settings,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useInstaladores } from '@/hooks/useInstaladores';
import { RegistroInstaladorDialog } from './components/RegistroInstaladorDialog';

const InstallerManagement = () => {
  const { instaladores, isLoadingInstaladores, cambiarEstadoAfiliacion } = useInstaladores();
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegistroDialog, setShowRegistroDialog] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const instaladoresFiltrados = instaladores?.filter(instalador => {
    const matchesSearch = instalador.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instalador.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instalador.telefono.includes(searchTerm);
    
    const matchesEstado = filtroEstado === 'todos' || instalador.estado_afiliacion === filtroEstado;
    
    return matchesSearch && matchesEstado;
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

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activo': return <CheckCircle className="h-4 w-4" />;
      case 'pendiente': return <Clock className="h-4 w-4" />;
      case 'suspendido': return <XCircle className="h-4 w-4" />;
      case 'inactivo': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const estadisticas = {
    total: instaladores?.length || 0,
    activos: instaladores?.filter(i => i.estado_afiliacion === 'activo').length || 0,
    pendientes: instaladores?.filter(i => i.estado_afiliacion === 'pendiente').length || 0,
    suspendidos: instaladores?.filter(i => i.estado_afiliacion === 'suspendido').length || 0
  };

  if (isLoadingInstaladores) {
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
          <p className="text-gray-600 mt-1">Administra los instaladores certificados</p>
        </div>
        <Button onClick={() => setShowRegistroDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Registrar Instalador
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instaladores</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.activos}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estadisticas.suspendidos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2">
              {['todos', 'activo', 'pendiente', 'suspendido', 'inactivo'].map((estado) => (
                <Button
                  key={estado}
                  variant={filtroEstado === estado ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroEstado(estado)}
                >
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de instaladores */}
      <Card>
        <CardHeader>
          <CardTitle>Instaladores Registrados</CardTitle>
          <CardDescription>
            {instaladoresFiltrados.length} instaladores encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instalador</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instaladoresFiltrados.map((instalador) => (
                <TableRow key={instalador.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{instalador.nombre_completo}</div>
                      {instalador.cedula_profesional && (
                        <div className="text-sm text-gray-500">
                          Cédula: {instalador.cedula_profesional}
                        </div>
                      )}
                      {instalador.vehiculo_propio && (
                        <Badge variant="secondary" className="text-xs">
                          Vehículo propio
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {instalador.telefono}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {instalador.email}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {instalador.especialidades.slice(0, 2).map((esp, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {esp}
                        </Badge>
                      ))}
                      {instalador.especialidades.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{instalador.especialidades.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">
                        {instalador.calificacion_promedio.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-medium">{instalador.servicios_completados}</span>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getEstadoColor(instalador.estado_afiliacion)}>
                      <div className="flex items-center gap-1">
                        {getEstadoIcon(instalador.estado_afiliacion)}
                        {instalador.estado_afiliacion}
                      </div>
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {instaladoresFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron instaladores</p>
              <p className="text-sm">Ajusta los filtros o registra un nuevo instalador</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RegistroInstaladorDialog
        open={showRegistroDialog}
        onOpenChange={setShowRegistroDialog}
      />
    </div>
  );
};

export default InstallerManagement;
