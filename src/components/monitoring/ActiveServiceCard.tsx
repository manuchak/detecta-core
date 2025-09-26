
import { CalendarClock, MapPin, Edit3, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export interface ServiceProps {
  id: string;
  serviceId: string;
  driver: string;
  vehicleType: string;
  destination: string;
  eta: string;
  progress: number;
  status: 'confirmed' | 'pending' | 'problem' | 'draft' | 'delayed' | 'on-time' | 'in-route';
  delayMinutes?: number;
  isSelected?: boolean;
  onClick: (id: string) => void;
  origin?: string;
  statusMessage?: string;
}

// Estado y configuración para cada tipo de status
const getStatusConfig = (status: ServiceProps['status']) => {
  switch (status) {
    case 'confirmed':
      return {
        color: 'bg-green-500',
        icon: CheckCircle,
        message: 'Listo para ejecutar',
        actionIcon: null
      };
    case 'pending':
      return {
        color: 'bg-yellow-500',
        icon: Clock,
        message: 'Esperando confirmación',
        actionIcon: Edit3
      };
    case 'problem':
    case 'delayed':
      return {
        color: 'bg-red-500',
        icon: AlertCircle,
        message: status === 'delayed' ? 'Servicio retrasado' : 'Requiere atención',
        actionIcon: AlertCircle
      };
    case 'draft':
      return {
        color: 'bg-muted',
        icon: Edit3,
        message: 'En planeación',
        actionIcon: Edit3
      };
    default:
      return {
        color: 'bg-blue-500',
        icon: Clock,
        message: 'En ruta',
        actionIcon: null
      };
  }
};

export const ActiveServiceCard = ({
  id,
  serviceId,
  driver,
  vehicleType,
  destination,
  eta,
  progress,
  status,
  delayMinutes,
  isSelected,
  onClick,
  origin,
  statusMessage
}: ServiceProps) => {
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  const ActionIcon = statusConfig.actionIcon;

  return (
    <Card
      className={`apple-card cursor-pointer apple-hover-lift transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={() => onClick(id)}
    >
      <CardContent className="p-4">
        {/* Línea 1: Estado + Hora + Cliente + Acción */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            {/* Estado visual */}
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.color}`} />
              <span className="apple-text-caption font-medium text-muted-foreground">
                {eta}
              </span>
            </div>
            
            {/* Cliente */}
            <div className="flex flex-col">
              <span className="apple-text-body font-medium text-foreground">
                {driver}
              </span>
              <span className="apple-text-caption text-muted-foreground">
                {serviceId}
              </span>
            </div>
          </div>
          
          {/* Ícono de acción */}
          {ActionIcon && (
            <ActionIcon className="w-4 h-4 text-muted-foreground opacity-60" />
          )}
        </div>
        
        {/* Línea 2: Ruta */}
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div className="flex items-center space-x-1 min-w-0">
            {origin && (
              <>
                <span className="apple-text-caption text-muted-foreground truncate">
                  {origin}
                </span>
                <span className="text-muted-foreground">→</span>
              </>
            )}
            <span className="apple-text-caption font-medium text-foreground truncate">
              {destination}
            </span>
          </div>
        </div>
        
        {/* Línea 3: Custodio + Vehículo */}
        <div className="flex items-center space-x-1 mb-3">
          <span className="apple-text-caption text-muted-foreground">
            {driver}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="apple-text-caption text-muted-foreground">
            {vehicleType}
          </span>
        </div>
        
        {/* Línea 4: Mensaje de estado (solo si hay algo pendiente) */}
        {(statusMessage || status === 'pending' || status === 'problem' || status === 'delayed') && (
          <div className="flex items-center space-x-2 mb-3">
            <StatusIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="apple-text-caption text-muted-foreground">
              {statusMessage || statusConfig.message}
              {delayMinutes && delayMinutes > 0 && (
                <span className="text-destructive ml-1">
                  (+{delayMinutes} min)
                </span>
              )}
            </span>
          </div>
        )}
        
        {/* Barra de progreso minimalista */}
        {progress > 0 && (
          <div className="mt-3">
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  status === 'confirmed' || status === 'on-time' 
                    ? 'bg-green-500' 
                    : status === 'delayed' || status === 'problem'
                    ? 'bg-red-500'
                    : 'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveServiceCard;
