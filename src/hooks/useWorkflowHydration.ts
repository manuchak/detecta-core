/**
 * Hook consolidado para manejar la hidratación del workflow de creación de servicios.
 * Elimina la duplicación de useEffects y previene condiciones de carrera.
 */

import { useEffect, useRef, useCallback, useState, MutableRefObject } from 'react';
import { toast } from 'sonner';

interface WorkflowState {
  currentStep: 'route' | 'service' | 'assignment' | 'armed_assignment' | 'final_confirmation';
  routeData: any;
  serviceData: any;
  assignmentData: any;
  armedAssignmentData: any;
  createdServiceDbId: string | null;
  modifiedSteps: string[];
}

interface PersistedData extends WorkflowState {
  sessionId?: string;
  drafts?: any;
  lastEditedStep?: string;
}

interface HydrationConfig {
  persistedData: PersistedData;
  localState: WorkflowState;
  setters: {
    setCurrentStep: (step: WorkflowState['currentStep']) => void;
    setRouteData: (data: any) => void;
    setServiceData: (data: any) => void;
    setAssignmentData: (data: any) => void;
    setArmedAssignmentData: (data: any) => void;
    setCreatedServiceDbId: (id: string | null) => void;
    setModifiedSteps: (steps: string[]) => void;
  };
  skipHydrationRef: MutableRefObject<boolean>;
  autoRestoreDoneRef: MutableRefObject<boolean>;
  sessionIdRef: MutableRefObject<string>;
  isRestoring: boolean;
  hasDraft: boolean;
  restoreDraft: () => void;
}

interface HydrationResult {
  showRestoredBanner: boolean;
  setShowRestoredBanner: (show: boolean) => void;
  handleDismissBanner: () => void;
  handleStartFresh: () => void;
}

const STEP_ORDER = ['route', 'service', 'assignment', 'armed_assignment', 'final_confirmation'];

/**
 * Calcula cuántos pasos tienen datos significativos
 */
function countMeaningfulSteps(state: Partial<WorkflowState>): number {
  return [
    state.routeData,
    state.serviceData,
    state.assignmentData,
    state.armedAssignmentData
  ].filter(Boolean).length;
}

/**
 * Determina si los datos persistidos están "adelante" del estado local
 */
function isPersistedAhead(persistedStep: string, localStep: string): boolean {
  const persistedIndex = STEP_ORDER.indexOf(persistedStep);
  const localIndex = STEP_ORDER.indexOf(localStep);
  return persistedIndex >= localIndex;
}

/**
 * Hook consolidado que maneja:
 * 1. Hidratación inicial al montar
 * 2. Restauración forzada desde banner
 * 3. Reconciliación al volver de otra pestaña
 */
export function useWorkflowHydration(config: HydrationConfig): HydrationResult {
  const {
    persistedData,
    localState,
    setters,
    skipHydrationRef,
    autoRestoreDoneRef,
    isRestoring,
    hasDraft,
    restoreDraft,
  } = config;

  const [bannerVisible, setBannerVisible] = useState(false);

  /**
   * Aplica los datos persistidos al estado local
   */
  const hydrateFromPersisted = useCallback(() => {
    setters.setCurrentStep(persistedData.currentStep);
    setters.setRouteData(persistedData.routeData);
    setters.setServiceData(persistedData.serviceData);
    setters.setAssignmentData(persistedData.assignmentData);
    setters.setArmedAssignmentData(persistedData.armedAssignmentData);
    setters.setCreatedServiceDbId(persistedData.createdServiceDbId);
    setters.setModifiedSteps(persistedData.modifiedSteps);
    setBannerVisible(true);
  }, [persistedData, setters]);

  /**
   * EFECTO ÚNICO: Maneja toda la lógica de hidratación
   */
  useEffect(() => {
    // Skip si el flag está activo (después de "empezar de nuevo")
    if (skipHydrationRef.current) {
      console.log('⏭️ [useWorkflowHydration] Skipping due to skipHydrationRef');
      skipHydrationRef.current = false;
      return;
    }

    // Skip durante restauración activa
    if (isRestoring) return;

    // Verificar flags de sesión
    const suppressionFlag = sessionStorage.getItem('scw_suppress_restore');
    const forceRestoreFlag = sessionStorage.getItem('scw_force_restore');

    // Si hay suppression, no hacer nada
    if (suppressionFlag === '1') {
      console.log('🚫 [useWorkflowHydration] Suppression flag active');
      return;
    }

    // Calcular si debemos hidratar
    const persistedMeaningful = countMeaningfulSteps(persistedData);
    const localMeaningful = countMeaningfulSteps(localState);
    const persistedIsAhead = isPersistedAhead(persistedData.currentStep, localState.currentStep);

    // Caso 1: Force restore explícito
    if (forceRestoreFlag === '1' && hasDraft) {
      console.log('🎯 [useWorkflowHydration] Force restore triggered');
      sessionStorage.removeItem('scw_force_restore');
      hydrateFromPersisted();
      return;
    }

    // Caso 2: Auto-restore inicial
    if (hasDraft && !autoRestoreDoneRef.current) {
      console.log('🔄 [useWorkflowHydration] Initial auto-restore');
      autoRestoreDoneRef.current = true;
      restoreDraft();
      setBannerVisible(true);
      return;
    }

    // Caso 3: Hidratación por datos más completos
    const shouldHydrate = (
      persistedMeaningful > localMeaningful &&
      persistedIsAhead &&
      !isRestoring
    );

    if (shouldHydrate) {
      console.log('🔄 [useWorkflowHydration] Hydrating from persisted data:', {
        persistedMeaningful,
        localMeaningful,
        step: persistedData.currentStep
      });
      hydrateFromPersisted();
    }
  }, [
    persistedData.currentStep,
    persistedData.routeData,
    persistedData.serviceData,
    persistedData.assignmentData,
    persistedData.armedAssignmentData,
    hasDraft,
    isRestoring,
    hydrateFromPersisted,
    restoreDraft,
    skipHydrationRef,
    autoRestoreDoneRef,
    localState
  ]);

  /**
   * EFECTO: Reconciliación al volver de otra pestaña
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const persistedMeaningful = countMeaningfulSteps(persistedData);
        const localMeaningful = countMeaningfulSteps(localState);

        if (persistedMeaningful > localMeaningful) {
          console.log('👁️ [useWorkflowHydration] Tab return - hydrating more complete state');
          hydrateFromPersisted();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [persistedData, localState, hydrateFromPersisted]);

  const handleDismissBanner = useCallback(() => {
    setBannerVisible(false);
  }, []);

  const handleStartFresh = useCallback(() => {
    sessionStorage.setItem('scw_suppress_restore', '1');
    skipHydrationRef.current = true;
    setBannerVisible(false);
    toast.info('Comenzando desde cero');
  }, [skipHydrationRef]);

  return {
    showRestoredBanner: bannerVisible,
    setShowRestoredBanner: setBannerVisible,
    handleDismissBanner,
    handleStartFresh,
  };
}
