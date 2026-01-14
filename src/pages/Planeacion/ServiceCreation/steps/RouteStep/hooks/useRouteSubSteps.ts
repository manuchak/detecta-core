import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

export type RouteSubStep = 'client' | 'location' | 'pricing' | 'confirm';

export interface PricingResult {
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

export type MatchType = 'exact' | 'flexible' | 'destination-only' | null;

export interface RouteSubStepState {
  currentSubStep: RouteSubStep;
  cliente: string;
  clienteId: string;
  isNewClient: boolean;
  origen: string;
  destino: string;
  pricingResult: PricingResult | null;
  pricingError: string | null;
  isSearchingPrice: boolean;
  isCreatingRoute: boolean;
  matchType: MatchType;
  isNewRoute: boolean;
}

const SUB_STEP_ORDER: RouteSubStep[] = ['client', 'location', 'pricing', 'confirm'];

const INITIAL_STATE: RouteSubStepState = {
  currentSubStep: 'client',
  cliente: '',
  clienteId: '',
  isNewClient: false,
  origen: '',
  destino: '',
  pricingResult: null,
  pricingError: null,
  isSearchingPrice: false,
  isCreatingRoute: false,
  matchType: null,
  isNewRoute: false,
};

// Validate hydrated state to prevent inconsistent states
function validateHydratedState(state: Partial<RouteSubStepState>): Partial<RouteSubStepState> {
  const validated = { ...state };
  
  // If in 'location' but no client, go back to 'client'
  if (validated.currentSubStep === 'location' && !validated.cliente) {
    validated.currentSubStep = 'client';
  }
  // If in 'pricing' but missing client/origen/destino, go back appropriately
  if (validated.currentSubStep === 'pricing') {
    if (!validated.cliente) {
      validated.currentSubStep = 'client';
    } else if (!validated.origen || !validated.destino) {
      validated.currentSubStep = 'location';
    }
  }
  // If in 'confirm' but no pricingResult, go back to 'pricing'
  if (validated.currentSubStep === 'confirm' && !validated.pricingResult) {
    if (!validated.cliente) {
      validated.currentSubStep = 'client';
    } else if (!validated.origen || !validated.destino) {
      validated.currentSubStep = 'location';
    } else {
      validated.currentSubStep = 'pricing';
    }
  }
  
  return validated;
}

// Calculate progress score for comparing states
function calculateStateProgress(state: Partial<RouteSubStepState>): number {
  let score = 0;
  if (state.cliente) score += 1;
  if (state.clienteId) score += 1;
  if (state.origen) score += 1;
  if (state.destino) score += 1;
  if (state.pricingResult) score += 3;
  
  // Add score based on substep advancement
  const stepIndex = SUB_STEP_ORDER.indexOf(state.currentSubStep || 'client');
  score += stepIndex;
  
  return score;
}

export function useRouteSubSteps(initialState?: Partial<RouteSubStepState>) {
  // Track if we've done initial hydration
  const hasHydratedRef = useRef(false);
  const initialStateRef = useRef(initialState);
  
  // Compute validated initial state
  const validatedInitial = useMemo(() => {
    if (!initialState) return INITIAL_STATE;
    const validated = validateHydratedState(initialState);
    return { ...INITIAL_STATE, ...validated };
  }, []); // Empty deps - only compute once on mount
  
  const [state, setState] = useState<RouteSubStepState>(validatedInitial);

  // Handle late hydration: if initialState changes after mount with MORE data, rehydrate
  useEffect(() => {
    // Skip if no initial state provided
    if (!initialState) return;
    
    // Skip the first render (already handled by useState initial)
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }
    
    // Check if the new initialState has more progress than current state
    const newProgress = calculateStateProgress(initialState);
    const currentProgress = calculateStateProgress(state);
    
    // Only hydrate if new state has MORE progress (prevents loops and regression)
    if (newProgress > currentProgress) {
      const validated = validateHydratedState(initialState);
      const newState = { ...INITIAL_STATE, ...validated };
      setState(newState);
      console.log('[useRouteSubSteps] Late hydration applied (new progress:', newProgress, '> current:', currentProgress, ')');
    }
  }, [
    // Only react to meaningful changes in initialState
    initialState?.cliente,
    initialState?.clienteId,
    initialState?.origen,
    initialState?.destino,
    initialState?.pricingResult,
    initialState?.currentSubStep,
  ]);

  const goToSubStep = useCallback((step: RouteSubStep) => {
    setState(prev => ({ ...prev, currentSubStep: step }));
  }, []);

  const nextSubStep = useCallback(() => {
    const currentIndex = SUB_STEP_ORDER.indexOf(state.currentSubStep);
    if (currentIndex < SUB_STEP_ORDER.length - 1) {
      setState(prev => ({ ...prev, currentSubStep: SUB_STEP_ORDER[currentIndex + 1] }));
    }
  }, [state.currentSubStep]);

  const previousSubStep = useCallback(() => {
    const currentIndex = SUB_STEP_ORDER.indexOf(state.currentSubStep);
    if (currentIndex > 0) {
      setState(prev => ({ ...prev, currentSubStep: SUB_STEP_ORDER[currentIndex - 1] }));
    }
  }, [state.currentSubStep]);

  const setCliente = useCallback((cliente: string, clienteId: string, isNewClient: boolean) => {
    setState(prev => ({
      ...prev,
      cliente,
      clienteId,
      isNewClient,
      // Reset downstream data when client changes
      origen: '',
      destino: '',
      pricingResult: null,
      pricingError: null,
    }));
  }, []);

  const setOrigen = useCallback((origen: string) => {
    setState(prev => ({
      ...prev,
      origen,
      // Reset destino when origen changes
      destino: '',
      pricingResult: null,
      pricingError: null,
    }));
  }, []);

  const setDestino = useCallback((destino: string) => {
    setState(prev => ({
      ...prev,
      destino,
      pricingResult: null,
      pricingError: null,
    }));
  }, []);

  const setPricingResult = useCallback((result: PricingResult | null) => {
    setState(prev => ({
      ...prev,
      pricingResult: result,
      pricingError: null,
      isSearchingPrice: false,
    }));
  }, []);

  const setPricingError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      pricingError: error,
      pricingResult: null,
      isSearchingPrice: false,
    }));
  }, []);

  const setIsSearchingPrice = useCallback((isSearching: boolean) => {
    setState(prev => ({ ...prev, isSearchingPrice: isSearching }));
  }, []);

  const setIsCreatingRoute = useCallback((isCreating: boolean) => {
    setState(prev => ({ ...prev, isCreatingRoute: isCreating }));
  }, []);

  const setMatchType = useCallback((matchType: MatchType) => {
    setState(prev => ({ ...prev, matchType }));
  }, []);

  const setIsNewRoute = useCallback((isNewRoute: boolean) => {
    setState(prev => ({ ...prev, isNewRoute }));
  }, []);

  const resetState = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Allow external hydration (e.g., when formData is restored)
  const hydrateState = useCallback((newState: Partial<RouteSubStepState>) => {
    const validated = validateHydratedState(newState);
    setState(prev => ({ ...prev, ...validated }));
  }, []);

  const getSubStepIndex = useCallback((step: RouteSubStep) => {
    return SUB_STEP_ORDER.indexOf(step);
  }, []);

  const isSubStepComplete = useCallback((step: RouteSubStep) => {
    switch (step) {
      case 'client':
        return !!state.cliente;
      case 'location':
        return !!state.origen && !!state.destino;
      case 'pricing':
        return !!state.pricingResult;
      case 'confirm':
        return false; // Confirm is always the last action
      default:
        return false;
    }
  }, [state.cliente, state.origen, state.destino, state.pricingResult]);

  const canNavigateToSubStep = useCallback((step: RouteSubStep) => {
    const targetIndex = SUB_STEP_ORDER.indexOf(step);
    const currentIndex = SUB_STEP_ORDER.indexOf(state.currentSubStep);
    
    // Can always go back
    if (targetIndex < currentIndex) return true;
    
    // Can only go forward if previous steps are complete
    for (let i = 0; i < targetIndex; i++) {
      if (!isSubStepComplete(SUB_STEP_ORDER[i])) return false;
    }
    return true;
  }, [state.currentSubStep, isSubStepComplete]);

  // Get state for persistence (serializable subset)
  const getStateForPersistence = useCallback(() => ({
    currentSubStep: state.currentSubStep,
    cliente: state.cliente,
    clienteId: state.clienteId,
    isNewClient: state.isNewClient,
    origen: state.origen,
    destino: state.destino,
    pricingResult: state.pricingResult,
    matchType: state.matchType,
    isNewRoute: state.isNewRoute,
  }), [state.currentSubStep, state.cliente, state.clienteId, state.isNewClient, 
      state.origen, state.destino, state.pricingResult, state.matchType, state.isNewRoute]);

  return {
    state,
    subStepOrder: SUB_STEP_ORDER,
    goToSubStep,
    nextSubStep,
    previousSubStep,
    setCliente,
    setOrigen,
    setDestino,
    setPricingResult,
    setPricingError,
    setIsSearchingPrice,
    setIsCreatingRoute,
    setMatchType,
    setIsNewRoute,
    resetState,
    hydrateState,
    getSubStepIndex,
    isSubStepComplete,
    canNavigateToSubStep,
    getStateForPersistence,
  };
}
