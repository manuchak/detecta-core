import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  ClipboardCheck, 
  XCircle, 
  Ban,
  Ticket,
  CheckCircle2,
  Banknote,
  StickyNote,
  RefreshCw,
  ExternalLink,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TimelineEvent, TimelineEventType } from '../../../hooks/useProfileTimeline';
import { cn } from '@/lib/utils';

interface TimelineEventCardProps {
  event: TimelineEvent;
  isLast: boolean;
}

const EVENT_CONFIG: Record<TimelineEventType, {
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  servicio_completado: {
    icon: Truck,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  servicio_asignado: {
    icon: ClipboardCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  servicio_confirmado: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  servicio_rechazado: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  servicio_cancelado: {
    icon: Ban,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  ticket_creado: {
    icon: Ticket,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  ticket_resuelto: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  adelanto: {
    icon: Banknote,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  nota: {
    icon: StickyNote,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200'
  },
  estado_cambio: {
    icon: RefreshCw,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200'
  }
};

export function TimelineEventCard({ event, isLast }: TimelineEventCardProps) {
  const config = EVENT_CONFIG[event.tipo];
  const Icon = config.icon;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(value);
  };

  const renderMetadata = () => {
    switch (event.tipo) {
      case 'servicio_completado':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {event.metadata.cliente && (
              <Badge variant="outline" className="text-xs">
                {event.metadata.cliente}
              </Badge>
            )}
            {event.metadata.costo && (
              <Badge variant="secondary" className="text-xs">
                {formatCurrency(event.metadata.costo)}
              </Badge>
            )}
            {event.metadata.km && (
              <Badge variant="outline" className="text-xs">
                {event.metadata.km.toLocaleString()} km
              </Badge>
            )}
          </div>
        );
      
      case 'servicio_asignado':
      case 'servicio_confirmado':
      case 'servicio_rechazado':
      case 'servicio_cancelado':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {event.metadata.cliente && (
              <Badge variant="outline" className="text-xs">
                {event.metadata.cliente}
              </Badge>
            )}
            {event.metadata.servicioId && (
              <Badge variant="outline" className="text-xs font-mono">
                {event.metadata.servicioId}
              </Badge>
            )}
          </div>
        );
      
      case 'ticket_creado':
      case 'ticket_resuelto':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="text-xs font-mono">
              {event.metadata.ticketNumber}
            </Badge>
            {event.metadata.monto && (
              <Badge variant="secondary" className="text-xs">
                {formatCurrency(event.metadata.monto)}
              </Badge>
            )}
            {event.metadata.csat && (
              <Badge variant="outline" className="text-xs">
                CSAT: {'⭐'.repeat(event.metadata.csat)}
              </Badge>
            )}
            {event.metadata.categoria?.nombre && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ borderColor: `var(--${event.metadata.categoria.color || 'slate'}-500)` }}
              >
                {event.metadata.categoria.nombre}
              </Badge>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-12 w-0.5 h-full bg-border" />
      )}
      
      {/* Icon */}
      <div className={cn(
        "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2",
        config.bgColor,
        config.borderColor
      )}>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>
      
      {/* Content */}
      <Card className={cn("flex-1 mb-4", config.borderColor)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{event.titulo}</h4>
                <Badge variant="outline" className="text-xs capitalize">
                  {event.fuente.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {event.descripcion}
              </p>
              {renderMetadata()}
            </div>
            
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(new Date(event.fecha), "HH:mm", { locale: es })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(event.fecha), "d MMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
