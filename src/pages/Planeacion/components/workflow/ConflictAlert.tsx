import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConflictDetail {
  id_servicio: string;
  fecha_hora: string;
  origen: 'servicios_custodia' | 'servicios_planificados';
}

interface ConflictAlertProps {
  conflictDetails: ConflictDetail[];
  custodioNombre: string;
  fechaServicio: string;
  horaServicio: string;
  onResolve?: () => void;
  className?: string;
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({
  conflictDetails,
  custodioNombre,
  fechaServicio,
  horaServicio,
  onResolve,
  className
}) => {
  if (!conflictDetails || conflictDetails.length === 0) {
    return null;
  }

  const formatConflictTime = (fechaHora: string) => {
    try {
      const date = new Date(fechaHora);
      return format(date, "HH:mm 'del' dd/MM/yyyy", { locale: es });
    } catch {
      return fechaHora;
    }
  };

  const getSourceBadgeVariant = (origen: string) => {
    return origen === 'servicios_custodia' ? 'default' : 'secondary';
  };

  const getSourceLabel = (origen: string) => {
    return origen === 'servicios_custodia' ? 'Histórico' : 'Planificado';
  };

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Conflicto de Horario Detectado
        <Badge variant="outline" className="ml-2">
          {conflictDetails.length} conflicto{conflictDetails.length > 1 ? 's' : ''}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-3 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-3 w-3" />
          <span className="font-medium">{custodioNombre}</span>
          <Calendar className="h-3 w-3 ml-2" />
          <span>{fechaServicio}</span>
          <Clock className="h-3 w-3 ml-2" />
          <span>{horaServicio}</span>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Servicios en conflicto:</p>
          {conflictDetails.map((conflict, index) => (
            <div 
              key={`${conflict.id_servicio}-${index}`}
              className="flex items-center justify-between p-2 bg-destructive/10 rounded-md border"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                  {conflict.id_servicio}
                </span>
                <Badge 
                  variant={getSourceBadgeVariant(conflict.origen)}
                >
                  {getSourceLabel(conflict.origen)}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatConflictTime(conflict.fecha_hora)}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-sm text-muted-foreground">
          <p>
            ⚠️ Este custodio ya tiene servicios asignados que se superponen con el horario solicitado.
            {onResolve && (
              <span className="block mt-1 font-medium text-foreground">
                Por favor, selecciona otro custodio o ajusta el horario del servicio.
              </span>
            )}
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};