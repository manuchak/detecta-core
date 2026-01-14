import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useServiceCreation } from '../../hooks/useServiceCreation';
import { useRouteSubSteps, PricingResult } from './hooks/useRouteSubSteps';
import { usePricingSearch } from './hooks/usePricingSearch';
import { RouteSubStepIndicator } from './RouteSubStepIndicator';
import { ClientSearchSubStep } from './substeps/ClientSearchSubStep';
import { LocationSubStep } from './substeps/LocationSubStep';
import { PricingSubStep } from './substeps/PricingSubStep';
import { RouteConfirmSubStep } from './substeps/RouteConfirmSubStep';

export default function RouteStep() {
  const { updateFormData, nextStep } = useServiceCreation();
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
  } = useRouteSubSteps();

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
  const handleOrigenChange = useCallback((origen: string) => {
    setOrigen(origen);
    clearPricing();
  }, [setOrigen, clearPricing]);

  // Handle destination change - also triggers price search
  const handleDestinoChange = useCallback((destino: string) => {
    setDestino(destino);
  }, [setDestino]);

  // Handle price search
  const handleSearchPrice = useCallback(async () => {
    if (!state.cliente || !state.origen || !state.destino) return;
    
    setIsSearchingPrice(true);
    await searchPrice(state.cliente, state.origen, state.destino);
    setIsSearchingPrice(false);
  }, [state.cliente, state.origen, state.destino, searchPrice, setIsSearchingPrice]);

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
      nextStep();
    }
  }, [state, pricingResult, updateFormData, nextStep]);

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
            onOrigenChange={handleOrigenChange}
            onDestinoChange={handleDestinoChange}
            onSearchPrice={handleSearchPrice}
            isSearchingPrice={isSearching}
            onContinue={nextSubStep}
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

  return (
    <div className="space-y-6">
      {/* Sub-step indicator */}
      <RouteSubStepIndicator
        currentSubStep={state.currentSubStep}
        isSubStepComplete={isSubStepComplete}
        canNavigateToSubStep={canNavigateToSubStep}
        onSubStepClick={goToSubStep}
      />

      {/* Current substep content with transition */}
      <div className="min-h-[300px] transition-all duration-300 ease-in-out">
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
