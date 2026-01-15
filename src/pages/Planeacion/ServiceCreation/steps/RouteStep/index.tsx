import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, User, MapPin, DollarSign, CheckCircle } from 'lucide-react';
import { useServiceCreation } from '../../hooks/useServiceCreation';
import { useRouteSubSteps, PricingResult, RouteSubStepState } from './hooks/useRouteSubSteps';
import { usePricingSearch } from './hooks/usePricingSearch';
import { ClientSearchSubStep } from './substeps/ClientSearchSubStep';
import { LocationSubStep } from './substeps/LocationSubStep';
import { PricingSubStep } from './substeps/PricingSubStep';
import { RouteConfirmSubStep } from './substeps/RouteConfirmSubStep';
import type { RouteSubStep as RouteSubStepType } from './hooks/useRouteSubSteps';

// Contextual titles for each substep
const SUBSTEP_CONFIG: Record<RouteSubStepType, { title: string; description: string; icon: React.ElementType }> = {
  client: { title: 'Seleccionar Cliente', description: 'Busca o crea un nuevo cliente', icon: User },
  location: { title: 'Origen y Destino', description: 'Define los puntos de la ruta', icon: MapPin },
  pricing: { title: 'Cotización', description: 'Revisa el precio sugerido', icon: DollarSign },
  confirm: { title: 'Confirmar Ruta', description: 'Verifica los datos antes de continuar', icon: CheckCircle },
};

export default function RouteStep() {
  const { formData, updateFormData, nextStep, markStepCompleted } = useServiceCreation();
  
  // Build initial state from persisted formData
  const initialRouteState: Partial<RouteSubStepState> = {
    currentSubStep: formData.routeSubStep || 'client',
    cliente: formData.cliente || '',
    clienteId: formData.clienteId || '',
    isNewClient: formData.isNewClient || false,
    origen: formData.origen || '',
    destino: formData.destino || '',
    isNewOrigen: formData.isNewOrigen || false,
    isNewDestino: formData.isNewDestino || false,
    pricingResult: formData.pricingResult || null,
    matchType: formData.matchType || null,
    isNewRoute: formData.isNewRoute || false,
  };
  
  const {
    state,
    goToSubStep,
    nextSubStep,
    previousSubStep,
    setCliente,
    setOrigen,
    setDestino,
    setPricingResult,
    setPricingError,
    setIsSearchingPrice,
    setMatchType,
    setIsNewRoute,
    isSubStepComplete,
    canNavigateToSubStep,
    getStateForPersistence,
  } = useRouteSubSteps(initialRouteState);

  // Sync state changes back to context for persistence
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip first render to avoid unnecessary updates
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const persistableState = getStateForPersistence();
    updateFormData({
      routeSubStep: persistableState.currentSubStep,
      cliente: persistableState.cliente,
      clienteId: persistableState.clienteId,
      isNewClient: persistableState.isNewClient,
      origen: persistableState.origen,
      destino: persistableState.destino,
      isNewOrigen: persistableState.isNewOrigen,
      isNewDestino: persistableState.isNewDestino,
      pricingResult: persistableState.pricingResult,
      matchType: persistableState.matchType,
      isNewRoute: persistableState.isNewRoute,
    });
  }, [state.currentSubStep, state.cliente, state.clienteId, state.isNewClient,
      state.origen, state.destino, state.isNewOrigen, state.isNewDestino, 
      state.pricingResult, state.matchType, state.isNewRoute]);

  // Pricing search hook
  const {
    searchPrice,
    pricingResult,
    pricingError,
    isSearching,
    matchType,
    clearPricing
  } = usePricingSearch();

  // Handle client selection
  const handleClientSelect = useCallback((cliente: string, clienteId: string, isNewClient: boolean) => {
    setCliente(cliente, clienteId, isNewClient);
    updateFormData({ cliente, clienteId });
    clearPricing();
  }, [setCliente, updateFormData, clearPricing]);

  // Handle origin change
  const handleOrigenChange = useCallback((origen: string, isNew: boolean) => {
    setOrigen(origen, isNew);
    clearPricing();
  }, [setOrigen, clearPricing]);

  // Handle destination change
  const handleDestinoChange = useCallback((destino: string, isNew: boolean) => {
    setDestino(destino, isNew);
  }, [setDestino]);

  // Handle price search - skip if new origin or destination
  const handleSearchPrice = useCallback(async () => {
    if (!state.cliente || !state.origen || !state.destino) return;
    // Don't search if either is new - they won't be in the pricing matrix
    if (state.isNewOrigen || state.isNewDestino) return;
    
    setIsSearchingPrice(true);
    await searchPrice(state.cliente, state.origen, state.destino);
    setIsSearchingPrice(false);
  }, [state.cliente, state.origen, state.destino, state.isNewOrigen, state.isNewDestino, searchPrice, setIsSearchingPrice]);


  // Handle pricing confirmation - move to confirm step
  const handlePricingConfirm = useCallback(() => {
    if (pricingResult) {
      setPricingResult(pricingResult);
      setMatchType(matchType);
      setIsNewRoute(false);
      nextSubStep();
    }
  }, [pricingResult, matchType, setPricingResult, setMatchType, setIsNewRoute, nextSubStep]);

  // Handle retry search
  const handleRetrySearch = useCallback(() => {
    clearPricing();
    handleSearchPrice();
  }, [clearPricing, handleSearchPrice]);


  // Handle route created from inline form
  const handleRouteCreated = useCallback((result: PricingResult) => {
    setPricingResult(result);
    setMatchType('exact');
    setIsNewRoute(true);
    nextSubStep();
  }, [setPricingResult, setMatchType, setIsNewRoute, nextSubStep]);

  // Handle edit from confirmation step
  const handleEditRoute = useCallback(() => {
    goToSubStep('location');
  }, [goToSubStep]);

  // Handle final route confirmation
  const handleRouteComplete = useCallback(() => {
    if (state.pricingResult || pricingResult) {
      const result = state.pricingResult || pricingResult;
      updateFormData({
        cliente: state.cliente,
        clienteId: state.clienteId,
        origen: state.origen,
        destino: state.destino,
        precioCotizado: result?.precio_sugerido || null,
        routeData: {
          ...result,
          cliente_nombre: state.cliente,
          origen_texto: state.origen,
          destino_texto: state.destino,
        },
      });
      markStepCompleted('route');
      nextStep();
    }
  }, [state, pricingResult, updateFormData, markStepCompleted, nextStep]);

  // Render current substep
  const renderSubStep = () => {
    switch (state.currentSubStep) {
      case 'client':
        return (
          <ClientSearchSubStep
            selectedCliente={state.cliente}
            isNewClient={state.isNewClient}
            onClientSelect={handleClientSelect}
            onContinue={nextSubStep}
          />
        );
      case 'location':
        return (
          <LocationSubStep
            clienteNombre={state.cliente}
            selectedOrigen={state.origen}
            selectedDestino={state.destino}
            isNewOrigen={state.isNewOrigen}
            isNewDestino={state.isNewDestino}
            onOrigenChange={handleOrigenChange}
            onDestinoChange={handleDestinoChange}
            onSearchPrice={handleSearchPrice}
            isSearchingPrice={isSearching}
          />
        );
      case 'pricing':
        return (
          <PricingSubStep
            cliente={state.cliente}
            origen={state.origen}
            destino={state.destino}
            pricingResult={pricingResult}
            pricingError={pricingError}
            isSearching={isSearching}
            matchType={matchType}
            onConfirm={handlePricingConfirm}
            onRetry={handleRetrySearch}
            onRouteCreated={handleRouteCreated}
          />
        );
      case 'confirm':
        const finalResult = state.pricingResult || pricingResult;
        if (!finalResult) {
          goToSubStep('pricing');
          return null;
        }
        return (
          <RouteConfirmSubStep
            cliente={state.cliente}
            origen={state.origen}
            destino={state.destino}
            pricingResult={finalResult}
            matchType={state.matchType || matchType}
            isNewRoute={state.isNewRoute}
            onEdit={handleEditRoute}
            onConfirm={handleRouteComplete}
          />
        );
      default:
        return null;
    }
  };

  // Navigation button visibility
  const showBackButton = state.currentSubStep !== 'client';
  const showNextButton = state.currentSubStep !== 'confirm' && 
    state.currentSubStep !== 'pricing' && 
    isSubStepComplete(state.currentSubStep);
  // No confirm button needed - it's in RouteConfirmSubStep now
  const showConfirmButton = false;

  const currentConfig = SUBSTEP_CONFIG[state.currentSubStep];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="space-y-6">
      {/* Contextual header for current substep */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <CurrentIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{currentConfig.title}</h2>
          <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
        </div>
      </div>

      {/* Current substep content */}
      <div className="transition-all duration-300 ease-in-out">
        {renderSubStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          {showBackButton && (
            <Button
              type="button"
              variant="ghost"
              onClick={previousSubStep}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {showNextButton && (
            <Button
              type="button"
              onClick={nextSubStep}
              className="gap-2"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {showConfirmButton && (
            <Button
              type="button"
              onClick={handleRouteComplete}
              className="gap-2"
              disabled={state.isCreatingRoute}
            >
              {state.isCreatingRoute ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  Continuar a Servicio
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
