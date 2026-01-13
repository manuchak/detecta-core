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
import { SimplifiedArmedAssignment } from '@/components/planeacion/SimplifiedArmedAssignment';
import { FinalConfirmationStep } from './workflow/FinalConfirmationStep';
import { ConflictMonitor } from './workflow/ConflictMonitor';
import { useCustodianVehicles } from '@/hooks/useCustodianVehicles';
import { useServiciosPlanificados, type ServicioPlanificadoData } from '@/hooks/useServiciosPlanificados';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DraftStatusBadge } from '@/components/workflow/DraftStatusBadge';
import { DraftRestoredBanner } from '@/components/workflow/DraftRestoredBanner';
import { TabReturnNotification } from '@/components/workflow/TabReturnNotification';
import { SavingIndicator } from '@/components/workflow/SavingIndicator';

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
  gadgets_cantidades?: Array<{ tipo: string; cantidad: number }>;
  observaciones?: string;
  fecha_recepcion: string;
  hora_recepcion: string;
}

interface AssignmentData extends ServiceData {
  custodio_asignado_id?: string;
  custodio_nombre?: string;
  estado_comunicacion?: 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder';
  // Override de conflicto
  override_conflicto_motivo?: string;
  override_conflicto_detalles?: string;
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
  const skipHydrationRef = useRef(false);  // 🆕 NEW: Bypass hydration after "start fresh"
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
    autoSaveInterval: 30000, // ✅ OPTIMIZADO: Auto-save every 30 seconds (mejor performance)
    saveOnChangeDebounceMs: 1000, // ✅ OPTIMIZADO: Save 1s after changes (reduce writes)
    isMeaningfulDraft: (data) => {
      // ✅ FIX: Validate consistency - if step requires route, routeData must be valid
      const stepRequiresRoute = ['service', 'assignment', 'armed_assignment', 'final_confirmation'];
      
      if (stepRequiresRoute.includes(data.currentStep)) {
        // If step requires route, draft is only meaningful if routeData is valid
        const hasValidRoute = data.routeData && 
          data.routeData.cliente_nombre && 
          data.routeData.cliente_nombre.trim().length >= 3 &&
          data.routeData.origen_texto &&
          data.routeData.destino_texto;
        
        if (!hasValidRoute) {
          console.log('⚠️ [isMeaningfulDraft] Draft in advanced step without valid routeData - not meaningful');
          return false;
        }
      }
      
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
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Calcula cuántos "puntos de progreso" tiene un estado del workflow.
   * MEJORADO: Ahora también cuenta borradores parciales para evitar pérdida de datos.
   */
  const countMeaningfulProgress = useCallback((
    completedData: { routeData: any; serviceData: any; assignmentData: any; armedAssignmentData: any },
    drafts?: { routeDraft?: any; serviceDraft?: any }
  ): number => {
    // Pasos completados valen 10 puntos cada uno
    const completedSteps = [
      completedData.routeData,
      completedData.serviceData,
      completedData.assignmentData,
      completedData.armedAssignmentData
    ].filter(Boolean).length * 10;
    
    // Borradores parciales valen 1 punto cada uno
    let draftPoints = 0;
    
    // Verificar si routeDraft tiene datos significativos
    if (drafts?.routeDraft) {
      const routeDraftValues = Object.values(drafts.routeDraft).filter(v => v !== '' && v !== null && v !== undefined);
      if (routeDraftValues.length > 0) {
        draftPoints += 1;
      }
    }
    
    // Verificar si serviceDraft tiene datos significativos
    if (drafts?.serviceDraft) {
      const serviceDraftValues = Object.values(drafts.serviceDraft).filter(v => v !== '' && v !== null && v !== undefined);
      if (serviceDraftValues.length > 0) {
        draftPoints += 1;
      }
    }
    
    return completedSteps + draftPoints;
  }, []);

  // CRITICAL: UI State Hydration - Sync UI states when persistedData changes
  // 🆕 MEJORADO: Ahora también considera borradores parciales
  // ✅ FIX: Validate state consistency before hydrating
  const validateStateConsistency = useCallback((data: typeof persistedData): boolean => {
    // If step requires route, routeData MUST exist and be valid
    const stepRequiresRoute = ['service', 'assignment', 'armed_assignment', 'final_confirmation'];
    
    if (stepRequiresRoute.includes(data.currentStep)) {
      const hasValidRoute = data.routeData && 
        data.routeData.cliente_nombre && 
        data.routeData.cliente_nombre.trim().length >= 3 &&
        data.routeData.origen_texto && 
        data.routeData.destino_texto;
      
      if (!hasValidRoute) {
        console.warn('⚠️ Inconsistent state: currentStep requires route but routeData is invalid', {
          currentStep: data.currentStep,
          routeData: data.routeData
        });
        return false;
      }
    }
    
    // If step requires service, serviceData MUST exist
    const stepRequiresService = ['assignment', 'armed_assignment', 'final_confirmation'];
    
    if (stepRequiresService.includes(data.currentStep)) {
      const hasValidService = data.serviceData && 
        data.serviceData.servicio_id && 
        data.serviceData.fecha_programada;
      
      if (!hasValidService) {
        console.warn('⚠️ Inconsistent state: currentStep requires service but serviceData is invalid');
        return false;
      }
    }
    
    return true;
  }, []);

  useEffect(() => {
    // 🆕 NEW: Skip if bypass flag is set (after "start fresh")
    if (skipHydrationRef.current) {
      console.log('⏭️ Skipping hydration due to skipHydrationRef flag');
      skipHydrationRef.current = false;
      return;
    }
    
    // Skip if restoring (handled by auto-restore effect)
    if (isRestoring) return;
    
    // ✅ FIX: Validate consistency before hydrating
    const isConsistent = validateStateConsistency(persistedData);
    
    if (!isConsistent) {
      console.warn('⚠️ [RequestCreationWorkflow] Persisted state inconsistent - resetting to route');
      // Don't hydrate inconsistent state
      return;
    }
    
    // 🆕 MEJORADO: Contar progreso incluyendo borradores
    const persistedProgress = countMeaningfulProgress(
      {
        routeData: persistedData.routeData,
        serviceData: persistedData.serviceData,
        assignmentData: persistedData.assignmentData,
        armedAssignmentData: persistedData.armedAssignmentData
      },
      persistedData.drafts
    );
    
    const localProgress = countMeaningfulProgress(
      { routeData, serviceData, assignmentData, armedAssignmentData },
      {} // Estado local no tiene drafts separados
    );
    
    // Prevenir regresiones usando índice de pasos
    const stepOrder = ['route', 'service', 'assignment', 'armed_assignment', 'final_confirmation'];
    const persistedStepIndex = stepOrder.indexOf(persistedData.currentStep);
    const localStepIndex = stepOrder.indexOf(currentStep);
    
    const persistedIsAhead = persistedStepIndex >= localStepIndex;
    
    // 🆕 MEJORADO: Hidratar si hay MÁS PROGRESO (incluyendo drafts)
    const shouldHydrate = (
      persistedProgress > localProgress &&  // Más progreso total (pasos + drafts)
      persistedIsAhead &&                   // No regresar al usuario
      !isRestoring                          // No hidratar durante restore
    );
    
    if (shouldHydrate) {
      console.log('🔄 [RequestCreationWorkflow] Hidratando UI from persistedData:', {
        persistedProgress,
        localProgress,
        step: persistedData.currentStep,
        hasDrafts: !!persistedData.drafts,
        routeDraftKeys: persistedData.drafts?.routeDraft ? Object.keys(persistedData.drafts.routeDraft) : [],
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
    } else if (persistedProgress > 0 && localProgress === 0) {
      // 🆕 CASO ESPECIAL: Si local está vacío pero persisted tiene progreso,
      // el banner de auto-restore se encargará
      console.log('ℹ️ [RequestCreationWorkflow] Hay progreso persistido pero local está vacío', {
        persistedProgress,
        localProgress
      });
    } else {
      console.log('⏭️ [RequestCreationWorkflow] Skip hydration:', {
        persistedProgress,
        localProgress,
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
    persistedData.drafts,
    isRestoring,
    currentStep,
    countMeaningfulProgress,
    routeData,
    serviceData,
    assignmentData,
    armedAssignmentData
  ]);

  // ✅ CAMBIO #5: Permitir múltiples restauraciones si el draft cambia
  useEffect(() => {
    const suppressionFlag = sessionStorage.getItem('scw_suppress_restore');
    const forceRestoreFlag = sessionStorage.getItem('scw_force_restore');
    
    if (hasDraft && !isRestoring && suppressionFlag !== '1') {
      // Solo auto-restore si:
      // 1. Hay un force flag explícito, O
      // 2. Es el primer mount Y no se ha hecho restore todavía
      const shouldAutoRestore = forceRestoreFlag === '1' || !autoRestoreDoneRef.current;
      
      if (shouldAutoRestore) {
        console.log('🔄 Auto-restoring draft:', {
          reason: forceRestoreFlag === '1' ? 'forced' : 'initial_mount'
        });
        
        autoRestoreDoneRef.current = true;
        restoreDraft();
        setShowRestoredBanner(true);
        
        // Limpiar force flag
        if (forceRestoreFlag === '1') {
          sessionStorage.removeItem('scw_force_restore');
        }
      }
    }
  }, [hasDraft, isRestoring, restoreDraft]);

  // ✅ CAMBIO #3: Detectar y procesar flag de restauración forzada desde banner
  useEffect(() => {
    const forceRestoreFlag = sessionStorage.getItem('scw_force_restore');
    const suppressionFlag = sessionStorage.getItem('scw_suppress_restore');
    
    // 🆕 NO restaurar si el usuario pidió "Empezar de nuevo"
    if (suppressionFlag === '1') {
      console.log('🚫 [RequestCreationWorkflow] Suppression flag active - skipping forced restore');
      return;
    }
    
    if (forceRestoreFlag === '1' && hasDraft) {
      console.log('🎯 [RequestCreationWorkflow] Force restore flag detected - hydrating immediately');
      
      // Limpiar flag
      sessionStorage.removeItem('scw_force_restore');
      
      // Forzar hidratación inmediata del UI
      setCurrentStep(persistedData.currentStep);
      setRouteData(persistedData.routeData);
      setServiceData(persistedData.serviceData);
      setAssignmentData(persistedData.assignmentData);
      setArmedAssignmentData(persistedData.armedAssignmentData);
      setCreatedServiceDbId(persistedData.createdServiceDbId);
      setModifiedSteps(persistedData.modifiedSteps);
      
      setShowRestoredBanner(true);
    }
  }, [hasDraft, persistedData]);

  // ✅ NUEVO: Evento personalizado para forzar guardado
  useEffect(() => {
    const handleForceSave = () => {
      console.log('💾 [RequestCreationWorkflow] Force save triggered');
      setIsSaving(true);
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
      saveDraft(); // Forzar guardado inmediato
      setTimeout(() => setIsSaving(false), 300);
    };

    window.addEventListener('force-workflow-save', handleForceSave);
    return () => window.removeEventListener('force-workflow-save', handleForceSave);
  }, [currentStep, routeData, serviceData, assignmentData, armedAssignmentData, createdServiceDbId, modifiedSteps, persistedData.drafts, persistedData.lastEditedStep, updateFormData, saveDraft]);

  // Persist state changes (with skip mechanism)
  const persistTimerRef = useRef<NodeJS.Timeout | null>(null);  // 🆕 NEW: Track debounce timer
  
  useEffect(() => {
    // Clear previous timer
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    
    // Skip this persistence cycle if flagged
    if (skipNextPersistRef.current) {
      console.log('⏭️ Skipping persistence cycle due to recent discard');
      skipNextPersistRef.current = false;
      return;
    }
    
    setIsSaving(true);
    persistTimerRef.current = setTimeout(() => {  // 🆕 Store timer ref
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
      setIsSaving(false);
      persistTimerRef.current = null;
    }, 500); // Debounce to avoid excessive saves

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
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
      } else if (!document.hidden) {
        // ✅ MEJORADO: Hidratación en regreso de pestaña - ahora incluye borradores parciales
        console.log('👁️ [RequestCreationWorkflow] Tab visible - checking for updates');
        
        // Verificar si persistedData tiene más progreso que el estado local (incluyendo drafts)
        const persistedProgress = countMeaningfulProgress(
          {
            routeData: persistedData.routeData,
            serviceData: persistedData.serviceData,
            assignmentData: persistedData.assignmentData,
            armedAssignmentData: persistedData.armedAssignmentData
          },
          persistedData.drafts
        );
        
        const localProgress = countMeaningfulProgress(
          { routeData, serviceData, assignmentData, armedAssignmentData },
          {} // Estado local no tiene drafts separados
        );
        
        // Si hay más progreso persistido (incluyendo drafts), hidratar inmediatamente
        if (persistedProgress > localProgress) {
          console.log('🔄 [RequestCreationWorkflow] Detected more complete persisted state - hydrating', {
            persistedProgress,
            localProgress
          });
          
          setCurrentStep(persistedData.currentStep);
          setRouteData(persistedData.routeData);
          setServiceData(persistedData.serviceData);
          setAssignmentData(persistedData.assignmentData);
          setArmedAssignmentData(persistedData.armedAssignmentData);
          setCreatedServiceDbId(persistedData.createdServiceDbId);
          setModifiedSteps(persistedData.modifiedSteps);
        }
        
        // Mostrar notificación si no está en el primer paso
        if (currentStep !== 'route') {
          setShowTabReturnNotification(true);
          setTimeout(() => setShowTabReturnNotification(false), 5000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentStep, routeData, serviceData, assignmentData, armedAssignmentData, createdServiceDbId, modifiedSteps, persistedData, countMeaningfulProgress, updateFormData]);

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

  // ✅ FIX: REMOVED auto-advance useEffect
  // The transition to 'service' must be EXPLICIT via handleRouteComplete only.
  // Auto-advance caused conflicts with draft hydration and jumped the user unexpectedly.

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
        // Use explicit CDMX timezone offset to ensure correct storage
        fecha_hora_cita: `${data.fecha_programada}T${data.hora_ventana_inicio}:00-06:00`,
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
        // Use explicit CDMX timezone offset to ensure correct storage
        fecha_hora_cita: `${finalData.fecha_programada}T${finalData.hora_ventana_inicio}:00-06:00`,
        tipo_servicio: finalData.tipo_servicio,
        custodio_asignado: finalData.custodio_nombre,
        custodio_id: finalData.custodio_asignado_id,
        requiere_armado: finalData.incluye_armado,
        tarifa_acordada: finalData.precio_custodio,
        observaciones: finalData.observaciones,
        gadgets_cantidades: finalData.gadgets_cantidades || [],
        // Armed guard fields - include if available
        ...(armedAssignmentData && {
          armado_asignado: armedAssignmentData.armado_nombre,
          armado_id: armedAssignmentData.armado_asignado_id,
          punto_encuentro: armedAssignmentData.punto_encuentro,
          hora_encuentro: armedAssignmentData.hora_encuentro,
          tipo_asignacion_armado: armedAssignmentData.tipo_asignacion,
          proveedor_armado_id: armedAssignmentData.proveedor_id
        }),
        // Override de conflicto - si aplica
        ...(finalData.override_conflicto_motivo && {
          override_conflicto_motivo: finalData.override_conflicto_motivo,
          override_conflicto_autorizado_por: user?.id,
          override_conflicto_timestamp: new Date().toISOString()
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
      
      // ✅ FASE 1: Limpiar draft ANTES de resetear
      console.log('✅ Service created successfully - clearing draft');
      clearDraft();
      
      // ✅ FASE 1: Limpiar TODOS los flags de sesión
      sessionStorage.removeItem('scw_suppress_restore');
      sessionStorage.removeItem('scw_force_restore');
      localStorage.removeItem('service_creation_workflow_dialog_state');
      
      // ✅ FASE 1: Pequeño delay para asegurar limpieza
      await new Promise(resolve => setTimeout(resolve, 50));
      
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
            console.log('🗑️ User requested fresh start - HARD CLEAR');
            
            // ✅ FASE 2: PASO 1: Hard clear del draft (previene re-hidratación)
            clearDraft(true);  // hardClear = true
            
            // ✅ FASE 2: PASO 2: Limpiar flags de control
            sessionStorage.setItem('scw_suppress_restore', '1');
            sessionStorage.removeItem('scw_force_restore');
            localStorage.removeItem('service_creation_workflow_dialog_state');
            
            // ✅ FASE 2: PASO 3: Resetear estados a valores iniciales
            setCurrentStep('route');
            setRouteData(null);
            setServiceData(null);
            setAssignmentData(null);
            setArmedAssignmentData(null);
            setCreatedServiceDbId(null);
            setModifiedSteps([]);
            setHasInvalidatedState(false);
            
            // ✅ FASE 2: PASO 4: Resetear refs
            autoRestoreDoneRef.current = false;
            sessionIdRef.current = crypto.randomUUID();
            skipHydrationRef.current = true;
            
            // ✅ FASE 2: PASO 5: Actualizar form data a estado limpio
            updateFormData({
              currentStep: 'route',
              routeData: null,
              serviceData: null,
              assignmentData: null,
              armedAssignmentData: null,
              createdServiceDbId: null,
              modifiedSteps: [],
              sessionId: crypto.randomUUID(),
              drafts: {},
              lastEditedStep: null,
            });
            
            // ✅ FASE 2: PASO 6: Cerrar banner
            setShowRestoredBanner(false);
            
            // ✅ FASE 2: PASO 7: Limpiar suppression flag después de 2s
            setTimeout(() => {
              sessionStorage.removeItem('scw_suppress_restore');
              console.log('✅ Fresh start complete - ready for new service');
            }, 2000);
          }}
        />
      )}

      {/* Progress Steps */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <CardTitle>Progreso del Flujo</CardTitle>
            <SavingIndicator 
              isSaving={isSaving}
              lastSaved={lastSaved}
              getTimeSinceSave={getTimeSinceSave}
            />
          </div>
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
        
        {/* ✅ FIX: Strengthen render condition - require valid route fields */}
        {currentStep === 'service' && routeData && routeData.cliente_nombre && routeData.origen_texto && routeData.destino_texto ? (
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
        ) : currentStep === 'service' && (!routeData || !routeData.cliente_nombre || !routeData.origen_texto) ? (
          // ✅ FIX: Fallback UI when state is inconsistent
          <Card className="border-warning bg-warning/5">
            <CardContent className="p-6 text-center">
              <MapPin className="h-12 w-12 mx-auto text-warning mb-4" />
              <h3 className="text-lg font-semibold mb-2">Datos de ruta incompletos</h3>
              <p className="text-muted-foreground mb-4">
                No se encontró información completa de la ruta seleccionada. Por favor, regresa al paso anterior.
              </p>
              <Button onClick={() => setCurrentStep('route')} variant="outline">
                Volver a Búsqueda de Ruta
              </Button>
            </CardContent>
          </Card>
        ) : null}
        
        {currentStep === 'assignment' && serviceData && (
          <CustodianAssignmentStep 
            serviceData={serviceData}
            onComplete={handleAssignmentComplete}
            onBack={() => setCurrentStep('service')}
          />
        )}
        
        {currentStep === 'armed_assignment' && serviceData && assignmentData && currentlyNeedsArmed && (() => {
          // 🧩 Construir serviceData para SimplifiedArmedAssignment
          const simplifiedServiceData = {
            servicio_id: serviceData.servicio_id,
            origen: serviceData.origen_texto,
            destino: serviceData.destino_texto,
            fecha_hora_cita: `${serviceData.fecha_programada}T${serviceData.hora_ventana_inicio}`,
            custodio_asignado: assignmentData?.custodio_nombre || ''
          };
          
          // 🔍 DEBUG LOG: Verificar datos que entran al componente de armado
          console.log('🔍 [Wizard] armed_assignment step → simplifiedServiceData', {
            serviceData,
            assignmentData,
            simplifiedServiceData,
            currentlyNeedsArmed
          });
          
          // 🧩 Adaptador de onComplete: SimplifiedArmedAssignment → ArmedAssignmentData
          const handleSimplifiedComplete = (data: {
            armado_id: string;
            armado_nombre: string;
            punto_encuentro: string;
            hora_encuentro: string;
            tipo_asignacion: 'interno' | 'proveedor';
            proveedor_id?: string;
            observaciones?: string;
            personalId?: string;
            nombreCompleto?: string;
            licenciaPortacion?: string;
            verificacionData?: any;
          }) => {
            const armedData: ArmedAssignmentData = {
              ...serviceData,
              ...assignmentData,
              armado_asignado_id: data.armado_id,
              armado_nombre: data.armado_nombre,
              tipo_asignacion: data.tipo_asignacion,
              proveedor_id: data.proveedor_id,
              punto_encuentro: data.punto_encuentro,
              hora_encuentro: data.hora_encuentro,
              estado_asignacion: 'pendiente'
            };
            
            console.log('🧩 [Wizard] Adaptación onComplete: SimplifiedArmedAssignment → ArmedAssignmentData', {
              input: data,
              output: armedData
            });
            
            handleArmedAssignmentComplete(armedData);
          };
          
          return (
            <SimplifiedArmedAssignment
              serviceData={simplifiedServiceData}
              onComplete={handleSimplifiedComplete}
              onBack={() => setCurrentStep('assignment')}
              onSkip={() => {
                console.log('🚫 [Wizard] Skip armado, ir a confirmación');
                toast.info('Continuando sin armado');
                setCurrentStep('final_confirmation');
              }}
            />
          );
        })()}
        
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