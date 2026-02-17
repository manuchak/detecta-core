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

export interface ArmadoSeleccionado {
  nombre: string;
  id: string;
  tipo: 'interno' | 'proveedor';
  proveedorId?: string;
  puntoEncuentro: string;
  horaEncuentro: string;
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
  cantidadArmadosRequeridos: number;
  esServicioRetorno: boolean; // Flag for return services - bypasses 30min validation
  gadgets: Record<string, number>;
  observaciones: string;   // Additional notes
  
  // Custodian step
  custodio: string;
  custodioId: string;
  
  // Armed step - Multi-armado array (source of truth)
  armados: ArmadoSeleccionado[];
  
  // Armed step - Legacy scalar fields (aliases of armados[0] for backward compat)
  armado: string;
  armadoId: string;
  tipoAsignacionArmado: 'interno' | 'proveedor' | null;
  proveedorArmadoId: string | null;
  puntoEncuentro: string;
  horaEncuentro: string;
}

// Draft storage structure for orphan detection
interface StoredDraft {
  formData: Partial<ServiceFormData>;
  completedSteps: StepId[];
  savedAt: string;
  version: number;
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
  isHydrated: boolean;
  // NEW: Orphan draft restore support
  showRestorePrompt: boolean;
  pendingRestore: StoredDraft | null;
  acceptRestore: () => void;
  rejectRestore: () => void;
  dismissRestorePrompt: () => void;
}

const ServiceCreationContext = createContext<ServiceCreationContextValue | null>(null);

const STEP_ORDER: StepId[] = ['route', 'service', 'custodian', 'armed', 'confirmation'];
const STORAGE_VERSION = 2; // Bumped for dual-backup support
const DRAFT_KEY_PREFIX = 'service-draft-';
const SESSION_BACKUP_SUFFIX = '_session_backup';

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
  cantidadArmadosRequeridos: 1,
  esServicioRetorno: false,
  gadgets: {},
  observaciones: '',
  // Custodian step
  custodio: '',
  custodioId: '',
  // Armed step - multi-armado
  armados: [],
  // Armed step - legacy scalars
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

// Check if draft has meaningful data worth saving
function isMeaningfulDraft(data: Partial<ServiceFormData>): boolean {
  return Boolean(data.cliente || data.origen || data.destino || data.clienteId);
}

// Generate preview text for orphan draft prompt
function getPreviewText(data: Partial<ServiceFormData>): string {
  if (data.cliente) return data.cliente;
  if (data.origen && data.destino) return `${data.origen} → ${data.destino}`;
  if (data.origen) return `Desde: ${data.origen}`;
  return 'Servicio en progreso';
}

// Find orphan drafts (drafts without URL match)
function findOrphanDraft(): { draftId: string; draft: StoredDraft } | null {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(DRAFT_KEY_PREFIX));
    
    for (const key of keys) {
      const draftId = key.replace(DRAFT_KEY_PREFIX, '');
      const stored = localStorage.getItem(key);
      
      if (stored) {
        const parsed: StoredDraft = JSON.parse(stored);
        
        // Check TTL (24 hours)
        const savedAt = new Date(parsed.savedAt);
        const now = Date.now();
        const TTL = 24 * 60 * 60 * 1000;
        
        if (now - savedAt.getTime() < TTL && isMeaningfulDraft(parsed.formData)) {
          return { draftId, draft: parsed };
        }
      }
    }
    
    // Also check sessionStorage backup
    const sessionKeys = Object.keys(sessionStorage).filter(k => 
      k.startsWith(DRAFT_KEY_PREFIX) && k.endsWith(SESSION_BACKUP_SUFFIX)
    );
    
    for (const key of sessionKeys) {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsed: StoredDraft = JSON.parse(stored);
        const draftId = key.replace(DRAFT_KEY_PREFIX, '').replace(SESSION_BACKUP_SUFFIX, '');
        
        const savedAt = new Date(parsed.savedAt);
        const now = Date.now();
        const TTL = 24 * 60 * 60 * 1000;
        
        if (now - savedAt.getTime() < TTL && isMeaningfulDraft(parsed.formData)) {
          return { draftId, draft: parsed };
        }
      }
    }
  } catch (e) {
    console.error('[ServiceCreation] Error finding orphan draft:', e);
  }
  
  return null;
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
  
  // NEW: Orphan draft restore states
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<StoredDraft | null>(null);
  const [pendingDraftId, setPendingDraftId] = useState<string | null>(null);
  
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

  // Internal save function (for silent autosave) - NOW WITH DUAL BACKUP
  const saveDraftInternal = useCallback((options?: { silent?: boolean }) => {
    const currentFormData = formDataRef.current;
    const currentCompletedSteps = completedStepsRef.current;
    const currentDraftId = draftIdRef.current;
    
    const id = currentDraftId || crypto.randomUUID();
    const draftData: StoredDraft = {
      formData: currentFormData,
      completedSteps: currentCompletedSteps,
      savedAt: new Date().toISOString(),
      version: STORAGE_VERSION,
    };
    
    try {
      const draftString = JSON.stringify(draftData);
      const storageKey = `${DRAFT_KEY_PREFIX}${id}`;
      
      // DUAL BACKUP: Save to both localStorage and sessionStorage
      localStorage.setItem(storageKey, draftString);
      sessionStorage.setItem(`${storageKey}${SESSION_BACKUP_SUFFIX}`, draftString);
      
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

  // Load from storage with fallback to session backup
  const loadDraftFromStorage = useCallback((id: string): StoredDraft | null => {
    try {
      const storageKey = `${DRAFT_KEY_PREFIX}${id}`;
      let stored = localStorage.getItem(storageKey);
      
      // Fallback to sessionStorage
      if (!stored) {
        stored = sessionStorage.getItem(`${storageKey}${SESSION_BACKUP_SUFFIX}`);
        if (stored) {
          console.log('[ServiceCreation] Restored from session backup');
        }
      }
      
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('[ServiceCreation] Error loading draft:', e);
    }
    return null;
  }, []);

  // Load draft if draftId exists in URL - with cleanup to prevent race conditions
  // OR detect orphan drafts
  useEffect(() => {
    let cancelled = false;
    let rafId: number | null = null;
    
    const hydrate = () => {
      if (cancelled) return;
      
      if (draftIdFromUrl && !isHydrated) {
        // URL has draft ID - try to load it
        const parsed = loadDraftFromStorage(draftIdFromUrl);
        
        if (parsed) {
          const restoredFormData = parsed.formData || INITIAL_FORM_DATA;
          
          // Validate state consistency before restoring
          const validatedFormData = validateFormDataConsistency(restoredFormData);
          
          if (!cancelled) {
            setFormData(validatedFormData);
            setCompletedSteps(parsed.completedSteps || []);
            // Delay hydration flag to next tick to ensure formData has propagated
            rafId = requestAnimationFrame(() => {
              if (!cancelled) setIsHydrated(true);
            });
          }
          toast.success('Borrador restaurado');
        } else {
          rafId = requestAnimationFrame(() => {
            if (!cancelled) setIsHydrated(true);
          });
        }
      } else if (!draftIdFromUrl && !cancelled) {
        // NO URL draft ID - check for orphan drafts
        const orphan = findOrphanDraft();
        
        if (orphan && isMeaningfulDraft(orphan.draft.formData)) {
          // Found orphan draft - show restore prompt
          setPendingRestore(orphan.draft);
          setPendingDraftId(orphan.draftId);
          setShowRestorePrompt(true);
          console.log('[ServiceCreation] Orphan draft detected:', orphan.draftId);
        }
        
        rafId = requestAnimationFrame(() => {
          if (!cancelled) setIsHydrated(true);
        });
      }
    };
    
    hydrate();
    
    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [draftIdFromUrl, isHydrated, loadDraftFromStorage]);

  // NEW: Accept orphan draft restore
  const acceptRestore = useCallback(() => {
    if (!pendingRestore || !pendingDraftId) return;
    
    const validatedFormData = validateFormDataConsistency(pendingRestore.formData);
    setFormData(validatedFormData);
    setCompletedSteps(pendingRestore.completedSteps || []);
    setDraftId(pendingDraftId);
    setPendingRestore(null);
    setPendingDraftId(null);
    setShowRestorePrompt(false);
    
    toast.success('Borrador restaurado');
    console.log('[ServiceCreation] Orphan draft accepted:', pendingDraftId);
  }, [pendingRestore, pendingDraftId]);

  // NEW: Reject orphan draft restore
  const rejectRestore = useCallback(() => {
    if (pendingDraftId) {
      // Clear the orphan draft from storage
      const storageKey = `${DRAFT_KEY_PREFIX}${pendingDraftId}`;
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(`${storageKey}${SESSION_BACKUP_SUFFIX}`);
      console.log('[ServiceCreation] Orphan draft rejected and cleared:', pendingDraftId);
    }
    
    setPendingRestore(null);
    setPendingDraftId(null);
    setShowRestorePrompt(false);
  }, [pendingDraftId]);

  // NEW: Dismiss prompt without action
  const dismissRestorePrompt = useCallback(() => {
    setShowRestorePrompt(false);
    // Keep pendingRestore in case user wants to restore later
  }, []);

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
        const parsed = loadDraftFromStorage(draftIdRef.current);
        
        if (parsed) {
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
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadDraftFromStorage]);

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
      const newSteps = [...prev, step];
      completedStepsRef.current = newSteps; // Sincronizar ref inmediatamente
      return newSteps;
    });
    setHasUnsavedChanges(true); // Dispara autosave
    
    // Guardar inmediatamente para evitar pérdida de checkmarks
    setTimeout(() => {
      saveDraftInternal({ silent: true });
    }, 50);
  }, [saveDraftInternal]);

  // Public saveDraft that also ensures draftId
  const saveDraft = useCallback((options?: { silent?: boolean }) => {
    ensureDraftId();
    saveDraftInternal(options);
  }, [ensureDraftId, saveDraftInternal]);

  // Clear draft from localStorage after successful creation
  const clearDraft = useCallback(() => {
    if (draftIdRef.current) {
      const storageKey = `${DRAFT_KEY_PREFIX}${draftIdRef.current}`;
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(`${storageKey}${SESSION_BACKUP_SUFFIX}`);
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
    isHydrated,
    // NEW: Orphan draft restore
    showRestorePrompt,
    pendingRestore,
    acceptRestore,
    rejectRestore,
    dismissRestorePrompt,
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

// Export preview text function for use in layout
export { getPreviewText };

export function useServiceCreation() {
  const context = useContext(ServiceCreationContext);
  if (!context) {
    throw new Error('useServiceCreation must be used within ServiceCreationProvider');
  }
  return context;
}
