import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export type StepId = 'route' | 'service' | 'custodian' | 'armed' | 'confirmation';
export type RouteSubStep = 'client' | 'location' | 'pricing' | 'confirm';
export type MatchType = 'exact' | 'flexible' | 'destination-only' | null;

export interface PricingResultData {
  id?: string;
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  precio_sugerido: number | null;
  precio_custodio: number | null;
  pago_custodio_sin_arma?: number | null;
  costo_operativo?: number | null;
  margen_estimado?: number | null;
  distancia_km: number | null;
  tipo_servicio: string | null;
  incluye_armado?: boolean;
  es_ruta_reparto: boolean;
  puntos_intermedios?: string[] | null;
  numero_paradas?: number;
  ruta_encontrada?: string;
}

export interface ServiceFormData {
  // Route step
  cliente: string;
  clienteId: string;
  origen: string;
  destino: string;
  precioCotizado: number | null;
  routeData: any; // Full route/pricing data
  
  // RouteStep internal state (for persistence)
  routeSubStep: RouteSubStep;
  isNewClient: boolean;
  isNewOrigen: boolean;
  isNewDestino: boolean;
  pricingResult: PricingResultData | null;
  matchType: MatchType;
  isNewRoute: boolean;
  
  // Service step
  servicioId: string;
  idInterno: string;
  fechaRecepcion: string;  // When request was received (readonly)
  horaRecepcion: string;   // Time of reception (readonly)
  fecha: string;           // Scheduled appointment date
  hora: string;            // Scheduled appointment time
  tipoServicio: string;
  tipoCustodia: string;
  requiereArmado: boolean;
  gadgets: Record<string, number>;
  observaciones: string;   // Additional notes
  
  // Custodian step
  custodio: string;
  custodioId: string;
  
  // Armed step
  armado: string;
  armadoId: string;
  tipoAsignacionArmado: 'interno' | 'proveedor' | null;
  proveedorArmadoId: string | null;
  puntoEncuentro: string;
  horaEncuentro: string;
}

interface ServiceCreationContextValue {
  currentStep: StepId;
  goToStep: (step: StepId) => void;
  nextStep: () => void;
  previousStep: () => void;
  formData: Partial<ServiceFormData>;
  updateFormData: (data: Partial<ServiceFormData>) => void;
  completedSteps: StepId[];
  markStepCompleted: (step: StepId) => void;
  saveDraft: (options?: { silent?: boolean }) => void;
  hasUnsavedChanges: boolean;
  draftId: string | null;
  clearDraft: () => void;
}

const ServiceCreationContext = createContext<ServiceCreationContextValue | null>(null);

const STEP_ORDER: StepId[] = ['route', 'service', 'custodian', 'armed', 'confirmation'];

const INITIAL_FORM_DATA: Partial<ServiceFormData> = {
  cliente: '',
  clienteId: '',
  origen: '',
  destino: '',
  precioCotizado: null,
  routeData: null,
  // RouteStep internal state
  routeSubStep: 'client',
  isNewClient: false,
  isNewOrigen: false,
  isNewDestino: false,
  pricingResult: null,
  matchType: null,
  isNewRoute: false,
  // Service step
  servicioId: '',
  idInterno: '',
  fechaRecepcion: '',
  horaRecepcion: '',
  fecha: '',
  hora: '',
  tipoServicio: '',
  tipoCustodia: '',
  requiereArmado: false,
  gadgets: {},
  observaciones: '',
  // Custodian step
  custodio: '',
  custodioId: '',
  // Armed step
  armado: '',
  armadoId: '',
  tipoAsignacionArmado: null,
  proveedorArmadoId: null,
  puntoEncuentro: '',
  horaEncuentro: '',
};

// Calculate progress score for comparing states (includes completedSteps)
function calculateProgressScore(data: Partial<ServiceFormData>, completedSteps?: StepId[]): number {
  let score = 0;
  if (data.cliente) score += 1;
  if (data.clienteId) score += 1;
  if (data.origen) score += 1;
  if (data.destino) score += 1;
  if (data.pricingResult) score += 3;
  if (data.routeData) score += 2;
  if (data.fecha) score += 1;
  if (data.custodioId) score += 2;
  
  // Include completed steps in score calculation (5 points each)
  if (completedSteps && completedSteps.length > 0) {
    score += completedSteps.length * 5;
  }
  
  return score;
}

export function ServiceCreationProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get step from URL or default to 'route'
  const stepFromUrl = searchParams.get('step') as StepId | null;
  const draftIdFromUrl = searchParams.get('draft');
  
  const [currentStep, setCurrentStep] = useState<StepId>(
    stepFromUrl && STEP_ORDER.includes(stepFromUrl) ? stepFromUrl : 'route'
  );
  const [formData, setFormData] = useState<Partial<ServiceFormData>>(INITIAL_FORM_DATA);
  const [completedSteps, setCompletedSteps] = useState<StepId[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(draftIdFromUrl);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Refs to avoid stale closures in event handlers
  const formDataRef = useRef(formData);
  const completedStepsRef = useRef(completedSteps);
  const draftIdRef = useRef(draftId);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  
  // Keep refs in sync
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { completedStepsRef.current = completedSteps; }, [completedSteps]);
  useEffect(() => { draftIdRef.current = draftId; }, [draftId]);
  useEffect(() => { hasUnsavedChangesRef.current = hasUnsavedChanges; }, [hasUnsavedChanges]);

  // Sync URL with current step and draftId
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('step', currentStep);
    if (draftId) {
      params.set('draft', draftId);
    }
    setSearchParams(params, { replace: true });
  }, [currentStep, draftId, setSearchParams]);

  // Internal save function (for silent autosave)
  const saveDraftInternal = useCallback((options?: { silent?: boolean }) => {
    const currentFormData = formDataRef.current;
    const currentCompletedSteps = completedStepsRef.current;
    const currentDraftId = draftIdRef.current;
    
    const id = currentDraftId || crypto.randomUUID();
    const draftData = {
      formData: currentFormData,
      completedSteps: currentCompletedSteps,
      savedAt: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(`service-draft-${id}`, JSON.stringify(draftData));
      
      if (!currentDraftId) {
        setDraftId(id);
      }
      setHasUnsavedChanges(false);
      
      if (!options?.silent) {
        toast.success('Borrador guardado');
      }
    } catch (e) {
      console.error('Error saving draft:', e);
      if (!options?.silent) {
        toast.error('Error al guardar borrador');
      }
    }
  }, []);

  // Load draft if draftId exists in URL
  useEffect(() => {
    if (draftIdFromUrl && !isHydrated) {
      const savedDraft = localStorage.getItem(`service-draft-${draftIdFromUrl}`);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          const restoredFormData = parsed.formData || INITIAL_FORM_DATA;
          
          // Validate state consistency before restoring
          const validatedFormData = validateFormDataConsistency(restoredFormData);
          
          setFormData(validatedFormData);
          setCompletedSteps(parsed.completedSteps || []);
          setIsHydrated(true);
          toast.success('Borrador restaurado');
        } catch (e) {
          console.error('Error loading draft:', e);
          setIsHydrated(true);
        }
      } else {
        setIsHydrated(true);
      }
    } else if (!draftIdFromUrl) {
      setIsHydrated(true);
    }
  }, [draftIdFromUrl, isHydrated]);

  // Auto-create draftId on first meaningful change
  const ensureDraftId = useCallback(() => {
    if (!draftIdRef.current) {
      const newId = crypto.randomUUID();
      setDraftId(newId);
      return newId;
    }
    return draftIdRef.current;
  }, []);

  // Debounced autosave effect
  useEffect(() => {
    if (!hasUnsavedChanges || !isHydrated) return;
    
    // Check if there's meaningful data to save
    const score = calculateProgressScore(formData);
    if (score < 1) return; // Don't save empty forms
    
    // Ensure we have a draft ID
    ensureDraftId();
    
    const timeoutId = setTimeout(() => {
      saveDraftInternal({ silent: true });
    }, 800); // Debounce 800ms
    
    return () => clearTimeout(timeoutId);
  }, [hasUnsavedChanges, formData, isHydrated, ensureDraftId, saveDraftInternal]);

  // Visibility change handler - save when tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChangesRef.current) {
        const score = calculateProgressScore(formDataRef.current);
        if (score >= 1) {
          saveDraftInternal({ silent: true });
        }
      }
    };

    const handlePageHide = () => {
      if (hasUnsavedChangesRef.current) {
        const score = calculateProgressScore(formDataRef.current);
        if (score >= 1) {
          saveDraftInternal({ silent: true });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [saveDraftInternal]);

  // Reconciliation when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && draftIdRef.current) {
        // Tab became visible - check if storage has newer/more complete data
        const savedDraft = localStorage.getItem(`service-draft-${draftIdRef.current}`);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            const persistedData = parsed.formData || {};
            const persistedCompleted: StepId[] = parsed.completedSteps || [];
            
            // Calculate scores including completedSteps
            const persistedScore = calculateProgressScore(persistedData, persistedCompleted);
            const localScore = calculateProgressScore(formDataRef.current, completedStepsRef.current);
            
            // Check if persisted has steps missing from local memory
            const missingSteps = persistedCompleted.filter(
              step => !completedStepsRef.current.includes(step)
            );
            
            // Reconcile if persisted has more progress OR has missing completed steps
            if (persistedScore > localScore || missingSteps.length > 0) {
              const validatedFormData = validateFormDataConsistency(persistedData);
              setFormData(validatedFormData);
              
              // Merge completed steps to preserve any local ones + restore missing
              const mergedSteps = [...new Set([...completedStepsRef.current, ...persistedCompleted])];
              setCompletedSteps(mergedSteps);
              
              console.log('[ServiceCreation] Reconciled from storage', {
                persistedScore,
                localScore,
                missingSteps,
                mergedSteps
              });
            }
          } catch (e) {
            console.error('Error reconciling draft:', e);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const goToStep = useCallback((step: StepId) => {
    // Guard: redirect to confirmation if trying to access armed step without requirement
    if (step === 'armed' && !formDataRef.current.requiereArmado) {
      setCurrentStep('confirmation');
      return;
    }
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      // Skip armed step if not required
      let nextIndex = currentIndex + 1;
      if (STEP_ORDER[nextIndex] === 'armed' && !formData.requiereArmado) {
        nextIndex++;
      }
      if (nextIndex < STEP_ORDER.length) {
        setCurrentStep(STEP_ORDER[nextIndex]);
      }
    }
  }, [currentStep, formData.requiereArmado]);

  const previousStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      // Skip armed step if not required when going back
      let prevIndex = currentIndex - 1;
      if (STEP_ORDER[prevIndex] === 'armed' && !formData.requiereArmado) {
        prevIndex--;
      }
      if (prevIndex >= 0) {
        setCurrentStep(STEP_ORDER[prevIndex]);
      }
    }
  }, [currentStep, formData.requiereArmado]);

  const updateFormData = useCallback((data: Partial<ServiceFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setHasUnsavedChanges(true);
  }, []);

  const markStepCompleted = useCallback((step: StepId) => {
    setCompletedSteps(prev => {
      if (prev.includes(step)) return prev;
      return [...prev, step];
    });
  }, []);

  // Public saveDraft that also ensures draftId
  const saveDraft = useCallback((options?: { silent?: boolean }) => {
    ensureDraftId();
    saveDraftInternal(options);
  }, [ensureDraftId, saveDraftInternal]);

  // Clear draft from localStorage after successful creation
  const clearDraft = useCallback(() => {
    if (draftIdRef.current) {
      localStorage.removeItem(`service-draft-${draftIdRef.current}`);
      setDraftId(null);
      setHasUnsavedChanges(false);
      console.log('[ServiceCreation] Draft cleared after successful creation');
    }
  }, []);

  const value: ServiceCreationContextValue = {
    currentStep,
    goToStep,
    nextStep,
    previousStep,
    formData,
    updateFormData,
    completedSteps,
    markStepCompleted,
    saveDraft,
    hasUnsavedChanges,
    draftId,
    clearDraft,
  };

  return (
    <ServiceCreationContext.Provider value={value}>
      {children}
    </ServiceCreationContext.Provider>
  );
}

// Validate form data consistency to prevent restoring invalid states
function validateFormDataConsistency(data: Partial<ServiceFormData>): Partial<ServiceFormData> {
  const validated = { ...data };
  
  // If routeSubStep is 'location' but no client, reset to 'client'
  if (validated.routeSubStep === 'location' && !validated.cliente) {
    validated.routeSubStep = 'client';
  }
  
  // If routeSubStep is 'pricing' but missing client/origen/destino, go back
  if (validated.routeSubStep === 'pricing') {
    if (!validated.cliente) {
      validated.routeSubStep = 'client';
    } else if (!validated.origen || !validated.destino) {
      validated.routeSubStep = 'location';
    }
  }
  
  // If routeSubStep is 'confirm' but no pricingResult, go back
  if (validated.routeSubStep === 'confirm' && !validated.pricingResult) {
    if (!validated.cliente) {
      validated.routeSubStep = 'client';
    } else if (!validated.origen || !validated.destino) {
      validated.routeSubStep = 'location';
    } else {
      validated.routeSubStep = 'pricing';
    }
  }
  
  return validated;
}

export function useServiceCreation() {
  const context = useContext(ServiceCreationContext);
  if (!context) {
    throw new Error('useServiceCreation must be used within ServiceCreationProvider');
  }
  return context;
}
