import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
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
  pricingResult: PricingResultData | null;
  matchType: MatchType;
  isNewRoute: boolean;
  
  // Service step
  servicioId: string;
  idInterno: string;
  fecha: string;
  hora: string;
  tipoServicio: string;
  tipoCustodia: string;
  requiereArmado: boolean;
  gadgets: Record<string, number>;
  
  // Custodian step
  custodio: string;
  custodioId: string;
  
  // Armed step
  armado: string;
  armadoId: string;
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
  saveDraft: () => void;
  hasUnsavedChanges: boolean;
  draftId: string | null;
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
  pricingResult: null,
  matchType: null,
  isNewRoute: false,
  // Service step
  servicioId: '',
  idInterno: '',
  fecha: '',
  hora: '',
  tipoServicio: '',
  tipoCustodia: '',
  requiereArmado: false,
  gadgets: {},
  custodio: '',
  custodioId: '',
  armado: '',
  armadoId: '',
  puntoEncuentro: '',
  horaEncuentro: '',
};

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

  // Sync URL with current step
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('step', currentStep);
    if (draftId) {
      params.set('draft', draftId);
    }
    setSearchParams(params, { replace: true });
  }, [currentStep, draftId, setSearchParams]);

  // Load draft if draftId exists in URL
  useEffect(() => {
    if (draftIdFromUrl) {
      const savedDraft = localStorage.getItem(`service-draft-${draftIdFromUrl}`);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed.formData || INITIAL_FORM_DATA);
          setCompletedSteps(parsed.completedSteps || []);
          toast.success('Borrador restaurado');
        } catch (e) {
          console.error('Error loading draft:', e);
        }
      }
    }
  }, [draftIdFromUrl]);

  const goToStep = useCallback((step: StepId) => {
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

  const saveDraft = useCallback(() => {
    const id = draftId || crypto.randomUUID();
    const draftData = {
      formData,
      completedSteps,
      savedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(`service-draft-${id}`, JSON.stringify(draftData));
    setDraftId(id);
    setHasUnsavedChanges(false);
    toast.success('Borrador guardado');
  }, [formData, completedSteps, draftId]);

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
  };

  return (
    <ServiceCreationContext.Provider value={value}>
      {children}
    </ServiceCreationContext.Provider>
  );
}

export function useServiceCreation() {
  const context = useContext(ServiceCreationContext);
  if (!context) {
    throw new Error('useServiceCreation must be used within ServiceCreationProvider');
  }
  return context;
}
