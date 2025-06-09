
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  FileSearch, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  MoreHorizontal,
  Eye,
  Calendar,
  Wrench
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { ServicioMonitoreo, AnalisisRiesgo } from '@/types/serviciosMonitoreo';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RiskIndicator } from '@/components/ui/risk-indicator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ServiciosTableProps {
  servicios: ServicioMonitoreo[];
  isLoading: boolean;
  onAnalisisRiesgo: (servicioId: string) => void;
  onProgramarInstalacion?: (servicioId: string) => void;
}

export const ServiciosTable = ({ servicios, isLoading, onAnalisisRiesgo, onProgramarInstalacion }: ServiciosTableProps) => {
  // Query para obtener todos los análisis de riesgo
  const { data: analisisRiesgos } = useQuery({
    queryKey: ['analisis-riesgos-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analisis_riesgo')
        .select('*');
      
      if (error) throw error;
      
      // Cast the data to properly typed AnalisisRiesgo objects
      return data?.map(item => ({
        ...item,
        nivel_riesgo_cliente: item.nivel_riesgo_cliente as AnalisisRiesgo['nivel_riesgo_cliente'],
        nivel_riesgo_zona: item.nivel_riesgo_zona as AnalisisRiesgo['nivel_riesgo_zona'],
        situacion_financiera: item.situacion_financiera as AnalisisRiesgo['situacion_financiera'],
        recomendacion: item.recomendacion as AnalisisRiesgo['recomendacion']
      } as AnalisisRiesgo)) || [];
    }
  });

  // Query para obtener instalaciones por servicio
  const { data: instalaciones } = useQuery({
    queryKey: ['programacion-instalaciones-servicios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .select('servicio_id, estado');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Función para obtener el análisis de riesgo de un servicio específico
  const getAnalisisForServicio = (servicioId: string) => {
    return analisisRiesgos?.find(analisis => analisis.servicio_id === servicioId) || null;
  };

  // Función para verificar si un servicio tiene instalación programada
  const hasInstalacionProgramada = (servicioId: string) => {
    return instalaciones?.some(inst => inst.servicio_id === servicioId) || false;
  };

  // Función para verificar si un servicio necesita instalación GPS
  const needsGpsInstallation = (servicio: ServicioMonitoreo) => {
    return ['vehicular', 'flotilla'].includes(servicio.tipo_servicio) && 
           ['aprobado', 'pendiente_instalacion', 'instalacion_programada'].includes(servicio.estado_general);
  };

  const getEstadoBadge = (estado: string) => {
    const config = {
      'pendiente_evaluacion': { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Clock,
        label: 'Pendiente Evaluación' 
      },
      'en_evaluacion_riesgo': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: FileSearch,
        label: 'En Evaluación' 
      },
      'evaluacion_completada': { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle,
        label: 'Evaluación Completada' 
      },
      'pendiente_aprobacion': { 
        color: 'bg-orange-100 text-orange-800', 
        icon: AlertTriangle,
        label: 'Pendiente Aprobación' 
      },
      'aprobado': { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle,
        label: 'Aprobado' 
      },
      'pendiente_instalacion': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: Wrench,
        label: 'Pendiente Instalación' 
      },
      'instalacion_programada': { 
        color: 'bg-purple-100 text-purple-800', 
        icon: Calendar,
        label: 'Instalación Programada' 
      },
      'rechazado': { 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle,
        label: 'Rechazado' 
      },
      'servicio_activo': { 
        color: 'bg-green-100 text-green-800', 
        icon: Shield,
        label: 'Servicio Activo' 
      }
    };

    const item = config[estado as keyof typeof config] || {
      color: 'bg-gray-100 text-gray-800',
      icon: Clock,
      label: estado
    };

    const Icon = item.icon;

    return (
      <Badge className={`${item.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {item.label}
      </Badge>
    );
  };

  const getPrioridadBadge = (prioridad: string) => {
    const colors = {
      'baja': 'bg-green-100 text-green-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'alta': 'bg-orange-100 text-orange-800',
      'critica': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[prioridad as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!servicios.length) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay servicios registrados
        </h3>
        <p className="text-gray-600">
          Comience creando su primer servicio de monitoreo
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número de Servicio</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Análisis de Riesgo</TableHead>
            <TableHead>Instalación GPS</TableHead>
            <TableHead>Fecha Solicitud</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicios.map((servicio) => {
            const analisisRiesgo = getAnalisisForServicio(servicio.id);
            const tieneInstalacion = hasInstalacionProgramada(servicio.id);
            const necesitaGps = needsGpsInstallation(servicio);
            
            return (
              <TableRow key={servicio.id}>
                <TableCell className="font-medium">
                  {servicio.numero_servicio}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{servicio.nombre_cliente}</div>
                    {servicio.empresa && (
                      <div className="text-sm text-gray-500">{servicio.empresa}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {servicio.tipo_servicio === 'personal' && 'Personal'}
                    {servicio.tipo_servicio === 'vehicular' && 'Vehicular'}
                    {servicio.tipo_servicio === 'flotilla' && 'Flotilla'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getPrioridadBadge(servicio.prioridad)}
                </TableCell>
                <TableCell>
                  {getEstadoBadge(servicio.estado_general)}
                </TableCell>
                <TableCell>
                  <RiskIndicator analisis={analisisRiesgo} size="sm" />
                </TableCell>
                <TableCell>
                  {necesitaGps ? (
                    tieneInstalacion ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Calendar className="h-3 w-3 mr-1" />
                        Programada
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Wrench className="h-3 w-3 mr-1" />
                        Pendiente
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      No requiere
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(servicio.fecha_solicitud), 'dd MMM yyyy', { locale: es })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {}}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAnalisisRiesgo(servicio.id)}>
                        <FileSearch className="mr-2 h-4 w-4" />
                        {analisisRiesgo ? 'Editar Análisis' : 'Análisis de Riesgo'}
                      </DropdownMenuItem>
                      
                      {necesitaGps && onProgramarInstalacion && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onProgramarInstalacion(servicio.id)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            {tieneInstalacion ? 'Gestionar Instalación' : 'Programar Instalación GPS'}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
