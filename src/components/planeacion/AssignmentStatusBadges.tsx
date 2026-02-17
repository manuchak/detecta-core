import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Shield, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import type { EditableService } from './EditServiceModal';

interface AssignmentStatusBadgesProps {
  service: EditableService;
  size?: 'sm' | 'md';
}

export function AssignmentStatusBadges({ service, size = 'sm' }: AssignmentStatusBadgesProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const cantidadRequeridos = service.cantidad_armados_requeridos || 1;
  
  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={service.custodio_asignado ? 'default' : 'outline'}
        className={`gap-1 ${service.custodio_asignado ? 'bg-success/10 text-success border-success/20' : ''}`}
      >
        <User className={iconSize} />
        {service.custodio_asignado || 'Pendiente'}
      </Badge>
      
      {service.requiere_armado && (
        <Badge 
          variant={service.armado_asignado ? 'default' : 'outline'}
          className={`gap-1 ${
            service.armado_asignado 
              ? 'bg-success/10 text-success border-success/20' 
              : 'bg-warning/10 text-warning border-warning/20'
          }`}
        >
          <Shield className={iconSize} />
          {service.armado_asignado 
            ? (cantidadRequeridos > 1 ? `${cantidadRequeridos} armados` : service.armado_asignado)
            : 'Pendiente'
          }
        </Badge>
      )}
    </div>
  );
}

interface AssignmentIndicatorProps {
  assigned: boolean;
  required?: boolean;
}

export function AssignmentIndicator({ assigned, required = true }: AssignmentIndicatorProps) {
  if (assigned) {
    return <CheckCircle className="h-3 w-3 text-success ml-1" />;
  }
  if (required) {
    return <AlertCircle className="h-3 w-3 text-warning ml-1" />;
  }
  return <Circle className="h-3 w-3 text-muted-foreground ml-1" />;
}
