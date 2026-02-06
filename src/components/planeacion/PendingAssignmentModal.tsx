import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, MapPin, Shield, Calendar, CheckCircle2, Circle, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SimplifiedArmedAssignment } from '@/components/planeacion/SimplifiedArmedAssignment';
import { ContextualEditModal } from './ContextualEditModal';
import { useServiciosPlanificados } from '@/hooks/useServiciosPlanificados';
import { toast } from 'sonner';
import type { PendingService } from '@/hooks/usePendingServices';
import type { EditableService } from './EditServiceModal';
import { useServiceTransformations } from '@/hooks/useServiceTransformations';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useRegistrarRechazo } from '@/hooks/useCustodioRechazos';
import { useKapsoWhatsApp } from '@/hooks/useKapsoWhatsApp';

// Componentes modulares de CustodianStep (unificados)
import { QuickStats } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/QuickStats';
import { CustodianSearch } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianSearch';
import { CustodianList } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianList';
import { ConflictSection } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ConflictSection';
import { useCustodiosConProximidad, type CustodioConProximidad } from '@/hooks/useProximidadOperacional';
import { 
  type CustodianCommunicationState, 
  type CustodianStepFilters, 
  DEFAULT_FILTERS 
} from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/types';
import ReportUnavailabilityCard from '@/components/custodian/ReportUnavailabilityCard';
import { RejectionTypificationDialog } from './RejectionTypificationDialog';

interface PendingAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: PendingService | null;
  onAssignmentComplete: () => void;
}

interface PendingAssignmentModalEnhancedProps extends PendingAssignmentModalProps {
  mode?: 'auto' | 'direct_armed' | 'direct_custodian';
}

export function PendingAssignmentModal({
  open,
  onOpenChange,
  service,
  onAssignmentComplete,
  mode = 'auto'
}: PendingAssignmentModalEnhancedProps) {
  const queryClient = useQueryClient();
  const [isAssigning, setIsAssigning] = useState(false);
  const [showContextualEdit, setShowContextualEdit] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Hook para envío de WhatsApp via Kapso
  const { sendTemplate, isSending: isSendingWhatsApp } = useKapsoWhatsApp();
  
  // Helper function to normalize custodio_asignado to string
  const normalizeCustodioName = (custodio: any): string | null => {
    if (!custodio) return null;
    if (typeof custodio === 'string') return custodio.trim() || null;
    if (typeof custodio === 'object') {
      return custodio.nombre?.trim() || custodio.custodio_nombre?.trim() || null;
    }
    return null;
  };

  // State for flexible tab-based assignment
  const [activeTab, setActiveTab] = useState<'custodian' | 'armed'>(() => {
    // Priority 1: Explicit mode passed from caller
    if (mode === 'direct_armed') return 'armed';
    if (mode === 'direct_custodian') return 'custodian';
    
    // Priority 2: Check if service already has a custodian assigned
    const hasCustodio = !!normalizeCustodioName(service?.custodio_asignado);
    const hasArmado = !!(service?.armado_asignado);
    const requiresArmado = service?.requiere_armado;
    
    console.log('🔍 [PendingAssignmentModal] Initial tab calculation:', {
      mode,
      hasCustodio,
      hasArmado,
      requiresArmado,
      initialTab: hasCustodio && requiresArmado && !hasArmado ? 'armed' : 'custodian'
    });
    
    // If custodian is assigned and armado is pending, go to armed tab
    if (hasCustodio && requiresArmado && !hasArmado) return 'armed';
    return 'custodian';
  });
  
  // 🛡️ DEFENSIVE LOGIC: Handle both formats (string or object)
  const [custodianAssigned, setCustodianAssigned] = useState<any>(() => {
    const custodioNombre = normalizeCustodioName(service?.custodio_asignado);
    
    console.log('🔍 [PendingAssignmentModal] Initializing custodianAssigned:', {
      rawValue: service?.custodio_asignado,
      normalizedName: custodioNombre,
      result: custodioNombre ? { custodio_nombre: custodioNombre } : null
    });
    
    if (!custodioNombre) return null;
    return { custodio_nombre: custodioNombre };
  });
  const { assignCustodian, assignArmedGuard } = useServiciosPlanificados();
  const { servicioToEditable } = useServiceTransformations();

  // === NUEVO: Estado para componentes modulares de asignación ===
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CustodianStepFilters>(DEFAULT_FILTERS);
  const [comunicaciones, setComunicaciones] = useState<Record<string, CustodianCommunicationState>>({});
  const [selectedCustodianId, setSelectedCustodianId] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  // State for unavailability/rejection dialogs
  const [unavailabilityCustodian, setUnavailabilityCustodian] = useState<CustodioConProximidad | null>(null);
  const [showUnavailabilityDialog, setShowUnavailabilityDialog] = useState(false);
  const [rejectionCustodian, setRejectionCustodian] = useState<CustodioConProximidad | null>(null);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  
  // Hook for registering rejections
  const registrarRechazo = useRegistrarRechazo();

  // Datos del servicio para el hook de proximidad
  const servicioNuevo = useMemo(() => {
    if (!service) return undefined;
    return {
      fecha_programada: service.fecha_hora_cita ? service.fecha_hora_cita.split('T')[0] : new Date().toISOString().split('T')[0],
      hora_ventana_inicio: service.fecha_hora_cita ? (service.fecha_hora_cita.split('T')[1]?.substring(0, 5) || '09:00') : '09:00',
      origen_texto: service.origen,
      destino_texto: service.destino,
      tipo_servicio: service.tipo_servicio,
      incluye_armado: service.requiere_armado,
      requiere_gadgets: false
    };
  }, [service]);

  // Hook unificado de proximidad operacional (mismo que ServiceCreation)
  const { data: categorized, isLoading: isLoadingCustodians } = useCustodiosConProximidad(
    servicioNuevo,
    { enabled: open && activeTab === 'custodian' }
  );

  // Filtrar custodios localmente
  const filteredCustodians = useMemo(() => {
    if (!categorized) return [];
    let result: CustodioConProximidad[] = [];
    
    // Agregar según filtros activos
    if (filters.disponibles) {
      result = [...result, ...categorized.disponibles];
    }
    if (filters.parcialmenteOcupados) {
      result = [...result, ...categorized.parcialmenteOcupados];
    }
    if (filters.ocupados) {
      result = [...result, ...categorized.ocupados];
    }
    
    // Aplicar búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.nombre?.toLowerCase().includes(term) ||
        c.telefono?.toLowerCase().includes(term) ||
        c.zona_base?.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [categorized, searchTerm, filters]);

  const totalCount = useMemo(() => {
    if (!categorized) return 0;
    return (categorized.disponibles?.length || 0) + 
           (categorized.parcialmenteOcupados?.length || 0) + 
           (categorized.ocupados?.length || 0);
  }, [categorized]);

  // Handler para toggle de filtros
  const handleFilterToggle = (key: keyof CustodianStepFilters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handler para selección de custodio (adaptado)
  const handleSelectCustodian = async (custodio: CustodioConProximidad) => {
    setSelectedCustodianId(custodio.id);
    setComunicaciones(prev => ({
      ...prev,
      [custodio.id]: { status: 'acepta', method: 'whatsapp' }
    }));
    
    // Llamar al callback original de asignación
    await handleCustodianAssignmentComplete({
      custodio_nombre: custodio.nombre,
      custodio_asignado_id: custodio.id
    });
  };

  // Handler para contacto (WhatsApp/Llamar)
  const handleContact = (custodio: CustodioConProximidad, method: 'whatsapp' | 'llamada') => {
    setComunicaciones(prev => ({
      ...prev,
      [custodio.id]: { status: 'contacted', method }
    }));
    
    // Abrir enlace de contacto
    if (custodio.telefono) {
      const cleanPhone = custodio.telefono.replace(/\D/g, '');
      if (method === 'whatsapp') {
        const mensaje = `Hola ${custodio.nombre}, te contactamos de Detecta para un servicio.`;
        window.open(`https://wa.me/52${cleanPhone}?text=${encodeURIComponent(mensaje)}`, '_blank');
      } else {
        window.open(`tel:+52${cleanPhone}`, '_blank');
      }
    }
  };

  // Handler para override de conflicto
  const handleOverrideSelect = (custodio: CustodioConProximidad) => {
    // Por ahora, asignar directamente. En el futuro, podría abrir modal de justificación
    handleSelectCustodian(custodio);
  };

  // NEW: Handler for reporting unavailability
  const handleReportUnavailability = (custodio: CustodioConProximidad) => {
    setUnavailabilityCustodian(custodio);
    setShowUnavailabilityDialog(true);
  };

  // NEW: Handler for unavailability submission
  const handleUnavailabilitySubmit = async (data: { tipo: string; motivo?: string; dias: number | null }) => {
    if (!unavailabilityCustodian) return false;
    
    try {
      const fechaFin = data.dias 
        ? new Date(Date.now() + data.dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;
      
      const { error } = await supabase
        .from('custodio_indisponibilidades')
        .insert({
          custodio_id: unavailabilityCustodian.id,
          tipo: data.tipo,
          motivo: data.motivo || null,
          fecha_inicio: new Date().toISOString().split('T')[0],
          fecha_fin: fechaFin,
          activo: true
        });
      
      if (error) throw error;
      
      toast.success('Indisponibilidad registrada', {
        description: `${unavailabilityCustodian.nombre} marcado como no disponible`
      });
      
      setShowUnavailabilityDialog(false);
      setUnavailabilityCustodian(null);
      return true;
    } catch (error) {
      console.error('Error registering unavailability:', error);
      toast.error('Error al registrar indisponibilidad');
      return false;
    }
  };

  // NEW: Handler for reporting rejection
  const handleReportRejection = (custodio: CustodioConProximidad) => {
    setRejectionCustodian(custodio);
    setShowRejectionDialog(true);
  };

  // NEW: Handler for rejection confirmation
  const handleRejectionConfirm = async (reason: string, unavailabilityDays?: number) => {
    if (!rejectionCustodian || !service) return;
    
    try {
      await registrarRechazo.mutateAsync({
        custodioId: rejectionCustodian.id,
        servicioId: service.id,
        motivo: reason
      });
      
      // Update local communication state
      setComunicaciones(prev => ({
        ...prev,
        [rejectionCustodian.id]: { 
          status: 'rechaza', 
          razon_rechazo: reason
        }
      }));
      
      setShowRejectionDialog(false);
      setRejectionCustodian(null);
    } catch (error) {
      console.error('Error registering rejection:', error);
    }
  };

  // Detectar si estamos editando un servicio existente con asignaciones
  const isEditingExisting = service && (
    service.custodio_asignado ||
    service.armado_asignado ||
    (service.estado && service.estado !== 'nuevo')
  );

  // Mostrar ContextualEditModal si estamos editando un servicio existente
  React.useEffect(() => {
    if (open) {
      // 🛡️ GUARD: Si ya interactuó, NUNCA re-abrir ContextualEditModal
      if (hasInteracted) {
        console.log('[PendingAssignmentModal] Guard: hasInteracted=true, mantengo showContextualEdit=false');
        setShowContextualEdit(false);
        return; // ⚠️ EARLY RETURN - No re-calcular paso
      }
      
      // Solo mostrar ContextualEditModal en modo 'auto' Y si no ha interactuado
      if (isEditingExisting && mode === 'auto') {
        setShowContextualEdit(true);
      } else {
        setShowContextualEdit(false);
        // Determinar paso correcto
        if (mode === 'direct_armed' || (service && service.custodio_asignado)) {
          setActiveTab('armed');
        } else {
          setActiveTab('custodian');
        }
      }
    } else {
      // Reset cuando se cierra
      setHasInteracted(false);
      setShowContextualEdit(false);
    }
  }, [open, isEditingExisting, mode, hasInteracted]); // Removed service?.custodio_asignado to prevent unwanted resets on data refetch

  // Debug: Monitor state changes
  React.useEffect(() => {
    console.log('[PendingAssignmentModal] Estado cambió:', {
      open,
      showContextualEdit,
      activeTab,
      hasInteracted,
      isEditingExisting,
      serviceId: service?.id_servicio
    });
  }, [open, showContextualEdit, activeTab, hasInteracted, isEditingExisting, service?.id_servicio]);

  if (!service) return null;

  // Preparar datos del servicio para el componente de asignación
  const serviceData = {
    servicio_id: service.id_servicio,
    origen: service.origen,
    destino: service.destino,
    fecha_hora_cita: service.fecha_hora_cita,
    tipo_servicio: service.tipo_servicio,
    cliente_nombre: service.nombre_cliente,
    destino_texto: service.destino,
    fecha_programada: service.fecha_hora_cita ? service.fecha_hora_cita.split('T')[0] : new Date().toISOString().split('T')[0],
    hora_ventana_inicio: service.fecha_hora_cita ? (service.fecha_hora_cita.split('T')[1]?.substring(0, 5) || '09:00') : '09:00',
    incluye_armado: service.requiere_armado,
    requiere_gadgets: false,
    gadgets_seleccionados: [],
    observaciones: service.observaciones,
    fecha_recepcion: service.created_at ? service.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    hora_recepcion: service.created_at ? (service.created_at.split('T')[1]?.substring(0, 5) || '09:00') : '09:00'
  };

  const handleCustodianAssignmentComplete = async (assignmentData: any) => {
    console.log('[PendingAssignmentModal] onComplete custodio', { assignmentData, service });
    setIsAssigning(true);
    try {
      // Asignar custodio al servicio
      await assignCustodian({
        serviceId: service.id,
        custodioName: assignmentData.custodio_nombre,
        custodioId: assignmentData.custodio_asignado_id
      });

      setCustodianAssigned(assignmentData);

      // 📲 WHATSAPP: Enviar template de servicio asignado al custodio
      // Buscar teléfono del custodio seleccionado
      const selectedCustodio = filteredCustodians.find(c => c.id === assignmentData.custodio_asignado_id);
      if (selectedCustodio?.telefono) {
        const fechaServicio = service.fecha_hora_cita 
          ? format(new Date(service.fecha_hora_cita), "d 'de' MMMM yyyy", { locale: es })
          : 'Por confirmar';
        const horaServicio = service.fecha_hora_cita
          ? format(new Date(service.fecha_hora_cita), 'HH:mm')
          : 'Por confirmar';

        // Enviar template servicio_asignado de forma asíncrona (no bloqueante)
        sendTemplate.mutate({
          to: selectedCustodio.telefono,
          templateName: 'servicio_asignado',
          components: {
            body: {
              parameters: [
                { type: 'text', text: assignmentData.custodio_nombre },
                { type: 'text', text: fechaServicio },
                { type: 'text', text: horaServicio },
                { type: 'text', text: service.nombre_cliente || 'Cliente' },
                { type: 'text', text: service.origen || 'Por confirmar' },
                { type: 'text', text: service.destino || 'Por confirmar' }
              ]
            }
          },
          context: {
            servicio_id: service.id,
            tipo_notificacion: 'asignacion_servicio'
          }
        });
      }

      // Check if service requires armed guard
      if (service.requiere_armado) {
        toast.success('Custodio asignado exitosamente', {
          description: 'Ahora proceda a asignar el armado requerido'
        });
        // 🔄 DYNAMIC: Actualizar el estado local del servicio para que el siguiente paso tenga la info correcta
        setActiveTab('armed');
      } else {
        // 🔄 DYNAMIC: Solo refetch y cerrar si NO requiere armado
        onAssignmentComplete();
        toast.success('Servicio asignado exitosamente', {
          description: `${assignmentData.custodio_nombre} ha sido asignado al servicio ${service.id_servicio}`
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error assigning custodian:', error);
      // Error handling is now done in the hook
    } finally {
      setIsAssigning(false);
    }
  };

  const handleArmedGuardAssignmentComplete = async (armedData: any) => {
    setIsAssigning(true);
    try {
      await assignArmedGuard({
        serviceId: service.id, // Usar UUID interno para asignación de armado
        armadoName: armedData.armado_nombre,
        armadoId: armedData.armado_id
      });

      toast.success('Servicio completamente asignado', {
        description: `Custodio: ${custodianAssigned?.custodio_nombre} | Armado: ${armedData.armado_nombre}`
      });

      onOpenChange(false);
      onAssignmentComplete();
    } catch (error) {
      console.error('Error assigning armed guard:', error);
      toast.error('Error al asignar armado');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleArmedGuardSkip = () => {
    toast.success('Servicio asignado exitosamente', {
      description: `${custodianAssigned?.custodio_nombre} ha sido asignado al servicio ${service.id_servicio}`
    });
    onOpenChange(false);
    onAssignmentComplete();
  };

  const handleStartReassignment = (type: 'custodian' | 'armed_guard', _service?: any) => {
    console.log('[PendingAssignmentModal] handleStartReassignment INICIO', {
      type,
      antes: { showContextualEdit, activeTab, hasInteracted },
      serviceId: service?.id_servicio,
      hasCustodio: service?.custodio_asignado
    });
    
    // 🎯 Orden crítico de operaciones:
    // 1. Marcar interacción (previene re-apertura)
    setHasInteracted(true);
    
    // 2. Forzar cierre del ContextualEditModal
    setShowContextualEdit(false);
    
    // 3. Si es asignación de armado y el servicio ya tiene custodio, asegurar que esté en estado
    if (type === 'armed_guard' && service?.custodio_asignado) {
      setCustodianAssigned({
        custodio_nombre: service.custodio_asignado
      });
    }
    
    // 4. Usar requestAnimationFrame para garantizar que el render ocurra
    requestAnimationFrame(() => {
      // 5. Cambiar al paso correcto DESPUÉS de que React haya procesado los cambios anteriores
      const targetStep = type === 'custodian' ? 'custodian' : 'armed';
      setActiveTab(targetStep);
      
      console.log('[PendingAssignmentModal] handleStartReassignment COMPLETADO', {
        despues: { 
          showContextualEdit: false, 
          activeTab: targetStep,
          hasInteracted: true,
          custodianAssigned: type === 'armed_guard' ? service?.custodio_asignado : null
        }
      });
    });
  };

  const handleEditServiceSave = async (id: string, data: Partial<EditableService>) => {
    try {
      // Construir payload solo con campos definidos para evitar sobrescribir con undefined → NULL
      const updatePayload: Record<string, any> = {};
      
      if (data.id_servicio !== undefined) updatePayload.id_servicio = data.id_servicio;
      if (data.id_interno_cliente !== undefined) updatePayload.id_interno_cliente = data.id_interno_cliente;
      if (data.nombre_cliente !== undefined) updatePayload.nombre_cliente = data.nombre_cliente;
      if (data.origen !== undefined) updatePayload.origen = data.origen;
      if (data.destino !== undefined) updatePayload.destino = data.destino;
      if (data.fecha_hora_cita !== undefined) updatePayload.fecha_hora_cita = data.fecha_hora_cita;
      if (data.tipo_servicio !== undefined) updatePayload.tipo_servicio = data.tipo_servicio;
      if (data.requiere_armado !== undefined) updatePayload.requiere_armado = data.requiere_armado;
      if (data.observaciones !== undefined) updatePayload.observaciones = data.observaciones;
      
      const { error } = await supabase
        .from('servicios_planificados')
        .update(updatePayload)
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalidar queries para refrescar la UI
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['planned-services'] });
      queryClient.invalidateQueries({ queryKey: ['pending-services'] });
      
      toast.success('Cambios guardados exitosamente');
      onAssignmentComplete();
    } catch (error) {
      console.error('Error guardando cambios:', error);
      toast.error('Error al guardar los cambios');
    }
  };

  // Convertir PendingService a EditableService para ContextualEditModal
  const editableService: EditableService | null = service ? {
    id: service.id,
    id_servicio: service.id_servicio,
    id_interno_cliente: (service as any).id_interno_cliente,
    nombre_cliente: service.nombre_cliente || '',
    origen: service.origen || '',
    destino: service.destino || '',
    fecha_hora_cita: service.fecha_hora_cita || '',
    tipo_servicio: service.tipo_servicio || '',
    requiere_armado: service.requiere_armado || false,
    custodio_asignado: service.custodio_asignado,
    armado_asignado: service.armado_asignado,
    estado_planeacion: service.estado || 'pendiente',
    observaciones: service.observaciones
  } : null;


  console.log('[PendingAssignmentModal] Render', {
    showContextualEdit,
    activeTab,
    hasInteracted,
    serviceId: service?.id_servicio,
    timestamp: Date.now()
  });

  return (
    <>
      {/* Solo mostrar ContextualEditModal SI showContextualEdit = true */}
      {showContextualEdit && editableService ? (
        <ContextualEditModal
          open={true}
          onOpenChange={(o) => {
            if (!o) {
              if (hasInteracted) {
                // Usuario interactuó, solo ocultar ContextualEditModal
                setShowContextualEdit(false);
              } else {
                // Usuario canceló sin interactuar, cerrar todo
                onOpenChange(false);
              }
            }
          }}
          service={editableService}
          onSave={handleEditServiceSave}
          onStartReassignment={handleStartReassignment}
        />
      ) : (
        /* Solo mostrar PendingAssignmentModal SI showContextualEdit = false */
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 apple-text-title">
                Asignar Personal - {service.id_servicio}
              </DialogTitle>
              <DialogDescription className="sr-only">Asignación de servicio</DialogDescription>
              {/* Status indicators */}
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={service.custodio_asignado || custodianAssigned ? 'default' : 'outline'}
                  className={`gap-1 ${service.custodio_asignado || custodianAssigned ? 'bg-success/10 text-success border-success/20' : ''}`}
                >
                  <User className="h-3 w-3" />
                  {custodianAssigned?.custodio_nombre || service.custodio_asignado || 'Custodio Pendiente'}
                </Badge>
                {service.requiere_armado && (
                  <Badge 
                    variant={service.armado_asignado ? 'default' : 'outline'}
                    className={`gap-1 ${service.armado_asignado ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}
                  >
                    <Shield className="h-3 w-3" />
                    {service.armado_asignado || 'Armado Pendiente'}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {/* Service Summary */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Información del Cliente */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Cliente</div>
                        <div className="font-semibold">{service.nombre_cliente}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Ruta</div>
                        <div className="font-medium">
                          {service.origen} → {service.destino}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información del Servicio */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Fecha y Hora</div>
                        <div className="font-semibold">
                          {format(new Date(service.fecha_hora_cita), 'PPP p', { locale: es })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Tipo de Servicio</div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{service.tipo_servicio}</Badge>
                          {service.requiere_armado && (
                            <Badge variant="secondary">Con Armado</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {service.observaciones && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-1">Observaciones</div>
                    <div className="text-sm bg-muted rounded p-2">
                      {service.observaciones}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs-based Assignment UI */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'custodian' | 'armed')} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="custodian" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Custodio
                  {(service.custodio_asignado || custodianAssigned) 
                    ? <CheckCircle className="h-3 w-3 text-success" />
                    : <Circle className="h-3 w-3 text-muted-foreground" />
                  }
                </TabsTrigger>
                <TabsTrigger 
                  value="armed" 
                  disabled={!service.requiere_armado}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Armado
                  {service.armado_asignado 
                    ? <CheckCircle className="h-3 w-3 text-success" />
                    : service.requiere_armado 
                      ? <AlertCircle className="h-3 w-3 text-warning" />
                      : null
                  }
                </TabsTrigger>
              </TabsList>

              <TabsContent value="custodian" className="space-y-4">
                {/* Stats rápidos */}
                <QuickStats categorized={categorized} isLoading={isLoadingCustodians} />
                
                {/* Búsqueda y filtros */}
                <CustodianSearch
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  filters={filters}
                  onFilterToggle={handleFilterToggle}
                  resultsCount={filteredCustodians.length}
                  totalCount={totalCount}
                />
                
                {/* Lista de custodios */}
                <CustodianList
                  custodians={filteredCustodians}
                  isLoading={isLoadingCustodians}
                  selectedId={selectedCustodianId}
                  highlightedIndex={highlightedIndex}
                  comunicaciones={comunicaciones}
                  onSelect={handleSelectCustodian}
                  onContact={handleContact}
                  onReportUnavailability={handleReportUnavailability}
                  onReportRejection={handleReportRejection}
                />
                
                {/* Sección de conflictos (colapsible) */}
                {categorized?.noDisponibles && categorized.noDisponibles.length > 0 && (
                  <ConflictSection
                    custodians={categorized.noDisponibles}
                    onOverrideSelect={handleOverrideSelect}
                    forceOpen={filteredCustodians.length === 0 && categorized.noDisponibles.length > 0}
                  />
                )}
                
                {/* Botón Cancelar */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="armed" className="space-y-4">
                <SimplifiedArmedAssignment
                  serviceData={{
                    ...serviceData,
                    custodio_asignado: custodianAssigned?.custodio_nombre || service?.custodio_asignado
                  }}
                  onComplete={handleArmedGuardAssignmentComplete}
                  onSkip={handleArmedGuardSkip}
                  onBack={() => {
                    // Si el servicio ya tiene custodio asignado y estamos en modo edición directa de armado,
                    // cerrar el modal en lugar de forzar re-selección del custodio
                    if (service?.custodio_asignado && (mode === 'direct_armed' || isEditingExisting)) {
                      onOpenChange(false);
                    } else {
                      setActiveTab('custodian');
                    }
                  }}
                  backLabel={service?.custodio_asignado && (mode === 'direct_armed' || isEditingExisting) ? 'Cancelar' : 'Volver a Custodio'}
                  showBackButton={true}
                  allowWithoutCustodian={!service?.custodio_asignado && !custodianAssigned}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Unavailability Dialog */}
      {unavailabilityCustodian && (
        <ReportUnavailabilityCard
          open={showUnavailabilityDialog}
          onOpenChange={(open) => {
            setShowUnavailabilityDialog(open);
            if (!open) setUnavailabilityCustodian(null);
          }}
          onReportUnavailability={handleUnavailabilitySubmit}
          showTriggerButton={false}
        />
      )}
      
      {/* Rejection Dialog */}
      <RejectionTypificationDialog
        isOpen={showRejectionDialog}
        onClose={() => {
          setShowRejectionDialog(false);
          setRejectionCustodian(null);
        }}
        onConfirm={handleRejectionConfirm}
        guardName={rejectionCustodian?.nombre || ''}
      />
    </>
  );
}