import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useScheduledServices } from '@/hooks/useScheduledServices';
import { usePendingServices } from '@/hooks/usePendingServices';
import { usePendingArmadoServices } from '@/hooks/usePendingArmadoServices';
import { useServiciosPlanificados } from '@/hooks/useServiciosPlanificados';
import { useServiceTransformations } from '@/hooks/useServiceTransformations';
import { useScrollPersistence, getScrollKeyForDate } from '@/hooks/useScrollPersistence';
import { PendingAssignmentModal } from '@/components/planeacion/PendingAssignmentModal';
import { AdditionalArmedGuard } from '@/components/planeacion/AdditionalArmedGuard';
import { EditServiceModal, type EditableService } from '@/components/planeacion/EditServiceModal';
import { ContextualEditModal } from '@/components/planeacion/ContextualEditModal';
import { ReassignmentModal, type ServiceForReassignment } from '@/components/planeacion/ReassignmentModal';
import { ServiceHistoryModal } from '@/components/planeacion/ServiceHistoryModal';
import { AirlineDateSelector } from '@/components/planeacion/AirlineDateSelector';
import { CustodianVehicleInfo } from '@/components/planeacion/CustodianVehicleInfo';
import { StatusUpdateButton, type OperationalStatus } from '@/components/planeacion/StatusUpdateButton';
import { HourDivider } from '@/components/planeacion/HourDivider';
import { UpcomingServiceBadge, getUpcomingHighlightClass } from '@/components/planeacion/UpcomingServiceBadge';
import { Clock, MapPin, User, Car, Shield, CheckCircle2, AlertCircle, Edit, RefreshCw, History, UserCircle, MapPinCheck, Calendar, CircleDot, Building2, Info, Copy, MapPinOff } from 'lucide-react';
import { CancelServiceButton } from '@/components/planeacion/CancelServiceButton';
import { QuickCommentButton } from '@/components/planeacion/QuickCommentButton';
import { FalsePositioningDialog } from '@/components/planeacion/FalsePositioningDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCDMXTime, getCDMXDate } from '@/utils/cdmxTimezone';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ScheduledServicesTab() {
  // Persist selected date in localStorage
  // ✅ FIX: Parsear yyyy-MM-dd a mediodía local para evitar drift de timezone
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const saved = localStorage.getItem('planeacion_selected_date');
    if (saved) {
      // Si es formato yyyy-MM-dd, parsearlo a mediodía local
      const dateMatch = saved.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
        const now = new Date();
        const daysDiff = Math.abs((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 30) {
          return parsed;
        }
      } else {
        // Fallback para formato ISO viejo
        const parsed = new Date(saved);
        const now = new Date();
        const daysDiff = Math.abs((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 30) {
          return parsed;
        }
      }
    }
    return new Date();
  });
  
  // Auto-refresh timer for upcoming service badges
  // Pauses when dialog is open to prevent re-renders that cause popup jumping
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      // Enhanced dialog detection - prevents popup jumping
      const hasDialogFlag = document.body.dataset.dialogOpen === "1" || 
                           document.body.dataset.dialogTransitioning === "1";
      const hasOpenDialog = !!document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'
      );
      
      if (hasDialogFlag || hasOpenDialog) return;
      setNow(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);
  
  // Scroll persistence
  const scrollKey = getScrollKeyForDate(selectedDate);
  const { containerRef, clearScrollPosition } = useScrollPersistence({
    key: scrollKey,
    enabled: true
  });
  
  // Persist date changes
  // ✅ FIX: Guardar solo yyyy-MM-dd para evitar drift de timezone al rehidratar
  const handleDateChange = (date: Date) => {
    clearScrollPosition(); // Clear scroll when changing date
    setSelectedDate(date);
    localStorage.setItem('planeacion_selected_date', format(date, 'yyyy-MM-dd'));
  };
  
  const { data: summary, isLoading: loading, error, refetch } = useScheduledServices(selectedDate);

  // Count false positionings
  const falsePositioningCount = useMemo((): number => {
    if (!summary?.services_data) return 0;
    return summary.services_data.filter(
      (s: any) => s.posicionamiento_falso === true || s.posicionamiento_falso === 'true'
    ).length;
  }, [summary?.services_data]);

  // Config for estados OPERATIVOS del semáforo (calculados en tiempo real)
  const ESTADO_OPERATIVO_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; priority: number }> = {
    'sin_asignar': { label: 'Sin asignar', bgColor: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400', priority: 1 },
    'armado_pendiente': { label: 'Armado pend.', bgColor: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400', priority: 2 },
    'pendiente_inicio': { label: 'Pend. arribar', bgColor: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', priority: 3 },
    'pendiente': { label: 'Pendiente', bgColor: 'bg-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400', priority: 4 },
    'programado': { label: 'Programado', bgColor: 'bg-slate-400', textColor: 'text-slate-600 dark:text-slate-400', priority: 5 },
    'en_sitio': { label: 'En sitio', bgColor: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', priority: 6 },
    'completado': { label: 'Completado', bgColor: 'bg-green-600', textColor: 'text-green-600 dark:text-green-400', priority: 7 },
  };

  // Count services by ESTADO OPERATIVO (calculado en tiempo real)
  const operationalStatusCounts = useMemo((): Record<string, number> => {
    if (!summary?.services_data) return {};
    const counts: Record<string, number> = {};
    summary.services_data.forEach((service: any) => {
      const opStatus = getOperationalStatus(service);
      counts[opStatus.status] = (counts[opStatus.status] || 0) + 1;
    });
    return counts;
  }, [summary?.services_data]);

  // Group services by client for breakdown popover
  const servicesByClient = useMemo((): Array<{ name: string; count: number }> => {
    if (!summary?.services_data) return [];
    const clientCounts: Record<string, number> = {};
    summary.services_data.forEach((service) => {
      const clientName = service.cliente_nombre || 'Sin cliente';
      clientCounts[clientName] = (clientCounts[clientName] || 0) + 1;
    });
    return Object.entries(clientCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [summary?.services_data]);

  // Copy client breakdown to clipboard
  const copyClientBreakdown = async () => {
    const dateStr = format(selectedDate, 'dd/MM/yyyy', { locale: es });
    const lines = [
      `Servicios del ${dateStr}`,
      '─'.repeat(30),
      ...servicesByClient.map(({ name, count }) => 
        `${name.padEnd(25)} ${count}`
      ),
      '─'.repeat(30),
      `Total:${' '.repeat(19)}${summary?.total_services || 0}`,
    ];
    
    await navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Lista copiada al portapapeles');
  };
  const { summary: pendingSummary, loading: pendingLoading, refetch: refetchPending } = usePendingServices(selectedDate);
  const { summary: pendingArmadoSummary, loading: pendingArmadoLoading, refetch: refetchPendingArmado } = usePendingArmadoServices();
  const { 
    updateServiceConfiguration, 
    isUpdatingConfiguration,
    updateOperationalStatus,
    isUpdatingOperationalStatus,
    reassignCustodian,
    reassignArmedGuard,
    removeAssignment,
    isReassigning,
    cancelService,
    isCancelling,
    markFalsePositioning,
    isMarkingFalsePositioning
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
  
  // State for False Positioning Dialog
  const [falsePositioningDialogOpen, setFalsePositioningDialogOpen] = useState(false);
  const [falsePositioningService, setFalsePositioningService] = useState<any>(null);
  
  // Sprint 3: PF Filter state
  const [tipoClienteFilter, setTipoClienteFilter] = useState<'todos' | 'empresarial' | 'pf'>('todos');

  // Import operational status from CompactServiceCard
  // Estado operativo basado en hora_inicio_real y hora_fin_real
  const getOperationalStatus = (service: any) => {
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
    
    // En sitio - GREEN (emerald)
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
    
    // Pendiente inicio (hora pasó) - ROSE (reddish)
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
      // ✅ FIX: Usar getCDMXDate/formatCDMXTime en lugar de split('T') para evitar bug UTC off-by-one
      const pendingService = servicioToPending({
        id: service.id,
        folio: service.id_servicio || service.id,
        cliente: service.cliente_nombre || service.nombre_cliente || '',
        origen_texto: service.origen || '',
        destino_texto: service.destino || '',
        fecha_programada: service.fecha_hora_cita ? getCDMXDate(service.fecha_hora_cita) : '',
        hora_ventana_inicio: service.fecha_hora_cita ? formatCDMXTime(service.fecha_hora_cita, 'HH:mm') : '09:00',
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
        id_interno_cliente: service.id_interno_cliente,
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
    // Check if this is a false positioning request
    if (reason === 'posicionamiento_falso') {
      // Find the service and open the false positioning dialog
      const service = summary?.services_data?.find(s => s.id === serviceId);
      if (service) {
        setFalsePositioningService(service);
        setFalsePositioningDialogOpen(true);
      }
      return;
    }
    
    await cancelService.mutateAsync({ serviceId, reason });
    await Promise.all([refetch(), refetchPending(), refetchPendingArmado()]);
  };

  const handleFalsePositioning = async (data: {
    serviceId: string;
    horaLlegada: string;
    motivo: string;
    cobroPosicionamiento: boolean;
  }) => {
    await markFalsePositioning.mutateAsync({
      serviceId: data.serviceId,
      horaLlegada: data.horaLlegada,
      motivo: data.motivo,
      cobroPosicionamiento: data.cobroPosicionamiento
    });
    setFalsePositioningDialogOpen(false);
    setFalsePositioningService(null);
    await Promise.all([refetch(), refetchPending(), refetchPendingArmado()]);
  };

  const handleStatusUpdate = async (serviceId: string, action: 'mark_on_site' | 'revert_to_scheduled') => {
    await updateOperationalStatus.mutateAsync({ serviceId, action });
    await refetch();
  };

  // Group services by hour for chronological visualization
  // Sprint 3: Include PF filter in grouping
  const groupedServices = useMemo(() => {
    if (!summary?.services_data || summary.services_data.length === 0) {
      return {};
    }
    
    // Apply PF filter
    let filteredData = summary.services_data;
    if (tipoClienteFilter !== 'todos') {
      filteredData = summary.services_data.filter(service => {
        const tipoServicio = service.tipo_servicio?.toLowerCase() || '';
        const isPF = tipoServicio.startsWith('pf_') || tipoServicio === 'pf';
        return tipoClienteFilter === 'pf' ? isPF : !isPF;
      });
    }
    
    const sorted = [...filteredData].sort(
      (a, b) => new Date(a.fecha_hora_cita).getTime() - new Date(b.fecha_hora_cita).getTime()
    );
    
    const grouped: Record<string, typeof sorted> = {};
    sorted.forEach(service => {
      // Use CDMX timezone for grouping by hour
      const hour = formatCDMXTime(service.fecha_hora_cita, 'HH:00');
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(service);
    });
    
    return grouped;
  }, [summary?.services_data, tipoClienteFilter]);

  // Count filtered services
  const filteredCount = useMemo(() => {
    return Object.values(groupedServices).flat().length;
  }, [groupedServices]);

  const currentHour = format(now, 'HH:00');

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
          <Popover>
            <PopoverTrigger asChild>
              <button 
                type="button"
                className="apple-summary-item cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-3 py-2 transition-colors group focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div className="flex items-center gap-1">
                  <span className="apple-summary-value">{summary?.total_services || 0}</span>
                  <Info className="h-3.5 w-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="apple-summary-label">total</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-popover z-[100] border-2 border-slate-200 shadow-lg" align="center" sideOffset={8}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Desglose por Cliente</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyClientBreakdown}
                    className="h-7 px-2"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copiar
                  </Button>
                </div>
                
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {servicesByClient.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin servicios</p>
                  ) : (
                    servicesByClient.map(({ name, count }) => (
                      <div key={name} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[200px]">{name}</span>
                        <span className="font-medium tabular-nums">{count}</span>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="pt-2 border-t flex justify-between font-semibold text-sm">
                  <span>Total</span>
                  <span className="tabular-nums">{summary?.total_services || 0}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="apple-summary-item">
            <span className="apple-summary-value apple-text-success">{summary?.assigned_services || 0}</span>
            <span className="apple-summary-label">asignados</span>
          </div>
          <div className="apple-summary-item">
            <span className="apple-summary-value apple-text-warning">{pendingSummary?.total_pending || 0}</span>
            <span className="apple-summary-label">pendientes</span>
          </div>
          {falsePositioningCount > 0 && (
            <div className="apple-summary-item">
              <span className="apple-summary-value text-violet-600 dark:text-violet-400">{falsePositioningCount}</span>
              <span className="apple-summary-label">pos. falso</span>
            </div>
          )}
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

        {/* Consolidated Controls Row: Filters + Status Semáforo */}
        {!error && summary?.services_data && summary.services_data.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-2.5 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border/50">
            {/* Left: Client Type Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Filtrar:</span>
              <div className="flex gap-1">
                <Button
                  variant={tipoClienteFilter === 'todos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoClienteFilter('todos')}
                  className="h-7 text-xs"
                >
                  Todos ({summary.services_data.length})
                </Button>
                <Button
                  variant={tipoClienteFilter === 'empresarial' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoClienteFilter('empresarial')}
                  className="h-7 text-xs"
                >
                  <Building2 className="w-3 h-3 mr-1" />
                  Empresarial
                </Button>
                <Button
                  variant={tipoClienteFilter === 'pf' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoClienteFilter('pf')}
                  className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                >
                  <User className="w-3 h-3 mr-1" />
                  PF
                </Button>
              </div>
              {tipoClienteFilter !== 'todos' && (
                <span className="text-xs text-muted-foreground">
                  ({filteredCount} de {summary.services_data.length})
                </span>
              )}
            </div>
            
            {/* Right: Status Semáforo OPERATIVO - Compact Pills (ordenado por prioridad) */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium hidden lg:inline">Estado operativo:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {Object.entries(operationalStatusCounts)
                  .filter(([_, count]) => count > 0)
                  .sort((a, b) => {
                    // Ordenar por prioridad operativa (urgentes primero)
                    const priorityA = ESTADO_OPERATIVO_CONFIG[a[0]]?.priority ?? 99;
                    const priorityB = ESTADO_OPERATIVO_CONFIG[b[0]]?.priority ?? 99;
                    return priorityA - priorityB;
                  })
                  .map(([estado, count]) => {
                    const config = ESTADO_OPERATIVO_CONFIG[estado] || { 
                      label: estado.replace(/_/g, ' '), 
                      bgColor: 'bg-gray-400', 
                      textColor: 'text-gray-600 dark:text-gray-400' 
                    };
                    return (
                      <div 
                        key={estado} 
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/60 dark:bg-background/40 border border-border/30"
                      >
                        <div className={cn("w-2 h-2 rounded-full shrink-0", config.bgColor)} />
                        <span className={cn("font-semibold tabular-nums", config.textColor)}>
                          {count}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide hidden sm:inline">
                          {config.label}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {!error && summary?.services_data && summary.services_data.length > 0 && (
          <div ref={containerRef} className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
            {Object.entries(groupedServices).map(([hour, services]) => (
              <div key={hour} className="space-y-1.5">
                {/* Hour Divider */}
                <HourDivider 
                  hour={hour} 
                  serviceCount={services.length}
                  isCurrentHour={hour === currentHour}
                />
                
                {/* Compact Services for this hour */}
                {services.map((service, index) => {
                  const operationalStatus = getOperationalStatus(service);
                  const OperationalIcon = operationalStatus.icon;
                  const citaTime = new Date(service.fecha_hora_cita);
                  const upcomingHighlight = getUpcomingHighlightClass(citaTime, now);
                  
                  // PF detection
                  const tipoServicio = service.tipo_servicio?.toLowerCase() || '';
                  const isPF = tipoServicio.startsWith('pf_') || tipoServicio === 'pf';
                  
                  // Armed guard detection
                  const hasArmedGuard = !!(service.armado_nombre);
                  const needsArmedGuard = service.incluye_armado || service.requiere_armado;
                  
                  // False positioning detection (robust for both boolean and string)
                  const hasFalsePositioning = service.posicionamiento_falso === true || service.posicionamiento_falso === 'true';
                  
                  // TEMPORARY DEBUG - Remove after fix
                  if (service.id_servicio === 'PRCOPEM-7') {
                    console.log('🔍 PRCOPEM-7 data:', {
                      posicionamiento_falso: service.posicionamiento_falso,
                      typeof_pf: typeof service.posicionamiento_falso,
                      hasFalsePositioning,
                      cobro_posicionamiento: service.cobro_posicionamiento,
                      estado_planeacion: service.estado_planeacion
                    });
                  }
                  
                  return (
                    <div 
                      key={service.id || index} 
                      className={cn(
                        "apple-card cursor-pointer transition-all duration-200 py-2.5 px-3 group relative overflow-hidden hover:shadow-md",
                        upcomingHighlight
                      )}
                      onClick={(e) => {
                        const target = (e.target as HTMLElement);
                        if (target.closest('.service-card-actions')) return;
                        if (document.body.dataset.dialogOpen === "1" || document.body.dataset.dialogTransitioning === "1") return;
                        const isAnyDialogOpen = !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
                        if (isAnyDialogOpen) return;
                        handleEditService(service);
                      }}
                    >
                      {/* Left status bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${operationalStatus.color}`} />
                      
                      {/* Row 1: Cliente | Hora | ID | Status Badge | Actions */}
                      <div className="flex items-center justify-between gap-3 pl-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Cliente */}
                          <span className="font-semibold text-sm text-foreground truncate max-w-[180px] flex-shrink-0">
                            {service.cliente_nombre}
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
                          {hasFalsePositioning && (
                            <Badge variant="outline" className="bg-violet-200 dark:bg-violet-900/50 text-violet-800 dark:text-violet-300 border-violet-400 border-2 text-[10px] px-2 py-0.5 flex-shrink-0 font-semibold">
                              <MapPinOff className="w-3 h-3 mr-1" />
                              Pos. Falso
                            </Badge>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-0.5 service-card-actions flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <StatusUpdateButton
                            serviceId={service.id}
                            currentStatus={operationalStatus.status as OperationalStatus}
                            onStatusChange={handleStatusUpdate}
                            disabled={isCancelling || isUpdatingOperationalStatus}
                            isLoading={isUpdatingOperationalStatus}
                          />
                          <CancelServiceButton
                            serviceId={service.id}
                            serviceName={service.cliente_nombre}
                            serviceStarted={operationalStatus.status === 'en_sitio'}
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
                      
                      {/* Row 2: Ruta + Custodio + Vehículo (all inline) */}
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
                          </div>
                        ) : (
                          <span className="text-red-500 font-medium">Sin custodio</span>
                        )}
                        
                        {/* Vehículo inline (from service data if available) */}
                        {service.auto && (
                          <>
                            <span className="text-muted-foreground/50 flex-shrink-0">•</span>
                            <div className="flex items-center gap-1">
                              <Car className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[80px]">{service.auto}</span>
                              {service.placa && <code className="font-mono text-[10px]">{service.placa}</code>}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Row 3 (conditional): Armado */}
                      {needsArmedGuard && hasArmedGuard && (
                        <div className="flex items-center gap-1 mt-1 pl-2 text-xs">
                          <Shield className="w-3 h-3 text-amber-600 flex-shrink-0" />
                          <span className="font-medium text-foreground">{service.armado_nombre}</span>
                          <span className="text-muted-foreground/60 italic">(Acompañante)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
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

      <FalsePositioningDialog
        open={falsePositioningDialogOpen}
        onOpenChange={setFalsePositioningDialogOpen}
        service={falsePositioningService}
        onConfirm={handleFalsePositioning}
        isLoading={isMarkingFalsePositioning}
      />
    </div>
  );
}