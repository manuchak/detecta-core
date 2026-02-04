import React from 'react';
import { formatCDMXTime } from '@/utils/cdmxTimezone';
import { MapPin, User, Shield, Clock, CheckCircle2, AlertCircle, Calendar, Database, FileText, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ServiceQueryResult } from '@/hooks/useServiceQuery';

interface ServiceQueryCardProps {
  service: ServiceQueryResult;
  onDoubleClick: (service: ServiceQueryResult) => void;
}

export function ServiceQueryCard({ service, onDoubleClick }: ServiceQueryCardProps) {
  const getStatusConfig = () => {
    const estado = service.estado?.toLowerCase() || '';
    
    if (estado.includes('finalizado') || estado.includes('completado')) {
      return {
        color: 'bg-success',
        icon: CheckCircle2,
        label: 'Finalizado',
        textColor: 'text-success'
      };
    }
    
    if (estado.includes('cancelado') || estado.includes('cancelled')) {
      return {
        color: 'bg-muted-foreground',
        icon: AlertCircle,
        label: 'Cancelado',
        textColor: 'text-muted-foreground'
      };
    }
    
    if (estado.includes('confirmado')) {
      return {
        color: 'bg-primary',
        icon: CheckCircle2,
        label: 'Confirmado',
        textColor: 'text-primary'
      };
    }
    
    return {
      color: 'bg-warning',
      icon: Clock,
      label: 'Pendiente',
      textColor: 'text-warning'
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  
  return (
    <div 
      className="apple-card apple-hover-lift cursor-pointer transition-all duration-200 p-4 group relative"
      onDoubleClick={() => onDoubleClick(service)}
    >
      {/* Hover expand icon */}
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all" />
      
      {/* Header: ID + Estado + Fuente */}
      <div className="flex items-center justify-between mb-3 pr-6">
        <div className="flex items-center space-x-3">
          <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.color}`} />
          <div className="flex flex-col">
            <span className="apple-text-body font-semibold text-foreground">
              {service.id_servicio}
            </span>
            <Badge 
              variant="outline" 
              className={`text-xs w-fit mt-1 ${
                service.fuente_tabla === 'servicios_custodia' 
                  ? 'bg-success/10 text-success border-success/20' 
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}
            >
              {service.fuente_tabla === 'servicios_custodia' ? (
                <><Database className="w-3 h-3 mr-1" /> Ejecutado</>
              ) : (
                <><FileText className="w-3 h-3 mr-1" /> Planificado</>
              )}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <StatusIcon className={`w-4 h-4 ${statusConfig.textColor}`} />
          <span className={`apple-text-caption font-medium ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Cliente */}
      <div className="mb-2">
        <div className="apple-text-body font-medium text-foreground">
          {service.nombre_cliente}
        </div>
        {service.empresa_cliente && (
          <div className="apple-text-caption text-muted-foreground">
            {service.empresa_cliente}
          </div>
        )}
      </div>

      {/* Fecha y Hora */}
      <div className="flex items-center space-x-2 mb-2">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="apple-text-caption text-muted-foreground">
          {formatCDMXTime(service.fecha_hora_cita, 'PPP')}
        </span>
        <span className="text-muted-foreground">•</span>
        <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="apple-text-caption font-medium text-foreground">
          {formatCDMXTime(service.fecha_hora_cita, 'HH:mm')}
        </span>
      </div>

      {/* Ruta */}
      <div className="flex items-center space-x-2 mb-2">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <div className="flex items-center space-x-1 min-w-0">
          <span className="apple-text-caption text-muted-foreground truncate">
            {service.origen}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="apple-text-caption font-medium text-foreground truncate">
            {service.destino}
          </span>
        </div>
      </div>

      {/* Personal Asignado */}
      {(service.nombre_custodio || service.incluye_armado || service.armado_asignado) && (
        <div className="flex items-center space-x-4">
          {service.nombre_custodio && (
            <div className="flex items-center space-x-2">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="apple-text-caption text-muted-foreground">
                {service.nombre_custodio}
              </span>
            </div>
          )}
          
          {(service.incluye_armado || service.armado_asignado) && (
            <div className="flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="apple-text-caption text-muted-foreground">
                Armado requerido
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
