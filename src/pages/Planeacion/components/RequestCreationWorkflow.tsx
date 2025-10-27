import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle, Circle, MapPin, User, UserCheck, Shield, Save, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { usePersistedForm } from '@/hooks/usePersistedForm';
import { RouteSearchStep } from './workflow/RouteSearchStep';
import { ServiceAutoFillStep } from './workflow/ServiceAutoFillStep';
import { CustodianAssignmentStep } from './workflow/CustodianAssignmentStep';
import { EnhancedArmedGuardAssignmentStep } from './workflow/EnhancedArmedGuardAssignmentStep';
import { FinalConfirmationStep } from './workflow/FinalConfirmationStep';
import { ConflictMonitor } from './workflow/ConflictMonitor';
import { useCustodianVehicles } from '@/hooks/useCustodianVehicles';
import { useServiciosPlanificados, type ServicioPlanificadoData } from '@/hooks/useServiciosPlanificados';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DraftStatusBadge } from '@/components/workflow/DraftStatusBadge';
import { DraftRestoredBanner } from '@/components/workflow/DraftRestoredBanner';
import { TabReturnNotification } from '@/components/workflow/TabReturnNotification';

interface RouteData {
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  precio_sugerido?: number;
  precio_custodio?: number;
  pago_custodio_sin_arma?: number;
  costo_operativo?: number;
  margen_estimado?: number;
  distancia_km?: number;
  tipo_servicio?: string;
  incluye_armado?: boolean;
}

interface ServiceData extends RouteData {
  servicio_id: string;
  fecha_programada: string;
  hora_ventana_inicio: string;
  tipo_servicio: string;
  incluye_armado: boolean;
  requiere_gadgets: boolean;
  gadgets_seleccionados: string[];
  observaciones?: string;
  fecha_recepcion: string;
  hora_recepcion: string;
}

interface AssignmentData extends ServiceData {
  custodio_asignado_id?: string;
  custodio_nombre?: string;
  estado_comunicacion?: 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder';
}

interface ArmedAssignmentData extends AssignmentData {
  armado_asignado_id?: string;
  armado_nombre?: string;
  tipo_asignacion?: 'interno' | 'proveedor';
  proveedor_id?: string;
  punto_encuentro?: string;
  hora_encuentro?: string;
  estado_asignacion?: 'pendiente' | 'confirmado' | 'rechazado';
}

export function RequestCreationWorkflow() {
  const { user } = useAuth();
  
  // Refs to control persistence behavior
  const skipNextPersistRef = useRef(false);
  const autoRestoreDoneRef = useRef(false);
  const mountTimeRef = useRef(Date.now());
  const sessionIdRef = useRef(crypto.randomUUID());
  
  // Persisted form state with user-specific key AND early hydration
  const {
    formData: persistedData,
    updateFormData,
    hasDraft,
    lastSaved,
    isRestoring,
    restoreDraft,
    clearDraft,
    saveDraft,
    getTimeSinceSave,
  } = usePersistedForm<{
    currentStep: 'route' | 'service' | 'assignment' | 'armed_assignment' | 'final_confirmation';
    routeData: RouteData | null;
    serviceData: ServiceData | null;
    assignmentData: AssignmentData | null;
    armedAssignmentData: ArmedAssignmentData | null;
    createdServiceDbId: string | null;
    modifiedSteps: string[];
    sessionId?: string;
    drafts?: {
      routeDraft?: Partial<RouteData>;
      serviceDraft?: any;
    };
    lastEditedStep?: string;
  }>({
    key: 'service_creation_workflow',
    initialData: {
      currentStep: 'route',
      routeData: null,
      serviceData: null,
      assignmentData: null,
      armedAssignmentData: null,
      createdServiceDbId: null,
      modifiedSteps: [],
      sessionId: sessionIdRef.current,
      drafts: {
        routeDraft: {},
        serviceDraft: {}
      },
      lastEditedStep: undefined,
    },
    hydrateOnMount: true, // CRITICAL: Early hydration before first render
    autoSaveInterval: 10000, // Auto-save every 10 seconds (reduced from 30)
    saveOnChangeDebounceMs: 700, // Save 700ms after changes
    isMeaningfulDraft: (data) => {
      // A draft is meaningful if:
      // - Any step draft has content, or
      // - Actual step data exists, or
      // - Assignments exist
      const hasRouteDraft = data.drafts?.routeDraft && Object.keys(data.drafts.routeDraft).length > 0;
      const hasServiceDraft = data.drafts?.serviceDraft && Object.keys(data.drafts.serviceDraft).length > 0;
      const hasCompletedData = data.routeData !== null || data.serviceData !== null;
      const hasAssignments = data.assignmentData !== null || data.armedAssignmentData !== null;
      
      return hasRouteDraft || hasServiceDraft || hasCompletedData || hasAssignments;
    },
    onRestore: (data) => {
      console.log('🔄 Restaurando borrador del workflow:', data);
      toast.info('Borrador restaurado', {
        description: 'Se ha recuperado tu progreso anterior'
      });
    },
  });

  const [currentStep, setCurrentStep] = useState(persistedData.currentStep);
  const [routeData, setRouteData] = useState(persistedData.routeData);
  const [serviceData, setServiceData] = useState(persistedData.serviceData);
  const [assignmentData, setAssignmentData] = useState(persistedData.assignmentData);
  const [armedAssignmentData, setArmedAssignmentData] = useState(persistedData.armedAssignmentData);
  const [createdServiceDbId, setCreatedServiceDbId] = useState(persistedData.createdServiceDbId);
  const [modifiedSteps, setModifiedSteps] = useState(persistedData.modifiedSteps);
  
  // Estado para rastrear cambios y invalidaciones
  const [hasInvalidatedState, setHasInvalidatedState] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);
  const [showTabReturnNotification, setShowTabReturnNotification] = useState(false);

  // CRITICAL: UI State Hydration - Sync UI states when persistedData changes
  // 🆕 MEJORADO: Previene regresiones usando comparación de índice de pasos
  useEffect(() => {
    // Skip if restoring (handled by auto-restore effect)
    if (isRestoring) return;
    
    // Count meaningful data in persistedData vs local state
    const persistedMeaningful = [
      persistedData.routeData,
      persistedData.serviceData,
      persistedData.assignmentData,
      persistedData.armedAssignmentData
    ].filter(Boolean).length;
    
    const localMeaningful = [
      routeData,
      serviceData,
      assignmentData,
      armedAssignmentData
    ].filter(Boolean).length;
    
    // 🆕 NUEVA LÓGICA: Prevenir regresiones usando índice de pasos
    const stepOrder = ['route', 'service', 'assignment', 'armed_assignment', 'final_confirmation'];
    const persistedStepIndex = stepOrder.indexOf(persistedData.currentStep);
    const localStepIndex = stepOrder.indexOf(currentStep);
    
    const isSameSession = persistedData.sessionId === sessionIdRef.current;
    const persistedIsAhead = persistedStepIndex >= localStepIndex;
    
    const shouldHydrate = (
      persistedMeaningful > localMeaningful &&  // Más pasos completos
      isSameSession &&                           // Misma sesión
      persistedIsAhead                           // No regresar al usuario
    );
    
    if (shouldHydrate) {
      console.log('🔄 [RequestCreationWorkflow] Hidratando UI from persistedData:', {
        sessionId: persistedData.sessionId,
        step: persistedData.currentStep,
        persistedMeaningful,
        localMeaningful,
        persistedStepIndex,
        localStepIndex,
        timestamp: new Date().toISOString()
      });
      
      setCurrentStep(persistedData.currentStep);
      setRouteData(persistedData.routeData);
      setServiceData(persistedData.serviceData);
      setAssignmentData(persistedData.assignmentData);
      setArmedAssignmentData(persistedData.armedAssignmentData);
      setCreatedServiceDbId(persistedData.createdServiceDbId);
      setModifiedSteps(persistedData.modifiedSteps);
      
      setShowRestoredBanner(true);
    } else if (persistedMeaningful > 0 && localMeaningful === 0) {
      // 🆕 CASO ESPECIAL: Si local está vacío pero persisted tiene datos,
      // el banner de auto-restore se encargará
      console.log('ℹ️ [RequestCreationWorkflow] Hay datos persistidos pero local está vacío');
    } else {
      console.log('⏭️ [RequestCreationWorkflow] Skip hydration:', {
        persistedMeaningful,
        localMeaningful,
        isSameSession,
        persistedIsAhead,
        shouldHydrate
      });
    }
  }, [
    persistedData.currentStep,
    persistedData.routeData,
    persistedData.serviceData,
    persistedData.assignmentData,
    persistedData.armedAssignmentData,
    persistedData.createdServiceDbId,
    persistedData.modifiedSteps,
    persistedData.sessionId,
    isRestoring,
    currentStep  // 🆕 Agregar currentStep como dependencia
  ]);

  // Auto-restore draft seamlessly on mount (without prompts or time thresholds)
  useEffect(() => {
    const suppressionFlag = sessionStorage.getItem('scw_suppress_restore');
    
    // Auto-restore if:
    // 1. There's a draft
    // 2. Not already restoring
    // 3. Haven't auto-restored yet this mount
    // 4. Not suppressed this session
    if (hasDraft && !isRestoring && !autoRestoreDoneRef.current && suppressionFlag !== '1') {
      console.log('🔄 Auto-restoring draft seamlessly on mount');
      autoRestoreDoneRef.current = true;
      restoreDraft();
      setShowRestoredBanner(true);
    }
  }, [hasDraft, isRestoring, restoreDraft, clearDraft]);

  // Persist state changes (with skip mechanism)
  useEffect(() => {
    // Skip this persistence cycle if flagged
    if (skipNextPersistRef.current) {
      console.log('⏭️ Skipping persistence cycle due to recent discard');
      skipNextPersistRef.current = false;
      return;
    }
    
    const handler = setTimeout(() => {
      updateFormData({
        currentStep,
        routeData,
        serviceData,
        assignmentData,
        armedAssignmentData,
        createdServiceDbId,
        modifiedSteps,
        sessionId: sessionIdRef.current,
        drafts: persistedData.drafts,
        lastEditedStep: persistedData.lastEditedStep,
      });
    }, 500); // Debounce to avoid excessive saves

    return () => clearTimeout(handler);
  }, [currentStep, routeData, serviceData, assignmentData, armedAssignmentData, createdServiceDbId, modifiedSteps, persistedData.drafts, persistedData.lastEditedStep, updateFormData]);

  // 🆕 NUEVO: Guardar INMEDIATAMENTE al cambiar de pestaña (sin esperar debounce)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 [RequestCreationWorkflow] Tab oculto - guardando estado actual INMEDIATAMENTE');
        // Forzar guardado SÍNCRONO del estado actual
        updateFormData({
          currentStep,
          routeData,
          serviceData,
          assignmentData,
          armedAssignmentData,
          createdServiceDbId,
          modifiedSteps,
          sessionId: sessionIdRef.current,
          drafts: persistedData.drafts,
          lastEditedStep: persistedData.lastEditedStep,
        });
      } else if (!document.hidden && currentStep !== 'route') {
        // 🆕 Usuario regresó y NO está en el primer paso
        setShowTabReturnNotification(true);
        
        // Auto-dismiss después de 5 segundos
        setTimeout(() => {
          setShowTabReturnNotification(false);
        }, 5000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentStep, routeData, serviceData, assignmentData, armedAssignmentData, createdServiceDbId, modifiedSteps, persistedData.drafts, persistedData.lastEditedStep, updateFormData]);

  // 🆕 NUEVO: Logging de cambios de currentStep para debugging
  useEffect(() => {
    console.log('🎯 [RequestCreationWorkflow] currentStep changed:', {
      newStep: currentStep,
      sessionId: sessionIdRef.current,
      hasRouteData: !!routeData,
      hasServiceData: !!serviceData,
      hasAssignmentData: !!assignmentData,
      timestamp: new Date().toISOString()
    });
  }, [currentStep, routeData, serviceData, assignmentData]);
  
  // Hook para manejar servicios planificados
  const { createServicioPlanificado, assignArmedGuard, isLoading } = useServiciosPlanificados();
  
  // Get vehicle information for assigned custodian (with safety check)
  const { vehicles, getPrincipalVehicle, loading: vehiclesLoading } = useCustodianVehicles(assignmentData?.custodio_asignado_id);
  const custodianVehicle = assignmentData?.custodio_asignado_id && vehicles.length > 0
    ? getPrincipalVehicle(assignmentData.custodio_asignado_id) 
    : null;

  const steps = [
    { 
      id: 'route', 
      label: 'Búsqueda de Ruta', 
      icon: MapPin,
      description: 'Selecciona cliente y destino'
    },
    { 
      id: 'service', 
      label: 'Configurar Servicio', 
      icon: User,
      description: 'Auto-fill de características'
    },
    { 
      id: 'assignment', 
      label: 'Asignar Custodio', 
      icon: UserCheck,
      description: 'Comunicación y confirmación'
    },
    { 
      id: 'armed_assignment', 
      label: 'Asignar Armado', 
      icon: Shield,
      description: 'Coordinar con armado'
    },
    { 
      id: 'final_confirmation', 
      label: 'Confirmación Final', 
      icon: CheckCircle,
      description: 'Revisar y confirmar'
    }
  ];

  const getStepStatus = (stepId: string) => {
    if (stepId === 'route') return routeData ? 'completed' : currentStep === 'route' ? 'current' : 'pending';
    if (stepId === 'service') return serviceData ? 'completed' : currentStep === 'service' ? 'current' : 'pending';
    if (stepId === 'assignment') return assignmentData ? 'completed' : currentStep === 'assignment' ? 'current' : 'pending';
    if (stepId === 'armed_assignment') return armedAssignmentData ? 'completed' : currentStep === 'armed_assignment' ? 'current' : 'pending';
    if (stepId === 'final_confirmation') return currentStep === 'final_confirmation' ? 'current' : 'pending';
    return 'pending';
  };

  const canProceedToService = routeData !== null;
  const canProceedToAssignment = serviceData !== null;
  const canProceedToArmedAssignment = assignmentData !== null && serviceData?.incluye_armado === true;
  const shouldShowArmedStep = serviceData?.incluye_armado === true;
  const canProceedToFinalConfirmation = assignmentData !== null;
  
  // Función para determinar si realmente necesita armado
  const currentlyNeedsArmed = serviceData?.incluye_armado === true;
  const hasArmedAssignment = armedAssignmentData !== null;

  // Auto-advance cuando se completen los pasos
  useEffect(() => {
    if (currentStep === 'route' && canProceedToService) {
      setCurrentStep('service');
    }
  }, [canProceedToService, currentStep]);

  const handleRouteComplete = (data: RouteData) => {
    setRouteData(data);
    setCurrentStep('service');
    setModifiedSteps(prev => Array.from(new Set([...prev, 'route'])));
    
    // Clear route draft when step is completed
    updateFormData({
      currentStep: 'service',
      routeData: data,
      serviceData,
      assignmentData,
      armedAssignmentData,
      createdServiceDbId,
      modifiedSteps: [...modifiedSteps, 'route'],
      sessionId: sessionIdRef.current,
      drafts: {
        ...persistedData.drafts,
        routeDraft: {}
      },
      lastEditedStep: 'route'
    });
  };

  const handleServiceComplete = (data: ServiceData) => {
    const previousIncludeArmado = serviceData?.incluye_armado;
    const newIncludeArmado = data.incluye_armado;
    
    // Detectar cambio en el estado de armado - INVALIDACIÓN INTELIGENTE
    if (previousIncludeArmado !== undefined && previousIncludeArmado !== newIncludeArmado) {
      console.log('🔄 Invalidación inteligente: cambio en incluye_armado', {
        anterior: previousIncludeArmado,
        nuevo: newIncludeArmado,
        timestamp: new Date().toISOString()
      });
      
      if (newIncludeArmado === false && armedAssignmentData) {
        // Si se cambió de con armado a sin armado, limpiar datos de armado
        setArmedAssignmentData(null);
        setHasInvalidatedState(true);
        toast.info('Configuración de armado removida - custodia reiniciada', {
          description: 'Los datos de asignación posteriores han sido limpiados'
        });
      }
      
      if (newIncludeArmado === true && !previousIncludeArmado) {
        // Si se agregó armado, invalidar asignaciones existentes para re-evaluar
        if (assignmentData) {
          setHasInvalidatedState(true);
          toast.info('Armado agregado - revise las asignaciones', {
            description: 'Las asignaciones existentes pueden necesitar actualización'
          });
        }
      }
      
      // Marcar el paso como modificado
      if (!modifiedSteps.includes('service')) {
        setModifiedSteps(prev => [...prev, 'service']);
      }
    }
    
    // Detectar otros cambios significativos
    if (serviceData) {
      const significantChanges = [
        serviceData.tipo_servicio !== data.tipo_servicio,
        serviceData.fecha_programada !== data.fecha_programada,
        serviceData.hora_ventana_inicio !== data.hora_ventana_inicio
      ].some(Boolean);
      
      if (significantChanges) {
        console.log('🔄 Cambios significativos detectados en servicio');
        setHasInvalidatedState(true);
        if (!modifiedSteps.includes('service')) {
          setModifiedSteps(prev => [...prev, 'service']);
        }
      }
    }
    
    setServiceData(data);
    setCurrentStep('assignment');
    
    // Clear service draft when step is completed
    updateFormData({
      currentStep: 'assignment',
      routeData,
      serviceData: data,
      assignmentData,
      armedAssignmentData,
      createdServiceDbId,
      modifiedSteps: modifiedSteps.includes('service') ? modifiedSteps : [...modifiedSteps, 'service'],
      sessionId: sessionIdRef.current,
      drafts: {
        ...persistedData.drafts,
        serviceDraft: {}
      },
      lastEditedStep: 'service'
    });
  };

  const handleAssignmentComplete = async (data: AssignmentData) => {
    // Marcar como modificado si hay cambios
    if (assignmentData && assignmentData.custodio_asignado_id !== data.custodio_asignado_id) {
      if (!modifiedSteps.includes('assignment')) {
        setModifiedSteps(prev => [...prev, 'assignment']);
      }
    }
    
    setAssignmentData(data);
    
    // Verificar dinámicamente si necesita armado
    if (currentlyNeedsArmed) {
      setCurrentStep('armed_assignment');
    } else {
      // Si no incluye armado, ir a confirmación final
      setCurrentStep('final_confirmation');
    }
  };

  const handleArmedAssignmentComplete = async (data: ArmedAssignmentData) => {
    // Marcar como modificado si hay cambios
    if (armedAssignmentData && armedAssignmentData.armado_asignado_id !== data.armado_asignado_id) {
      if (!modifiedSteps.includes('armed_assignment')) {
        setModifiedSteps(prev => [...prev, 'armed_assignment']);
      }
    }
    
    setArmedAssignmentData(data);
    
    // Ir a confirmación final en lugar de completar inmediatamente
    setCurrentStep('final_confirmation');
  };

  const handleSaveAsPending = async (data: ServiceData) => {
    try {
      // Crear el servicio planificado con estado pendiente_asignacion
      const servicioData: ServicioPlanificadoData = {
        id_servicio: data.servicio_id,
        nombre_cliente: data.cliente_nombre,
        origen: data.origen_texto,
        destino: data.destino_texto,
        fecha_hora_cita: `${data.fecha_programada}T${data.hora_ventana_inicio}:00.000Z`,
        tipo_servicio: data.tipo_servicio,
        custodio_asignado: null, // Sin asignar
        custodio_id: null, // Sin asignar
        requiere_armado: data.incluye_armado,
        estado_planeacion: 'pendiente_asignacion',
        tarifa_acordada: null, 
        observaciones: data.observaciones,
        auto: null,
        placa: null
      };
      
      // Guardar como pendiente
      createServicioPlanificado(servicioData);
      
      console.log('💾 Solicitud guardada como pendiente:', data);
      toast.success('Solicitud guardada como pendiente por asignar', {
        description: 'Puedes completar la asignación desde el dashboard de servicios programados'
      });
      
      // CRITICAL: Set suppression flag to prevent auto-restore after successful save
      sessionStorage.setItem('scw_suppress_restore', '1');
      
      // Resetear el workflow después de guardar
      setTimeout(() => {
        resetWorkflow();
      }, 1500);
    } catch (error) {
      console.error('Error al guardar servicio como pendiente:', error);
      toast.error('Error al guardar la solicitud como pendiente');
      // Don't clear draft on error - user can retry
    }
  };

  const resetWorkflow = () => {
    try {
      setCurrentStep('route');
      setRouteData(null);
      setServiceData(null);
      setAssignmentData(null);
      setArmedAssignmentData(null);
      setCreatedServiceDbId(null);
      setModifiedSteps([]);
      setHasInvalidatedState(false);
      
      // CRITICAL: Always clear draft in try-finally to ensure cleanup
      clearDraft();
      console.log('🧹 Workflow reset and draft cleared');
    } catch (error) {
      console.error('❌ Error resetting workflow:', error);
      // Even if reset fails, try to clear draft
      try {
        clearDraft();
      } catch (clearError) {
        console.error('❌ Failed to clear draft:', clearError);
      }
    }
  };

  // Función para navegar a un paso específico (para edición)
  const navigateToStep = (step: string) => {
    console.log('🔧 Navegando a paso para edición:', step);
    setCurrentStep(step as any);
  };

  // Función para manejar la confirmación final
  const handleFinalConfirmation = async () => {
    const finalData = armedAssignmentData || assignmentData;
    if (!finalData) return;

    try {
      setIsValidating(true);
      
      console.log('✅ Confirmación final completada:', {
        serviceId: finalData.servicio_id,
        hasModifications: modifiedSteps.length > 0,
        modifiedSteps,
        timestamp: new Date().toISOString()
      });

      // Preparar información del vehículo con manejo de casos undefined
      const vehicleInfo = custodianVehicle ? {
        auto: `${custodianVehicle.marca} ${custodianVehicle.modelo}`.trim(),
        placa: custodianVehicle.placa || 'Sin placa'
      } : {
        auto: 'Vehículo no asignado',
        placa: 'Sin placa'
      };

      // Crear el servicio planificado en la base de datos
      const servicioData: ServicioPlanificadoData = {
        id_servicio: finalData.servicio_id,
        nombre_cliente: finalData.cliente_nombre,
        origen: finalData.origen_texto,
        destino: finalData.destino_texto,
        fecha_hora_cita: `${finalData.fecha_programada}T${finalData.hora_ventana_inicio}:00.000Z`,
        tipo_servicio: finalData.tipo_servicio,
        custodio_asignado: finalData.custodio_nombre,
        custodio_id: finalData.custodio_asignado_id,
        requiere_armado: finalData.incluye_armado,
        tarifa_acordada: finalData.precio_custodio,
        observaciones: finalData.observaciones,
        // Armed guard fields - include if available
        ...(armedAssignmentData && {
          armado_asignado: armedAssignmentData.armado_nombre,
          armado_id: armedAssignmentData.armado_asignado_id,
          punto_encuentro: armedAssignmentData.punto_encuentro,
          hora_encuentro: armedAssignmentData.hora_encuentro,
          tipo_asignacion_armado: armedAssignmentData.tipo_asignacion,
          proveedor_armado_id: armedAssignmentData.proveedor_id
        }),
        ...vehicleInfo
      };
      
      // Crear el servicio usando la función de mutación correctamente
      createServicioPlanificado(servicioData);
      
      // Si tiene armado, asignar el armado también después de un delay
      if (armedAssignmentData && finalData.servicio_id) {        
        console.log('🛡️ Servicio con armado completado:', armedAssignmentData);
        toast.success('✅ Servicio con armado guardado exitosamente');
      } else {
        console.log('🎉 Servicio completado:', finalData);
        toast.success('✅ Servicio guardado exitosamente');
      }
      
      // CRITICAL: Set suppression flag to prevent auto-restore after successful completion
      sessionStorage.setItem('scw_suppress_restore', '1');
      
      // Resetear después de un delay para mostrar la confirmación
      setTimeout(() => {
        resetWorkflow();
      }, 2000);
      
    } catch (error) {
      console.error('Error al guardar el servicio:', error);
      toast.error('Error al guardar el servicio planificado');
      // Don't clear draft on error - user can retry
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Return Notification */}
      {showTabReturnNotification && (
        <TabReturnNotification 
          currentStep={currentStep}
          lastSaved={lastSaved}
          onDismiss={() => setShowTabReturnNotification(false)}
        />
      )}

      {/* Draft Restored Banner */}
      {showRestoredBanner && (
        <DraftRestoredBanner
          timeSinceSave={getTimeSinceSave()}
          onDismiss={() => setShowRestoredBanner(false)}
          onStartFresh={() => {
            console.log('🗑️ User requested fresh start');
            sessionStorage.setItem('scw_suppress_restore', '1');
            skipNextPersistRef.current = true;
            clearDraft();
            setShowRestoredBanner(false);
            
            // Reset to initial state
            setCurrentStep('route');
            setRouteData(null);
            setServiceData(null);
            setAssignmentData(null);
            setArmedAssignmentData(null);
            setCreatedServiceDbId(null);
            setModifiedSteps([]);
          }}
        />
      )}

      {/* Progress Steps */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Progreso del Flujo</CardTitle>
          <DraftStatusBadge 
            lastSaved={lastSaved}
            getTimeSinceSave={getTimeSinceSave}
            hasDraft={hasDraft}
          />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {steps.filter(step => 
              step.id !== 'armed_assignment' || shouldShowArmedStep
            ).filter(step =>
              step.id !== 'final_confirmation' || canProceedToFinalConfirmation
            ).map((step, index, filteredSteps) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center">
                  {/* Step Circle */}
                  <div className={`step-indicator ${
                    status === 'completed' ? 'step-indicator-completed' :
                    status === 'current' ? 'step-indicator-active' : 
                    'step-indicator-pending'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="ml-4 min-w-0">
                    <div className={`text-sm font-medium ${
                      status === 'current' ? 'text-foreground' : 
                      status === 'completed' ? 'text-success' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                      {modifiedSteps.includes(step.id) && (
                        <Badge variant="secondary" className="ml-2 text-xs bg-yellow-100 text-yellow-800">
                          Modificado
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {step.description}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < filteredSteps.length - 1 && (
                    <div className={`h-px flex-1 mx-4 ${
                      getStepStatus(filteredSteps[index + 1].id) !== 'pending' ? 
                        'bg-success' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="space-y-6">
        {currentStep === 'route' && (
          <RouteSearchStep 
            onComplete={handleRouteComplete}
            initialDraft={persistedData.drafts?.routeDraft}
            onDraftChange={(draft) => {
              console.log('🔄 Route draft changed', draft);
              updateFormData({
                currentStep,
                routeData,
                serviceData,
                assignmentData,
                armedAssignmentData,
                createdServiceDbId,
                modifiedSteps,
                sessionId: sessionIdRef.current,
                drafts: { 
                  ...persistedData.drafts, 
                  routeDraft: draft 
                },
                lastEditedStep: 'route'
              });
            }}
          />
        )}
        
        {currentStep === 'service' && routeData && (
          <ServiceAutoFillStep 
            routeData={routeData}
            onComplete={handleServiceComplete}
            onSaveAsPending={handleSaveAsPending}
            onBack={() => setCurrentStep('route')}
            initialDraft={persistedData.drafts?.serviceDraft}
            onDraftChange={(draft) => {
              console.log('🔄 Service draft changed', draft);
              updateFormData({
                currentStep,
                routeData,
                serviceData,
                assignmentData,
                armedAssignmentData,
                createdServiceDbId,
                modifiedSteps,
                sessionId: sessionIdRef.current,
                drafts: { 
                  ...persistedData.drafts, 
                  serviceDraft: draft 
                },
                lastEditedStep: 'service'
              });
            }}
          />
        )}
        
        {currentStep === 'assignment' && serviceData && (
          <CustodianAssignmentStep 
            serviceData={serviceData}
            onComplete={handleAssignmentComplete}
            onBack={() => setCurrentStep('service')}
          />
        )}
        
        {currentStep === 'armed_assignment' && serviceData && assignmentData && currentlyNeedsArmed && (
          <EnhancedArmedGuardAssignmentStep 
            serviceData={{...serviceData, ...assignmentData}}
            onComplete={handleArmedAssignmentComplete}
            onBack={() => setCurrentStep('assignment')}
            onSkip={() => {
              // Permitir saltar la asignación de armado si ya no se necesita
              console.log('🚫 Armado ya no requerido, ir a confirmación final');
              toast.info('Continuando sin armado');
              setCurrentStep('final_confirmation');
            }}
          />
        )}
        
        {currentStep === 'final_confirmation' && serviceData && assignmentData && (
          <>
            <FinalConfirmationStep
              serviceData={serviceData}
              assignmentData={assignmentData}
              armedAssignmentData={armedAssignmentData || undefined}
              modifiedSteps={modifiedSteps}
              onConfirm={handleFinalConfirmation}
              onEditStep={navigateToStep}
              onBack={() => {
                if (currentlyNeedsArmed && armedAssignmentData) {
                  setCurrentStep('armed_assignment');
                } else {
                  setCurrentStep('assignment');
                }
              }}
              isSubmitting={isLoading || isValidating}
            />
            
            {/* Monitor de conflictos REMOVIDO - ahora la validación es preventiva */}
          </>
        )}
      </div>

      {/* Summary cuando se complete */}
      {((assignmentData && !currentlyNeedsArmed) || (armedAssignmentData && currentlyNeedsArmed)) && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Solicitud Completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">ID de Servicio</div>
                <div className="font-medium text-primary">
                  {(armedAssignmentData || assignmentData)?.servicio_id || 'No especificado'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cliente - Destino</div>
                <div className="font-medium">
                  {(armedAssignmentData || assignmentData)?.cliente_nombre} → {(armedAssignmentData || assignmentData)?.destino_texto}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Custodio Asignado</div>
                <div className="font-medium">{(armedAssignmentData || assignmentData)?.custodio_nombre || 'Pendiente'}</div>
                {custodianVehicle && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Vehículo: {custodianVehicle.marca} {custodianVehicle.modelo} ({custodianVehicle.placa})
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  {serviceData?.incluye_armado ? 'Armado Asignado' : 'Precio'}
                </div>
                <div className="font-medium">
                  {serviceData?.incluye_armado 
                    ? armedAssignmentData?.armado_nombre || 'Pendiente'
                    : `$${assignmentData?.precio_sugerido?.toLocaleString()}`
                  }
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fecha Programada</div>
                <div className="font-medium">
                  {(armedAssignmentData || assignmentData)?.fecha_programada || 'Por definir'}
                </div>
              </div>
            </div>
            
            {serviceData?.incluye_armado && armedAssignmentData && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Punto de Encuentro</div>
                    <div className="font-medium">{armedAssignmentData.punto_encuentro}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Hora de Encuentro</div>
                    <div className="font-medium">{armedAssignmentData.hora_encuentro}</div>
                  </div>
                </div>
              </>
            )}
            
            <Separator />
            <div className="flex items-center justify-between">
              <Badge variant="success">
                {serviceData?.incluye_armado 
                  ? 'Servicio armado creado exitosamente' 
                  : 'Solicitud creada exitosamente'
                }
              </Badge>
              <button 
                onClick={resetWorkflow}
                className="text-sm text-primary hover:underline"
              >
                Crear nueva solicitud
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}