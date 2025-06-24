
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, MapPin, Shield, Eye, Filter, Search, Clock, CheckCircle, AlertTriangle, Settings, Trash2 } from 'lucide-react';
import { DetalleServicioDialog } from '@/components/servicios/DetalleServicioDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Using a generic type since ServicioMonitoreo is not exported
interface ServicioMonitoreo {
  id: string;
  numero_servicio: string;
  estado_general: string;
  tipo_servicio: string;
  nombre_cliente: string;
  empresa?: string;
  direccion_cliente: string;
  cantidad_vehiculos?: number;
  prioridad: string;
  fecha_solicitud: string;
  fecha_limite_respuesta?: string;
}

interface ServiciosTableProps {
  servicios: ServicioMonitoreo[];
  isLoading: boolean;
  onProgramarInstalacion: (servicioId: string) => void;
  onServiceDeleted?: () => void;
}

export const ServiciosTable = ({ 
  servicios, 
  isLoading,
  onProgramarInstalacion,
  onServiceDeleted 
}: ServiciosTableProps) => {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [deletingService, setDeletingService] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleDeleteService = async (servicioId: string, numeroServicio: string) => {
    try {
      setDeletingService(servicioId);
      
      const { error } = await supabase
        .from('servicios_monitoreo')
        .delete()
        .eq('id', servicioId);

      if (error) throw error;

      toast({
        title: "Servicio eliminado",
        description: `El servicio ${numeroServicio} ha sido eliminado exitosamente.`,
      });

      // Notificar al componente padre para refrescar la lista
      if (onServiceDeleted) {
        onServiceDeleted();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio. Inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDeletingService(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const config = {
      'pendiente_evaluacion': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente Evaluación', icon: Clock },
      'pendiente_analisis_riesgo': { color: 'bg-orange-100 text-orange-800', label: 'Pendiente Análisis', icon: AlertTriangle },
      'en_evaluacion_riesgo': { color: 'bg-blue-100 text-blue-800', label: 'En Evaluación', icon: Settings },
      'evaluacion_completada': { color: 'bg-green-100 text-green-800', label: 'Evaluación Completada', icon: CheckCircle },
      'pendiente_aprobacion': { color: 'bg-purple-100 text-purple-800', label: 'Pendiente Aprobación', icon: Clock },
      'aprobado': { color: 'bg-green-100 text-green-800', label: 'Aprobado', icon: CheckCircle },
      'programacion_instalacion': { color: 'bg-blue-100 text-blue-800', label: 'Programando Instalación', icon: Calendar },
      'instalacion_programada': { color: 'bg-indigo-100 text-indigo-800', label: 'Instalación Programada', icon: Calendar },
      'instalacion_en_proceso': { color: 'bg-orange-100 text-orange-800', label: 'Instalación en Proceso', icon: Settings },
      'instalacion_completada': { color: 'bg-green-100 text-green-800', label: 'Instalación Completada', icon: CheckCircle },
      'servicio_activo': { color: 'bg-green-100 text-green-800', label: 'Servicio Activo', icon: CheckCircle },
      'rechazado': { color: 'bg-red-100 text-red-800', label: 'Rechazado', icon: AlertTriangle },
      'cancelado': { color: 'bg-gray-100 text-gray-800', label: 'Cancelado', icon: AlertTriangle },
      'suspendido': { color: 'bg-red-100 text-red-800', label: 'Suspendido', icon: AlertTriangle }
    };

    const item = config[estado as keyof typeof config] || { 
      color: 'bg-gray-100 text-gray-800', 
      label: estado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: Clock
    };
    
    const IconComponent = item.icon;
    
    return (
      <Badge className={`${item.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {item.label}
      </Badge>
    );
  };

  const getPrioridadBadge = (prioridad: string) => {
    // Only show priority badge if it's not 'media' (standard)
    if (prioridad === 'media') return null;
    
    const config = {
      'alta': { color: 'bg-red-100 text-red-800 border-red-300', label: 'Alta' },
      'baja': { color: 'bg-gray-100 text-gray-600 border-gray-300', label: 'Baja' },
      'urgente': { color: 'bg-red-500 text-white', label: 'Urgente' }
    };

    const item = config[prioridad as keyof typeof config];
    if (!item) return null;
    
    return <Badge variant="outline" className={item.color}>{item.label}</Badge>;
  };

  // Check if GPS programming button should be shown
  const shouldShowGPSButton = (estado: string) => {
    return estado === 'aprobado' || estado === 'programacion_instalacion';
  };

  // Check if service is in installation process
  const isInInstallationProcess = (estado: string) => {
    return ['instalacion_programada', 'instalacion_en_proceso', 'instalacion_completada'].includes(estado);
  };

  // Filter services based on all criteria
  const serviciosFiltrados = servicios.filter(servicio => {
    const matchesBusqueda = servicio.numero_servicio.toLowerCase().includes(busqueda.toLowerCase()) ||
                           servicio.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
                           (servicio.empresa && servicio.empresa.toLowerCase().includes(busqueda.toLowerCase()));
    
    const matchesEstado = filtroEstado === 'todos' || servicio.estado_general === filtroEstado;
    const matchesPrioridad = filtroPrioridad === 'todos' || servicio.prioridad === filtroPrioridad;
    const matchesTipo = filtroTipo === 'todos' || servicio.tipo_servicio === filtroTipo;
    
    return matchesBusqueda && matchesEstado && matchesPrioridad && matchesTipo;
  });

  // Get unique values for filter options
  const estadosUnicos = [...new Set(servicios.map(s => s.estado_general))];
  const tiposUnicos = [...new Set(servicios.map(s => s.tipo_servicio))];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por servicio, cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {estadosUnicos.map(estado => (
                  <SelectItem key={estado} value={estado}>
                    {estado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las prioridades</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {tiposUnicos.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Results counter */}
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">{serviciosFiltrados.length}</span>
              <span className="ml-1">de {servicios.length} servicios</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <div className="space-y-4">
        {serviciosFiltrados.map((servicio) => (
          <Card key={servicio.id} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-semibold text-lg text-gray-900">
                      {servicio.numero_servicio}
                    </span>
                    {getEstadoBadge(servicio.estado_general)}
                    <Badge variant="outline" className="text-blue-600">
                      {servicio.tipo_servicio}
                    </Badge>
                    {getPrioridadBadge(servicio.prioridad)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{servicio.nombre_cliente}</p>
                      <p className="text-sm text-gray-600">{servicio.empresa || 'Sin empresa'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{servicio.direccion_cliente}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Vehículos: {servicio.cantidad_vehiculos || 1}</p>
                      {servicio.prioridad !== 'media' && (
                        <p>Prioridad: <span className="capitalize font-medium">{servicio.prioridad}</span></p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Solicitud: {new Date(servicio.fecha_solicitud).toLocaleDateString('es-ES')}
                    </span>
                    {servicio.fecha_limite_respuesta && (
                      <span>Límite: {new Date(servicio.fecha_limite_respuesta).toLocaleDateString('es-ES')}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <DetalleServicioDialog servicioId={servicio.id}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </Button>
                  </DetalleServicioDialog>
                  
                  {shouldShowGPSButton(servicio.estado_general) && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onProgramarInstalacion(servicio.id)}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Programar GPS
                    </Button>
                  )}

                  {isInInstallationProcess(servicio.estado_general) && (
                    <div className="flex flex-col gap-1">
                      {servicio.estado_general === 'instalacion_programada' && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600 justify-center">
                          <Clock className="h-3 w-3 mr-1" />
                          GPS Programado
                        </Badge>
                      )}
                      {servicio.estado_general === 'instalacion_en_proceso' && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600 justify-center">
                          <Settings className="h-3 w-3 mr-1" />
                          Instalando...
                        </Badge>
                      )}
                      {servicio.estado_general === 'instalacion_completada' && (
                        <Badge variant="outline" className="text-green-600 border-green-600 justify-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Instalado
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Delete Button with Confirmation Dialog */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        disabled={deletingService === servicio.id}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingService === servicio.id ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio 
                          <strong> {servicio.numero_servicio}</strong> y todos sus datos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteService(servicio.id, servicio.numero_servicio)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar Servicio
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {serviciosFiltrados.length === 0 && servicios.length > 0 && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron servicios
            </h3>
            <p className="text-gray-600">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}

        {servicios.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay servicios registrados
            </h3>
            <p className="text-gray-600">
              Los servicios aparecerán aquí una vez que sean creados
            </p>
          </div>
        )}
      </div>
    </>
  );
};
