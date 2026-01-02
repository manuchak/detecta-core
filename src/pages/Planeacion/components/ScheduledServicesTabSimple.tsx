import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useScheduledServices } from '@/hooks/useScheduledServices';
import { usePendingServices } from '@/hooks/usePendingServices';
import { usePendingArmadoServices } from '@/hooks/usePendingArmadoServices';
import { useServiciosPlanificados } from '@/hooks/useServiciosPlanificados';
import { useServiceTransformations } from '@/hooks/useServiceTransformations';
import { PendingAssignmentModal } from '@/components/planeacion/PendingAssignmentModal';
import { AdditionalArmedGuard } from '@/components/planeacion/AdditionalArmedGuard';
import { EditServiceModal, type EditableService } from '@/components/planeacion/EditServiceModal';
import { ContextualEditModal } from '@/components/planeacion/ContextualEditModal';
import { ReassignmentModal, type ServiceForReassignment } from '@/components/planeacion/ReassignmentModal';
import { ServiceHistoryModal } from '@/components/planeacion/ServiceHistoryModal';
import { AirlineDateSelector } from '@/components/planeacion/AirlineDateSelector';
import { CustodianVehicleInfo } from '@/components/planeacion/CustodianVehicleInfo';
import { Clock, MapPin, User, Car, Shield, CheckCircle2, AlertCircle, Edit, RefreshCw, History, UserCircle, MapPinCheck, Calendar, CircleDot, Building2 } from 'lucide-react';
import { CancelServiceButton } from '@/components/planeacion/CancelServiceButton';
import { QuickCommentButton } from '@/components/planeacion/QuickCommentButton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function ScheduledServicesTab() {
  // Persist selected date in localStorage
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const saved = localStorage.getItem('planeacion_selected_date');
    if (saved) {
      const parsed = new Date(saved);
      // Only use saved date if it's within reasonable range (last 30 days to next 30 days)
      const now = new Date();
      const daysDiff = Math.abs((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 30) {
        return parsed;
      }
    }
    return new Date();
  });
  
  // Persist date changes
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    localStorage.setItem('planeacion_selected_date', date.toISOString());
  };
  
  const { data: summary, isLoading: loading, error, refetch } = useScheduledServices(selectedDate);
  const { summary: pendingSummary, loading: pendingLoading, refetch: refetchPending } = usePendingServices();
  const { summary: pendingArmadoSummary, loading: pendingArmadoLoading, refetch: refetchPendingArmado } = usePendingArmadoServices();
  const { 
    updateServiceConfiguration, 
    isUpdatingConfiguration,
    reassignCustodian,
    reassignArmedGuard,
    removeAssignment,
    isReassigning,
    cancelService,
    isCancelling
  } = useServiciosPlanificados();
  const { servicioToPending } = useServiceTransformations();
  
  // Estado para el modal de asignación
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedPendingService, setSelectedPendingService] = useState<any>(null);
  
  // Estado para el modal de edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditService, setSelectedEditService] = useState<EditableService | null>(null);
  
  // Estado para modales de Sprint 2 y 3
  const [reassignmentModalOpen, setReassignmentModalOpen] = useState(false);
  const [reassignmentService, setReassignmentService] = useState<ServiceForReassignment | null>(null);
  const [reassignmentType, setReassignmentType] = useState<'custodian' | 'armed_guard'>('custodian');
  
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyServiceId, setHistoryServiceId] = useState<string | null>(null);
  const [historyServiceName, setHistoryServiceName] = useState<string>('');

  // Estado operativo basado en hora_inicio_real y hora_fin_real
  // FIX: Use armado_nombre as primary indicator (comes from RPC with COALESCE fallback)
  const getOperationalStatus = (service: any) => {
    const now = new Date();
    const citaTime = new Date(service.fecha_hora_cita);
    
    // FIX: Check armado_nombre first (comes from RPC), then armado_asignado as fallback
    const hasArmedGuard = !!(service.armado_nombre || service.armado_asignado);
    const needsArmedGuard = service.incluye_armado || service.requiere_armado;
    const isFullyAssigned = service.custodio_nombre && (!needsArmedGuard || hasArmedGuard);
    
    // Servicio completado (tiene hora_fin_real)
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
    
    // Custodio en sitio (tiene hora_inicio_real pero no hora_fin)
    if (service.hora_inicio_real) {
      return { 
        status: 'en_sitio', 
        color: 'bg-blue-500', 
        textColor: 'text-blue-700 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        icon: MapPinCheck, 
        label: 'En sitio',
        priority: 4
      };
    }
    
    // Sin custodio asignado (crítico)
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
    
    // FIX: Falta armado - use improved detection
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
    
    // Servicio debería haber iniciado (pasó la hora de cita y está asignado)
    if (citaTime < now && isFullyAssigned) {
      return { 
        status: 'pendiente_inicio', 
        color: 'bg-amber-500', 
        textColor: 'text-amber-700 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        icon: Clock, 
        label: 'Pendiente inicio',
        priority: 3
      };
    }
    
    // Servicio futuro, completamente asignado y listo
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
    
    // Caso por defecto
    return { 
      status: 'pendiente', 
      color: 'bg-yellow-500', 
      textColor: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      icon: CircleDot, 
      label: 'Pendiente',
      priority: 3
    };
  };

  const getStatusConfig = (service: any) => {
    const isFullyPlanned = service.custodio_nombre && (!service.incluye_armado || service.armado_asignado);
    
    // Si está completamente planeado, está listo para ejecutar
    if (isFullyPlanned) {
      return {
        color: 'bg-green-500',
        icon: CheckCircle2,
        message: 'Listo para ejecutar',
        actionIcon: null
      };
    }
    
    // Si falta armado (crítico)
    if (service.incluye_armado && !service.armado_asignado) {
      return {
        color: 'bg-red-500',
        icon: Shield,
        message: 'Armado pendiente de asignación',
        actionIcon: AlertCircle
      };
    }
    
    // 🆕 Mostrar nombre del armado cuando está asignado
    if (service.incluye_armado && service.armado_asignado && service.armado_nombre) {
      return {
        color: 'bg-blue-500',
        icon: Shield,
        message: `Armado: ${service.armado_nombre}`,
        actionIcon: CheckCircle2
      };
    }
    
    // Si falta custodio (crítico)
    if (!service.custodio_nombre) {
      return {
        color: 'bg-red-500',
        icon: User,
        message: 'Custodio pendiente de asignación',
        actionIcon: AlertCircle
      };
    }
    
    // Caso por defecto: requiere atención
    return {
      color: 'bg-yellow-500',
      icon: AlertCircle,
      message: 'Requiere atención',
      actionIcon: Edit
    };
  };

  const handleEditService = (service: any) => {
    const needsCustodianAssignment = !service.custodio_nombre;
    const needsArmedGuardAssignment = (service.incluye_armado || service.requiere_armado) && !service.armado_asignado;
    const isPendingAssignment = needsCustodianAssignment || needsArmedGuardAssignment;

    if (isPendingAssignment) {
      // ✅ Conversión robusta y tipada usando el hook de transformación
      const pendingService = servicioToPending({
        id: service.id,
        folio: service.id_servicio || service.id,
        cliente: service.cliente_nombre || service.nombre_cliente || '',
        origen_texto: service.origen || '',
        destino_texto: service.destino || '',
        fecha_programada: service.fecha_hora_cita?.split('T')[0] || '',
        hora_ventana_inicio: service.fecha_hora_cita?.split('T')[1]?.substring(0,5) || '09:00',
        tipo_servicio: service.tipo_servicio || 'custodia',
        requiere_armado: service.incluye_armado || service.requiere_armado || false,
        notas_especiales: service.observaciones,
        created_at: service.created_at || new Date().toISOString(),
        // ✅ CORRECCIÓN + DEBUG: Enviar string directo con fallback múltiple
        custodio_asignado: service.custodio_nombre || service.custodio_asignado || null,
        estado: service.estado
      } as any);
      
      // 🔍 DEBUG LOG: Verificar datos antes de abrir modal
      console.log('🔍 [ScheduledServicesTab] Abriendo modal con servicio:', {
        id: service.id,
        id_servicio: service.id_servicio,
        custodio_nombre: service.custodio_nombre,
        custodio_asignado_construido: service.custodio_nombre || service.custodio_asignado || null,
        armado_asignado: service.armado_asignado,
        requiere_armado: service.incluye_armado || service.requiere_armado,
        pendingService_completo: pendingService
      });
      
      setSelectedPendingService(pendingService);
      setAssignmentModalOpen(true);
    } else {
      const editableService: EditableService = {
        id: service.id,
        id_servicio: service.id_servicio || service.id,
        nombre_cliente: service.cliente_nombre || service.nombre_cliente,
        empresa_cliente: service.empresa_cliente,
        email_cliente: service.email_cliente,
        telefono_cliente: service.telefono_cliente,
        origen: service.origen,
        destino: service.destino,
        fecha_hora_cita: service.fecha_hora_cita,
        tipo_servicio: service.tipo_servicio || 'custodia',
        requiere_armado: service.incluye_armado || service.requiere_armado || false,
        custodio_asignado: service.custodio_nombre,
        armado_asignado: service.armado_asignado,
        observaciones: service.observaciones,
        estado_planeacion: service.estado
      };
      setSelectedEditService(editableService);
      setEditModalOpen(true);
    }
  };

  const handleSaveServiceEdit = async (id: string, data: Partial<EditableService>) => {
    await updateServiceConfiguration({ id, data });
    
    await Promise.all([
      refetch(),
      refetchPending(),
      refetchPendingArmado()
    ]);
    
    if (data.fecha_hora_cita) {
      setSelectedDate(new Date(data.fecha_hora_cita));
    }
  };

  const handleReassignCustodian = (service: any) => {
    const serviceForReassignment: ServiceForReassignment = {
      id: service.id,
      id_servicio: service.id_servicio || service.id,
      nombre_cliente: service.cliente_nombre || service.nombre_cliente,
      origen: service.origen,
      destino: service.destino,
      fecha_hora_cita: service.fecha_hora_cita,
      custodio_asignado: service.custodio_nombre,
      armado_asignado: service.armado_asignado,
      requiere_armado: service.incluye_armado || service.requiere_armado || false,
      estado_planeacion: service.estado
    };
    setReassignmentService(serviceForReassignment);
    setReassignmentType('custodian');
    setReassignmentModalOpen(true);
  };

  const handleReassignArmedGuard = (service: any) => {
    // Validación defensiva: asegurar que tenemos el UUID correcto
    const serviceUuid = service.id;
    
    // Log para debugging
    console.log('🔍 handleReassignArmedGuard - service data:', {
      id: service.id,
      id_servicio: service.id_servicio,
      isValidUuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(service.id)
    });
    
    // Validar que service.id es un UUID válido
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(serviceUuid)) {
      toast.error('Error de configuración', {
        description: 'ID de servicio inválido. Por favor recarga la página.'
      });
      console.error('❌ Invalid UUID detected:', serviceUuid);
      return;
    }
    
    const serviceForReassignment: ServiceForReassignment = {
      id: serviceUuid,  // UUID validado
      id_servicio: service.id_servicio || 'Sin ID',
      nombre_cliente: service.cliente_nombre || service.nombre_cliente,
      origen: service.origen,
      destino: service.destino,
      fecha_hora_cita: service.fecha_hora_cita,
      custodio_asignado: service.custodio_nombre,
      armado_asignado: service.armado_asignado,
      requiere_armado: service.incluye_armado || service.requiere_armado || false,
      estado_planeacion: service.estado
    };
    setReassignmentService(serviceForReassignment);
    setReassignmentType('armed_guard');
    setReassignmentModalOpen(true);
  };

  const handleShowHistory = (service: any) => {
    setHistoryServiceId(service.id);
    setHistoryServiceName(`${service.cliente_nombre} - ${service.id_servicio}`);
    setHistoryModalOpen(true);
  };

  const handleReassignmentComplete = async () => {
    await Promise.all([
      refetch(),
      refetchPending(),
      refetchPendingArmado()
    ]);
  };

  const handleCancelService = async (serviceId: string, reason?: string) => {
    await cancelService.mutateAsync({ serviceId, reason });
    await Promise.all([
      refetch(),
      refetchPending(),
      refetchPendingArmado()
    ]);
  };

  if (loading) {
    return (
      <div className="apple-loading-state">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div
      className="apple-container space-y-8"
      onMouseDownCapture={(e) => {
        // 🎯 CRITICAL FIX: Detectar si el click está DENTRO de un diálogo
        const target = e.target as HTMLElement;
        const isInsideDialog = !!target.closest('[role="dialog"], [role="alertdialog"]');
        
        // Si está dentro de un diálogo, permitir la propagación normal del evento
        if (isInsideDialog) {
          console.log('[ScheduledServicesTabSimple] Click dentro de diálogo - permitiendo propagación');
          return;
        }
        
        // Solo bloquear eventos si hay un diálogo ABIERTO y el click está FUERA
        const anyDialog = document.body.dataset.dialogOpen === "1" || document.body.dataset.dialogTransitioning === "1" || !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
        if (anyDialog) {
          console.log('[ScheduledServicesTabSimple] Bloqueando click fuera del diálogo');
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onClickCapture={(e) => {
        // 🎯 CRITICAL FIX: Detectar si el click está DENTRO de un diálogo
        const target = e.target as HTMLElement;
        const isInsideDialog = !!target.closest('[role="dialog"], [role="alertdialog"]');
        
        // Si está dentro de un diálogo, permitir la propagación normal del evento
        if (isInsideDialog) {
          return;
        }
        
        // Solo bloquear eventos si hay un diálogo ABIERTO y el click está FUERA
        const anyDialog = document.body.dataset.dialogOpen === "1" || document.body.dataset.dialogTransitioning === "1" || !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
        if (anyDialog) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {/* Header */}
      <div className="apple-section-header">
        <div>
          <h1 className="apple-text-largetitle text-foreground">Servicios Programados</h1>
          <p className="apple-text-body text-muted-foreground">
            Agenda de servicios del día
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AirlineDateSelector 
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
          <button
            onClick={() => refetch()}
            className="apple-button-ghost"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Date Header */}
      <div className="apple-date-header">
        <div className="apple-text-title">{format(selectedDate, 'PPP', { locale: es })}</div>
        <div className="apple-summary-compact">
          <div className="apple-summary-item">
            <span className="apple-summary-value">{summary?.total_services || 0}</span>
            <span className="apple-summary-label">total</span>
          </div>
          <div className="apple-summary-item">
            <span className="apple-summary-value apple-text-success">{summary?.assigned_services || 0}</span>
            <span className="apple-summary-label">asignados</span>
          </div>
          <div className="apple-summary-item">
            <span className="apple-summary-value apple-text-warning">{pendingSummary?.total_pending || 0}</span>
            <span className="apple-summary-label">pendientes</span>
          </div>
        </div>
      </div>

      {/* Services Agenda */}
      <div className="space-y-4">
        {error && (
          <div className="apple-empty-state">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <div className="apple-text-headline text-red-700">Error al cargar</div>
            <div className="apple-text-body text-secondary">{error instanceof Error ? error.message : 'Error desconocido'}</div>
          </div>
        )}

        {!error && summary?.services_data && summary.services_data.length === 0 && (
          <div className="apple-empty-state">
            <CheckCircle2 className="h-8 w-8 text-secondary mx-auto mb-3" />
            <div className="apple-text-headline text-secondary">Sin servicios</div>
            <div className="apple-text-body text-tertiary">No hay servicios programados para esta fecha</div>
          </div>
        )}

        {/* Leyenda de estados operativos */}
        {!error && summary?.services_data && summary.services_data.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-1 py-2 text-xs">
            <span className="text-muted-foreground font-medium">Estados:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Completado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">En sitio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Pendiente inicio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-muted-foreground">Programado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Armado pendiente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Sin asignar</span>
            </div>
          </div>
        )}

        {!error && summary?.services_data && summary.services_data.length > 0 && (
          <div className="space-y-4">
            {/* Sort services chronologically by fecha_hora_cita */}
            {[...summary.services_data]
              .sort((a, b) => new Date(a.fecha_hora_cita).getTime() - new Date(b.fecha_hora_cita).getTime())
              .map((service, index) => {
              const statusConfig = getStatusConfig(service);
              const operationalStatus = getOperationalStatus(service);
              const StatusIcon = statusConfig.icon;
              const ActionIcon = statusConfig.actionIcon;
              const OperationalIcon = operationalStatus.icon;
              
              return (
                <div 
                  key={service.id || index} 
                  className="apple-card apple-hover-lift cursor-pointer transition-all duration-200 p-4 group relative overflow-hidden"
                  onClick={(e) => {
                    const target = (e.target as HTMLElement);
                    if (target.closest('.service-card-actions')) return;
                    if (document.body.dataset.dialogOpen === "1" || document.body.dataset.dialogTransitioning === "1") return;
                    const isAnyDialogOpen = !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
                    if (isAnyDialogOpen) return;
                    handleEditService(service);
                  }}
                >
                  {/* Barra de estado operativo en el lado izquierdo */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${operationalStatus.color}`} />
                  
                  {/* Línea 1: Estado + Hora + Cliente + Badge Operativo + Acción */}
                  <div className="flex items-center justify-between mb-3 pl-3">
                    <div className="flex items-center space-x-3">
                      {/* Hora */}
                      <span className="apple-text-headline font-semibold text-foreground tabular-nums">
                        {format(new Date(service.fecha_hora_cita), 'HH:mm')}
                      </span>
                      
                      {/* Cliente */}
                      <div className="flex flex-col">
                        <span className="apple-text-body font-medium text-foreground">
                          {service.cliente_nombre}
                        </span>
                        <span className="apple-text-caption text-muted-foreground">
                          {service.id_servicio}
                        </span>
                      </div>
                      
                      {/* Badge de estado operativo */}
                      <Badge 
                        variant="secondary" 
                        className={`${operationalStatus.bgColor} ${operationalStatus.textColor} border-0 gap-1 text-xs font-medium`}
                      >
                        <OperationalIcon className="w-3 h-3" />
                        {operationalStatus.label}
                      </Badge>
                      
                      {/* Badge PF (Persona Física) */}
                      {service.tipo_servicio?.toLowerCase() === 'pf' && (
                        <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 gap-1 text-xs font-medium">
                          <Building2 className="w-3 h-3" />
                          PF
                        </Badge>
                      )}
                    </div>
                    
                    {/* Íconos de acción */}
                    <div className="flex items-center space-x-1 service-card-actions" onClick={(e) => e.stopPropagation()}>
                      {ActionIcon && (
                        <ActionIcon className="w-4 h-4 text-muted-foreground opacity-60" />
                      )}
                      <CancelServiceButton
                        serviceId={service.id}
                        serviceName={service.cliente_nombre}
                        onCancel={handleCancelService}
                        disabled={service.estado_asignacion === 'cancelado' || isCancelling}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowHistory(service);
                        }}
                        className="apple-button-ghost-small opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                      <QuickCommentButton
                        serviceId={service.id}
                        currentComment={service.comentarios_planeacion}
                      />
                    </div>
                  </div>
                  
                  {/* Línea 2: Ruta */}
                  <div className="flex items-center space-x-2 mb-3 pl-3">
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
                  
                  {/* Línea 3: Custodio + Vehículo */}
                  <div className="pl-3">
                    <CustodianVehicleInfo 
                      custodioNombre={service.custodio_nombre}
                      className="mb-3"
                    />
                  </div>
                  
                  {/* Armado Adicional */}
                  <div className="pl-3">
                    <AdditionalArmedGuard 
                      custodioNombre={service.custodio_nombre}
                      armadoAsignado={service.armado_asignado}
                      armadoNombre={service.armado_nombre}
                    />
                  </div>
                  
                  {/* Línea 3.5: Planificador (solo si existe) */}
                  {service.planner_name && (
                    <div className="flex items-center space-x-1.5 mb-3 pl-3">
                      <UserCircle className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span className="apple-text-caption text-muted-foreground/70">
                        Asignado por {service.planner_name}
                      </span>
                    </div>
                  )}
                  
                  {/* Línea 4: Mensaje de estado (solo si hay algo pendiente) */}
                  {(statusConfig.message && statusConfig.color !== 'bg-green-500') && (
                    <div className="flex items-center space-x-2 pl-3">
                      <StatusIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="apple-text-caption text-muted-foreground">
                        {statusConfig.message}
                      </span>
                      {service.incluye_armado && !service.armado_asignado && (
                        <Shield className="w-3.5 h-3.5 text-red-500 ml-1" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <PendingAssignmentModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
        service={selectedPendingService}
        onAssignmentComplete={async () => {
          await Promise.all([refetch(), refetchPending(), refetchPendingArmado()]);
        }}
      />

      <ContextualEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        service={selectedEditService}
        onSave={handleSaveServiceEdit}
        isLoading={isUpdatingConfiguration}
        onStartReassignment={(type, service) => {
          setEditModalOpen(false);
          if (type === 'armed_guard') {
            handleReassignArmedGuard(service);
          } else {
            handleReassignCustodian(service);
          }
        }}
      />

      <ReassignmentModal
        open={reassignmentModalOpen}
        onOpenChange={setReassignmentModalOpen}
        service={reassignmentService}
        assignmentType={reassignmentType}
        onReassign={async (data) => {
          console.log('Reassignment data:', data);
          
          if (reassignmentType === 'custodian') {
            reassignCustodian({
              serviceId: data.serviceId,
              newCustodioId: data.newId,
              newCustodioName: data.newName,
              reason: data.reason
            });
          } else {
            // Reasignación de armado (puede ser interno o proveedor)
            reassignArmedGuard({
              serviceId: data.serviceId,
              newArmadoId: data.newId,
              newArmadoName: data.newName,
              assignmentType: data.assignmentType || 'interno',
              reason: data.reason,
              providerId: data.providerId,
              puntoEncuentro: data.puntoEncuentro,
              horaEncuentro: data.horaEncuentro,
              tarifaAcordada: data.tarifaAcordada,
              nombrePersonal: data.nombrePersonal
            });
            
            if (data.assignmentType === 'proveedor') {
              toast.info('Procesando asignación de proveedor externo...', { duration: 2000 });
            }
          }
          
          await handleReassignmentComplete();
          setReassignmentModalOpen(false);
        }}
      />

      <ServiceHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        serviceId={historyServiceId}
        serviceName={historyServiceName}
      />
    </div>
  );
}