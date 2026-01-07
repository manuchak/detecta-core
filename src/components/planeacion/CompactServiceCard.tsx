import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, User, Shield, CheckCircle2, AlertCircle, 
  Clock, MapPinCheck, Calendar, CircleDot, History, Car
} from 'lucide-react';
import { CancelServiceButton } from './CancelServiceButton';
import { QuickCommentButton } from './QuickCommentButton';
import { StatusUpdateButton, type OperationalStatus } from './StatusUpdateButton';
import { UpcomingServiceBadge, getUpcomingHighlightClass } from './UpcomingServiceBadge';
import { useCustodioVehicleData } from '@/hooks/useCustodioVehicleData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ScheduledService } from '@/hooks/useScheduledServices';

interface CompactServiceCardProps {
  service: ScheduledService;
  now: Date;
  onEdit: (service: ScheduledService) => void;
  onCancel: (serviceId: string, reason?: string) => Promise<void>;
  onStatusUpdate: (serviceId: string, action: 'mark_on_site' | 'revert_to_scheduled') => Promise<void>;
  onShowHistory: (service: ScheduledService) => void;
  onFalsePositioning?: (service: ScheduledService) => void;
  isCancelling?: boolean;
  isUpdatingStatus?: boolean;
}

// Operational status with updated colors per plan
export function getOperationalStatus(service: any) {
  const now = new Date();
  const citaTime = new Date(service.fecha_hora_cita);
  
  const hasArmedGuard = !!(service.armado_nombre || service.armado_asignado);
  const needsArmedGuard = service.incluye_armado || service.requiere_armado;
  const isFullyAssigned = service.custodio_nombre && (!needsArmedGuard || hasArmedGuard);
  
  // Completado
  if (service.hora_fin_real) {
    return { 
      status: 'completado', 
      color: 'bg-emerald-500', 
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      icon: CheckCircle2, 
      label: 'Completado',
      priority: 5
    };
  }
  
  // En sitio - CHANGED to green (emerald)
  if (service.hora_inicio_real) {
    return { 
      status: 'en_sitio', 
      color: 'bg-emerald-500', 
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      icon: MapPinCheck, 
      label: 'En sitio',
      priority: 4
    };
  }
  
  // Sin custodio
  if (!service.custodio_nombre) {
    return { 
      status: 'sin_asignar', 
      color: 'bg-red-500', 
      textColor: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      icon: AlertCircle, 
      label: 'Sin asignar',
      priority: 1
    };
  }
  
  // Falta armado
  if (needsArmedGuard && !hasArmedGuard) {
    return { 
      status: 'armado_pendiente', 
      color: 'bg-orange-500', 
      textColor: 'text-orange-700 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      icon: Shield, 
      label: 'Armado pendiente',
      priority: 2
    };
  }
  
  // Pendiente inicio (hora pasó) - CHANGED to rose (reddish)
  if (citaTime < now && isFullyAssigned) {
    return { 
      status: 'pendiente_inicio', 
      color: 'bg-rose-500', 
      textColor: 'text-rose-700 dark:text-rose-400',
      bgColor: 'bg-rose-100 dark:bg-rose-900/30',
      icon: Clock, 
      label: 'Pendiente arribar',
      priority: 3
    };
  }
  
  // Programado
  if (isFullyAssigned) {
    return { 
      status: 'programado', 
      color: 'bg-slate-400', 
      textColor: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-100 dark:bg-slate-800/50',
      icon: Calendar, 
      label: 'Programado',
      priority: 6
    };
  }
  
  return { 
    status: 'pendiente', 
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: CircleDot, 
    label: 'Pendiente',
    priority: 3
  };
}

export function CompactServiceCard({
  service,
  now,
  onEdit,
  onCancel,
  onStatusUpdate,
  onShowHistory,
  onFalsePositioning,
  isCancelling = false,
  isUpdatingStatus = false
}: CompactServiceCardProps) {
  const operationalStatus = getOperationalStatus(service);
  const OperationalIcon = operationalStatus.icon;
  const citaTime = new Date(service.fecha_hora_cita);
  const upcomingHighlight = getUpcomingHighlightClass(citaTime, now);
  
  // Vehicle data for inline display
  const { vehicleData, shouldShowVehicle, isHybridCustodian } = useCustodioVehicleData(service.custodio_nombre || undefined);
  
  // PF detection
  const tipoServicio = service.tipo_servicio?.toLowerCase() || '';
  const isPF = tipoServicio.startsWith('pf_') || tipoServicio === 'pf';
  
  // Armed guard detection
  const hasArmedGuard = !!(service.armado_nombre);
  const needsArmedGuard = service.incluye_armado || service.requiere_armado;
  const showArmedSection = needsArmedGuard && hasArmedGuard && !isHybridCustodian();
  
  // False positioning detection
  const isFalsePositioning = (service as any).posicionamiento_falso === true;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.service-card-actions')) return;
    if (document.body.dataset.dialogOpen === "1" || document.body.dataset.dialogTransitioning === "1") return;
    const isAnyDialogOpen = !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
    if (isAnyDialogOpen) return;
    onEdit(service);
  };

  return (
    <div 
      className={cn(
        "apple-card cursor-pointer transition-all duration-200 py-2.5 px-3 group relative overflow-hidden hover:shadow-md",
        upcomingHighlight
      )}
      onClick={handleCardClick}
    >
      {/* Left status bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${operationalStatus.color}`} />
      
      {/* Row 1: Cliente | Hora | ID | Status Badge | Actions */}
      <div className="flex items-center justify-between gap-3 pl-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Cliente - prominent */}
          <span className="font-semibold text-sm text-foreground truncate max-w-[180px] flex-shrink-0">
            {service.cliente_nombre || service.nombre_cliente}
          </span>
          
          {/* Hora */}
          <span className="text-sm font-medium text-foreground tabular-nums flex-shrink-0">
            {format(citaTime, 'HH:mm')}
          </span>
          
          {/* ID Servicio */}
          <code className="text-xs text-muted-foreground font-mono flex-shrink-0">
            {service.id_servicio}
          </code>
          
          {/* Upcoming badge */}
          <UpcomingServiceBadge citaTime={citaTime} now={now} />
          
          {/* Status badge */}
          <Badge 
            variant="secondary" 
            className={`${operationalStatus.bgColor} ${operationalStatus.textColor} border-0 gap-1 text-[10px] font-medium px-1.5 py-0.5 flex-shrink-0`}
          >
            <OperationalIcon className="w-3 h-3" />
            {operationalStatus.label}
          </Badge>
          
          {/* PF Badge */}
          {isPF && (
            <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 text-[10px] px-1.5 py-0.5 flex-shrink-0">
              <User className="w-2.5 h-2.5 mr-0.5" />
              PF
            </Badge>
          )}
          
          {/* False Positioning Badge */}
          {isFalsePositioning && (
            <Badge variant="outline" className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 text-[10px] px-1.5 py-0.5 flex-shrink-0">
              <MapPin className="w-2.5 h-2.5 mr-0.5" />
              Pos. Falso
            </Badge>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-0.5 service-card-actions flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <StatusUpdateButton
            serviceId={service.id}
            currentStatus={operationalStatus.status as OperationalStatus}
            onStatusChange={onStatusUpdate}
            disabled={isCancelling || isUpdatingStatus}
            isLoading={isUpdatingStatus}
          />
          <CancelServiceButton
            serviceId={service.id}
            serviceName={service.cliente_nombre || service.nombre_cliente || ''}
            serviceStarted={operationalStatus.status === 'en_sitio'}
            onCancel={onCancel}
            disabled={service.estado_asignacion === 'cancelado' || isCancelling}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onShowHistory(service);
            }}
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <History className="h-3.5 w-3.5" />
          </Button>
          <QuickCommentButton
            serviceId={service.id}
            currentComment={service.comentarios_planeacion}
          />
        </div>
      </div>
      
      {/* Row 2: Ruta + Custodio + Vehículo */}
      <div className="flex items-center gap-2 mt-1.5 pl-2 text-xs text-muted-foreground">
        {/* Ruta */}
        <div className="flex items-center gap-1 min-w-0">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[140px]">{service.origen}</span>
          <span className="flex-shrink-0">→</span>
          <span className="truncate max-w-[140px] font-medium text-foreground">{service.destino}</span>
        </div>
        
        <span className="text-muted-foreground/50 flex-shrink-0">•</span>
        
        {/* Custodio */}
        {service.custodio_nombre ? (
          <div className="flex items-center gap-1 min-w-0">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium text-foreground truncate max-w-[120px]">{service.custodio_nombre}</span>
            {isHybridCustodian() && (
              <Shield className="w-3 h-3 text-amber-500 flex-shrink-0" />
            )}
          </div>
        ) : (
          <span className="text-red-500 font-medium">Sin custodio</span>
        )}
        
        {/* Vehículo inline */}
        {shouldShowVehicle() && vehicleData && (
          <>
            <span className="text-muted-foreground/50 flex-shrink-0">•</span>
            <div className="flex items-center gap-1">
              <Car className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[100px]">
                {vehicleData.marca} {vehicleData.modelo}
              </span>
              {vehicleData.placa !== 'Sin placa' && (
                <code className="font-mono text-[10px]">{vehicleData.placa}</code>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Row 3 (conditional): Armado */}
      {showArmedSection && (
        <div className="flex items-center gap-1 mt-1 pl-2 text-xs">
          <Shield className="w-3 h-3 text-amber-600 flex-shrink-0" />
          <span className="font-medium text-foreground">{service.armado_nombre}</span>
          <span className="text-muted-foreground/60 italic">(Acompañante)</span>
        </div>
      )}
    </div>
  );
}
