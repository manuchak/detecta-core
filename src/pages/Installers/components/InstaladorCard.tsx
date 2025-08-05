import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Calendar,
  FileText,
  DollarSign,
  Eye,
  Edit,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InstaladorCardProps {
  instalador: any;
  onOpenDatosFiscales: (instalador: any) => void;
  onOpenPagos: (instalador: any) => void;
  onOpenAuditoria: (instalador: any) => void;
}

export const InstaladorCard: React.FC<InstaladorCardProps> = ({
  instalador,
  onOpenDatosFiscales,
  onOpenPagos,
  onOpenAuditoria
}) => {
  const getEstadoBadge = (activo: boolean) => {
    if (activo) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Activo</Badge>;
    }
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Inactivo</Badge>;
  };

  const getCalificacionColor = (calificacion: number) => {
    if (calificacion >= 4.5) return 'text-green-600';
    if (calificacion >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              {instalador.nombre_completo}
            </CardTitle>
            <CardDescription>{instalador.codigo_instalador}</CardDescription>
          </div>
          {getEstadoBadge(instalador.activo)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Información de contacto */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{instalador.telefono}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{instalador.email}</span>
          </div>
          {instalador.ciudad && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{instalador.ciudad}, {instalador.estado}</span>
            </div>
          )}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className={`h-4 w-4 ${getCalificacionColor(instalador.calificacion_promedio || 0)}`} />
              <span className={`font-semibold ${getCalificacionColor(instalador.calificacion_promedio || 0)}`}>
                {(instalador.calificacion_promedio || 0).toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Calificación</p>
          </div>
          <div className="text-center">
            <div className="font-semibold text-primary">
              {instalador.total_instalaciones || 0}
            </div>
            <p className="text-xs text-muted-foreground">Instalaciones</p>
          </div>
        </div>

        {/* Especialidades */}
        {instalador.especialidades && instalador.especialidades.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Especialidades</p>
            <div className="flex flex-wrap gap-1">
              {instalador.especialidades.slice(0, 3).map((especialidad: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {especialidad}
                </Badge>
              ))}
              {instalador.especialidades.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{instalador.especialidades.length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Fecha de registro */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3" />
          <span>
            Registrado: {format(new Date(instalador.created_at), 'dd/MM/yyyy', { locale: es })}
          </span>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenDatosFiscales(instalador)}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-1" />
            Fiscal
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenPagos(instalador)}
            className="flex-1"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Pagos
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenAuditoria(instalador)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Auditar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};